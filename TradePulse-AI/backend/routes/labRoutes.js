const express = require('express');
const User = require('../models/User');
const { getImporters, getExporters } = require('../utils/csvHelper');
const tradeCupid = require('../services/tradeCupidEngine');
const router = express.Router();

/**
 * GET /api/lab/candidates
 * Returns a list of available companies from the live database
 */
router.get('/candidates', async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['importer', 'exporter'] } }).limit(50);
        const dbImporters = users.filter(u => u.role === 'importer').map(i => ({ ...i.toObject(), id: i._id, name: i.tradeProfile?.companyName || i.name }));
        const dbExporters = users.filter(u => u.role === 'exporter').map(e => ({ ...e.toObject(), id: e._id, name: e.tradeProfile?.companyName || e.name }));

        const csvImporters = getImporters().slice(0, 150).map(i => ({ ...i, role: 'importer', id: i.Buyer_ID, name: i.Company_Name || i.Buyer_ID }));
        const csvExporters = getExporters().slice(0, 150).map(e => ({ ...e, role: 'exporter', id: e.Exporter_ID, name: e.Company_Name || e.Exporter_ID }));

        const importers = [...dbImporters, ...csvImporters];
        const exporters = [...dbExporters, ...csvExporters];

        return res.json({ importers, exporters });
    } catch (err) {
        return res.status(500).json({ message: 'Error loading dataset.' });
    }
});

/**
 * POST /api/lab/evaluate
 * Evaluates a specific anchor against the whole dataset
 */
router.post('/evaluate', async (req, res) => {
    const { anchorId, anchorRole } = req.body;
    try {
        const anchorUser = await User.findById(anchorId);
        if (!anchorUser) return res.status(404).json({ message: 'Anchor not found in dataset.' });

        const oppositeRole = anchorRole === 'importer' ? 'exporter' : 'importer';
        const rawCandidates = await User.find({ role: oppositeRole, _id: { $ne: anchorId } }).limit(50);

        const anchor = tradeCupid.userToProfile(anchorUser);

        const dbCandidates = rawCandidates.map(u => ({
            _id: u._id.toString(),
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

        const csvRaw = oppositeRole === 'importer' ? getImporters() : getExporters();
        const csvCandidates = csvRaw.slice(0, 150).map(c => ({
            ...c,
            _id: oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID,
            Company_Name: c.Company_Name || (oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID)
        }));

        const candidates = [...dbCandidates, ...csvCandidates];

        const results = await tradeCupid.getMatches(anchor, candidates);
        return res.json({ matches: results.slice(0, 50) }); // Return top 50 for lab
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Evaluation failed.' });
    }
});

module.exports = router;
