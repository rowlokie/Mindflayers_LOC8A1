const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/* ── Gemini helper ────────────────────────────────────────────── */
async function callGemini(prompt, model = 'gemini-1.5-flash') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
                }),
            }
        );
        const data = await res.json();

        if (data.error) {
            // Fallback to gemini-pro if flash fails
            if (model === 'gemini-1.5-flash' && (data.error.message.includes('not found') || data.error.message.includes('not supported') || data.error.code === 404)) {
                return callGemini(prompt, 'gemini-pro');
            }
            throw new Error(data.error.message);
        }

        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Clean markdown backticks if AI wrapped response in them
        return raw.replace(/```[a-z]*\n?|```/g, '').trim();
    } catch (err) {
        if (model === 'gemini-1.5-flash') {
            return callGemini(prompt, 'gemini-pro');
        }
        throw err;
    }
}

/* ── Generate outreach message (called internally from swipeRoutes) */
async function generateOutreachMessage(sender, receiver) {
    const sp = sender.tradeProfile || {};
    const rp = receiver.tradeProfile || {};

    const prompt = `You are a professional B2B trade matchmaker AI. 
Write a short, warm, professional outreach message FROM ${sender.name} (${sender.role}, ${sp.companyName || 'Company'}, ${sp.industry}, ${sp.country}) 
TO ${receiver.name} (${receiver.role}, ${rp.companyName || 'Company'}, ${rp.industry}, ${rp.country}).
The message should:
- Be 3-4 sentences max
- Sound personal and genuine, not like a template
- Mention specific details like industry, products/needs
- End with a clear call to action (schedule a call, explore partnership)
- Be ready to send directly in a business chat
Just write the message text, no subject line, no placeholders.`;

    return callGemini(prompt);
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/generate-message
   Generate personalized outreach for a specific connection
──────────────────────────────────────────────────────────────── */
router.post('/generate-message', protect, async (req, res) => {
    const { partnerId } = req.body;
    try {
        const partner = await User.findById(partnerId).select('-password');
        if (!partner) return res.status(404).json({ message: 'Partner not found.' });
        const msg = await generateOutreachMessage(req.user, partner);
        return res.json({ message: msg });
    } catch (err) {
        return res.status(500).json({ message: err.message || 'AI error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/chat
   AI chatbot with full platform context
──────────────────────────────────────────────────────────────── */
router.post('/chat', protect, async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: 'message required.' });

    try {
        const me = req.user;
        const p = me.tradeProfile || {};

        // Build context
        const context = `
You are TradePulse AI — an intelligent B2B trade matchmaking assistant embedded inside the TradePulse platform.

PLATFORM CONTEXT:
TradePulse AI connects global exporters and importers using AI-powered matching, swipe-based discovery, automated outreach, and meeting scheduling.

CURRENT USER:
- Name: ${me.name}
- Role: ${me.role}
- Industry: ${p.industry || 'Not set'}
- Company: ${p.companyName || 'Not set'}
- Country: ${p.country || 'Not set'}
- Region: ${p.region || 'Not set'}
- Budget Range: ${p.budgetRange || 'Not set'}
- Verification: ${me.verificationStatus}
- Certifications: ${(p.certifications || p.certificationRequired || []).join(', ') || 'None listed'}
${me.role === 'exporter' ? `- Products: ${(p.productsCategories || []).join(', ')}` : ''}
${me.role === 'importer' ? `- Buying Requirements: ${p.buyingRequirements || 'Not specified'}` : ''}

FEATURES AVAILABLE:
- Swipe to Match: Discover trade partners with a swipe
- AI Recommendations: Top matches based on trade profile scoring
- Connections & Chat: Message matched partners, send AI-generated outreach
- Meeting Scheduler: Propose and confirm video meetings (Jitsi Meet)
- Admin Panel (if admin): Approve/reject users, ban, promote

CONVERSATION HISTORY:
${history.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n')}

Respond helpfully, concisely, and professionally. If asked about matches or recommendations, guide the user to use the Swipe or Recommendations feature. Keep answers under 150 words unless a detailed explanation is needed.`;

        const response = await callGemini(`${context}\n\nUser: ${message}\n\nAI:`);
        return res.json({ response });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'AI error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/trade-insights
   AI analysis of user's trade profile with improvement suggestions
──────────────────────────────────────────────────────────────── */
router.post('/trade-insights', protect, async (req, res) => {
    try {
        const me = req.user;
        const p = me.tradeProfile || {};

        const prompt = `You are a B2B trade expert. Analyze this trade profile and provide 3-4 actionable insights:

Role: ${me.role}
Company: ${p.companyName}
Industry: ${p.industry}
Country: ${p.country}
Region: ${p.region}
Budget: ${p.budgetRange}
Certifications: ${(p.certifications || p.certificationRequired || []).join(', ')}
${me.role === 'exporter' ? `Products: ${(p.productsCategories || []).join(', ')}, Target Markets: ${(p.exportingTo || []).join(', ')}` : ''}
${me.role === 'importer' ? `Quantity: ${p.quantityRequired} ${p.quantityUnit}, Requirements: ${p.buyingRequirements}` : ''}

Provide:
1. Profile Strength Score (0-100) with brief reason
2. Top 2 regions/countries they should target  
3. 1 certification they should get to attract better partners
4. 1 quick win action they can take today

Format as JSON: { score: number, targetMarkets: [string], recommendedCert: string, quickWin: string, summary: string }`;

        const raw = await callGemini(prompt);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: raw };
        return res.json({ insights });
    } catch (err) {
        return res.status(500).json({ message: err.message || 'AI error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/recommendations
   Finds top 5 matches and generates AI reasoning for each
──────────────────────────────────────────────────────────────── */
router.post('/recommendations', protect, async (req, res) => {
    try {
        const me = req.user;
        const p = me.tradeProfile || {};
        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';

        // 1. Get a pool of candidates
        const candidates = await User.find({
            role: oppositeRole,
            verificationStatus: 'approved',
            isOnboarded: true,
            _id: { $ne: me._id }
        }).select('name tradeProfile role').limit(15);

        // 2. Simple score + select top 5
        const scored = candidates.map(c => {
            let score = 50; // baseline
            const cp = c.tradeProfile || {};
            if (cp.industry === p.industry) score += 30;
            if (cp.region === p.region) score += 10;
            return { user: c, score: Math.min(score, 100) };
        }).sort((a, b) => b.score - a.score).slice(0, 5);

        // 3. Generate AI reasoning for the top 5
        const prompt = `
      Current User: ${me.name} (${me.role} in ${p.industry}). Buying/Selling: ${p.buyingRequirements || (p.productsCategories || []).join(', ')}.
      Candidates:
      ${scored.map((s, i) => `${i + 1}. ${s.user.name} (${s.user.role}): ${s.user.tradeProfile?.industry} based in ${s.user.tradeProfile?.country}. Requirements/Products: ${s.user.tradeProfile?.buyingRequirements || (s.user.tradeProfile?.productsCategories || []).join(', ')}.`).join('\n')}

      For each candidate, provide a 1-sentence "Match synergy" explaining why they are a great business fit for ${me.name}. Return as a JSON array of strings: ["reason 1", "reason 2"...]
    `;

        let reasons = [];
        try {
            const aiRes = await callGemini(prompt);
            // Clean JSON if needed
            const jsonStr = aiRes.match(/\[.*\]/s)?.[0] || '[]';
            reasons = JSON.parse(jsonStr);
        } catch (e) {
            reasons = scored.map(() => "High industry alignment and complementary trade requirements.");
        }

        const result = scored.map((s, i) => ({
            ...s,
            aiReason: reasons[i] || "Strategic partnership potential based on regional trade flow."
        }));

        return res.json({ recommendations: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'AI error.' });
    }
});

module.exports = router;
module.exports.generateOutreachMessage = generateOutreachMessage;
