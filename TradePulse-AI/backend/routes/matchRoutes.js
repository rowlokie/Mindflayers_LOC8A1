const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const tradeCupid = require('../services/tradeCupidEngine');
const { getImporters, getExporters } = require('../utils/csvHelper');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/match/recommendations
   Unified TradeCupid recommendations (MongoDB)
──────────────────────────────────────────────────────────────── */
router.get('/recommendations', protect, async (req, res) => {
    const me = req.user;
    if (me.verificationStatus !== 'approved')
        return res.status(403).json({ message: 'Account not yet verified.' });

    try {
        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';
        const anchor = tradeCupid.userToProfile(me);

        // Fetch & Score Leads from MongoDB (limit 50)
        const dbUsers = await User.find({ role: oppositeRole, _id: { $ne: me._id } }).limit(50);

        const dbCandidates = dbUsers.map(u => ({
            _id: u._id.toString(),
            Buyer_ID: u._id.toString(),
            Exporter_ID: u._id.toString(),
            Company_Name: u.tradeProfile?.companyName || u.name,
            Industry: u.tradeProfile?.industry || 'General',
            Country: u.tradeProfile?.country || 'Global',
            State: u.tradeProfile?.region || 'Global',
            Manufacturing_Capacity_Tons: parseFloat(u.tradeProfile?.capacity) || 1000,
            Avg_Order_Tons: parseFloat(u.tradeProfile?.quantityRequired) || 50,
            Revenue_Size_USD: u.tradeProfile?.budgetMax || 1000000,
            Team_Size: 50,
            Certification: u.tradeProfile?.certifications || [],
            ...u.tradeProfile
        }));

        // Fetch from CSV dataset (Limit 150)
        const csvRaw = oppositeRole === 'importer' ? getImporters() : getExporters();
        const csvCandidates = csvRaw.slice(0, 150).map(c => ({
            ...c,
            _id: oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID,
            Company_Name: c.Company_Name || (oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID)
        }));

        const mergedCandidates = [...dbCandidates, ...csvCandidates];

        const matches = await tradeCupid.getMatches(anchor, mergedCandidates);
        const topMatches = matches.slice(0, 15);

        const scored = topMatches.map(r => {
            const id = r._id;
            return {
                score: r.matchScore,
                breakdown: r.breakdown,
                aiReason: r.aiReason,
                source: 'Live Database',
                user: {
                    id: id,
                    name: r.Company_Name,
                    role: oppositeRole,
                    tradeProfile: {
                        companyName: r.Company_Name,
                        industry: r.Industry,
                        country: r.Country,
                        certifications: r.Certification
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
