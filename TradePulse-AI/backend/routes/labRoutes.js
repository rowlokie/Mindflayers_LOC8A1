const express = require('express');
const { getImporters, getExporters } = require('../utils/csvHelper');
const tradeCupid = require('../services/tradeCupidEngine');
const router = express.Router();

/**
 * GET /api/lab/candidates
 * Returns a list of available companies from the dataset
 */
router.get('/candidates', (req, res) => {
    try {
        const importers = getImporters().map(i => ({ ...i, role: 'importer', id: i.Buyer_ID, name: i.Company_Name || i.Buyer_ID }));
        const exporters = getExporters().map(e => ({ ...e, role: 'exporter', id: e.Exporter_ID, name: e.Company_Name || e.Exporter_ID }));
        return res.json({ importers, exporters });
    } catch (err) {
        return res.status(500).json({ message: 'Error loading dataset.' });
    }
});

/**
 * POST /api/lab/evaluate
 * Evaluates a specific anchor against the whole dataset
 */
router.post('/evaluate', (req, res) => {
    const { anchorId, anchorRole } = req.body;
    try {
        const importers = getImporters();
        const exporters = getExporters();

        let anchor = null;
        let candidates = [];

        if (anchorRole === 'importer') {
            anchor = importers.find(i => i.Buyer_ID === anchorId);
            candidates = exporters;
        } else {
            anchor = exporters.find(e => e.Exporter_ID === anchorId);
            candidates = importers;
        }

        if (!anchor) return res.status(404).json({ message: 'Anchor not found in dataset.' });

        const results = tradeCupid.getMatches(anchor, candidates);
        return res.json({ matches: results.slice(0, 50) }); // Return top 50 for lab
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Evaluation failed.' });
    }
});

module.exports = router;
