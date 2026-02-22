const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const tradeCupid = require('../services/tradeCupidEngine');
const { getImporters, getExporters } = require('../utils/csvHelper');

const router = express.Router();

/* ── AI Service (OpenRouter) ─────────────────────────────────── */
async function callOpenRouter(prompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('CRITICAL: OPENROUTER_API_KEY is missing from process.env');
        throw new Error('OPENROUTER_API_KEY not set.');
    }

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://tradepulse-ai.com", // Optional, for OpenRouter rankings
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-exp:free",
                "messages": [{ "role": "user", "content": prompt }]
            })
        });
        const data = await res.json();
        if (data.error) {
            console.error('OpenRouter API Error:', data.error);
            return "Strategic partnership potential based on mutual industry requirements.";
        }
        return data.choices?.[0]?.message?.content || "Strategic partnership potential.";
    } catch (err) {
        console.error('OpenRouter Error:', err);
        return "High industry alignment and complementary trade requirements.";
    }
}

async function callGemini(prompt) { return callOpenRouter(prompt); }

/* ── Generate outreach message (called internally from swipeRoutes) */
async function generateOutreachMessage(sender, receiver) {
    const sp = sender.tradeProfile || {};
    const rp = receiver.tradeProfile || (receiver.Industry ? { industry: receiver.Industry, country: receiver.Country || receiver.State } : {});
    const rName = receiver.name || receiver.Company_Name || receiver.Buyer_ID || receiver.Exporter_ID;

    const prompt = `You are a professional B2B trade matchmaker AI. 
Write a short, professional outreach message FROM ${sender.name} (${sender.role}, ${sp.companyName || 'Company'}, ${sp.industry}, ${sp.country}) 
TO ${rName} (${receiver.role || 'Partner'}, ${rp.industry || 'Trade'}, ${rp.country || 'Global'}).
Context: ${sender.name} is interested in a trade link.
Requirements:
- 2-3 sentences max.
- Professional yet warm.
- Mention industry synergy.
- No subject line, no placeholders. Just the message text.`;

    return callOpenRouter(prompt);
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/generate-message
──────────────────────────────────────────────────────────────── */
router.post('/generate-message', protect, async (req, res) => {
    const { partnerId } = req.body;
    try {
        let partner;
        if (partnerId?.includes('_')) {
            const all = [...getImporters(), ...getExporters()];
            const row = all.find(r => (r.Buyer_ID || r.Exporter_ID) === partnerId);
            if (row) partner = { ...row, role: req.user.role === 'importer' ? 'exporter' : 'importer' };
        } else {
            partner = await User.findById(partnerId).select('-password');
        }

        if (!partner) return res.status(404).json({ message: 'Partner not found.' });
        const msg = await generateOutreachMessage(req.user, partner);
        return res.json({ message: msg });
    } catch (err) {
        return res.status(500).json({ message: err.message || 'AI error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/chat
──────────────────────────────────────────────────────────────── */
router.post('/chat', protect, async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: 'message required.' });

    try {
        const me = req.user;
        const p = me.tradeProfile || {};

        const context = `
You are TradePulse AI — an intelligent B2B trade matchmaking assistant.
CURRENT USER: ${me.name}, Role: ${me.role}, Industry: ${p.industry || 'Not set'}.
Features: Discover partners, AI Recommendations (TradeCupid), Meeting scheduling.
Respond professionally and concisely.`;

        const response = await callGemini(`${context}\n\nUser: ${message}\n\nAI:`);
        return res.json({ response });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'AI error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/recommendations
   Finds top matches from CSV Datasets using TradeCupid Engine
──────────────────────────────────────────────────────────────── */
router.post('/recommendations', protect, async (req, res) => {
    try {
        const me = req.user;
        const p = me.tradeProfile || {};

        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';
        const candidates = oppositeRole === 'importer' ? getImporters() : getExporters();

        if (!candidates || candidates.length === 0) {
            return res.status(404).json({ message: 'Dataset not found. Please ensure CSV files are in src/ folder.' });
        }

        const anchor = tradeCupid.userToProfile(me);

        // Score CSV Dataset Leads exclusively
        const matches = tradeCupid.getMatches(anchor, candidates).slice(0, 20);

        const topCsv = matches.map(match => ({
            score: match.matchScore,
            breakdown: match.breakdown,
            aiReason: match.aiReason,
            source: 'Dataset',
            user: {
                id: match.Exporter_ID || match.Buyer_ID,
                name: match.Company_Name || match.Exporter_ID || match.Buyer_ID,
                role: oppositeRole,
                tradeProfile: {
                    companyName: match.Company_Name || match.Exporter_ID || match.Buyer_ID,
                    industry: match.Industry,
                    country: match.Country || match.State || 'Global',
                    certifications: match.Certification ? [match.Certification] : []
                }
            }
        }));

        return res.json({ recommendations: topCsv });
    } catch (err) {
        console.error('MATCHING ERROR:', err);
        return res.status(500).json({ message: 'TradeCupid engine error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/trade-insights
──────────────────────────────────────────────────────────────── */
router.post('/trade-insights', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        let target = req.user; // Default to self

        if (userId) {
            if (userId.includes('_')) {
                const all = [...getImporters(), ...getExporters()];
                const row = all.find(r => (r.Buyer_ID || r.Exporter_ID) === userId);
                if (row) target = { name: row.Company_Name, tradeProfile: { industry: row.Industry, country: row.Country || row.State }, role: req.user.role === 'importer' ? 'exporter' : 'importer' };
            } else {
                target = await User.findById(userId) || req.user;
            }
        }

        const tp = target.tradeProfile || {};
        const prompt = `Analyze this trade profile and provide JSON insights: { score: number, summary: string, quickWin: string, recommendedCert: string, targetMarkets: string[] }
Profile: Name=${target.name || 'Company'}, Role=${target.role}, Industry=${tp.industry}, Country=${tp.country}`;

        const raw = await callOpenRouter(prompt);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: raw, score: 85 };
        return res.json({ insights });
    } catch (err) {
        console.error('Insights Error:', err);
        return res.status(500).json({ message: err.message || 'AI error.' });
    }
});

module.exports = router;
module.exports.generateOutreachMessage = generateOutreachMessage;
