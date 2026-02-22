const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const tradeCupid = require('../services/tradeCupidEngine');
const { getImporters, getExporters } = require('../utils/csvHelper');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/match/recommendations
   Unified TradeCupid recommendations (Platform + CSV)
──────────────────────────────────────────────────────────────── */
router.get('/recommendations', protect, async (req, res) => {
    const me = req.user;
    if (me.verificationStatus !== 'approved')
        return res.status(403).json({ message: 'Account not yet verified.' });

    try {
        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';
        const anchor = tradeCupid.userToProfile(me);

        // Fetch & Score CSV Dataset Leads exclusively
        const csvRows = oppositeRole === 'importer' ? getImporters() : getExporters();
        const matches = tradeCupid.getMatches(anchor, csvRows).slice(0, 15);

        const scored = matches.map(r => {
            const id = r.Buyer_ID || r.Exporter_ID;
            return {
                score: r.matchScore,
                breakdown: r.breakdown,
                aiReason: r.aiReason,
                source: 'Dataset',
                user: {
                    id: id,
                    name: r.Company_Name || id,
                    role: oppositeRole,
                    tradeProfile: {
                        companyName: r.Company_Name || id,
                        industry: r.Industry,
                        country: r.Country || r.State || 'Global',
                        certifications: r.Certification ? [r.Certification] : []
                    },
                },
            };
        });

        return res.json({ recommendations: scored, total: scored.length });
    } catch (err) {
        console.error('MatchRecs Error:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
