const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/* ──────────────────────────────────────────────────────────────────
   MATCHING ALGORITHM
   For Importer → find best Exporters
   For Exporter → find best Importers
───────────────────────────────────────────────────────────────── */

function scoreExporterForImporter(exporter, importerProfile) {
    const ep = exporter.tradeProfile || {};
    const ip = importerProfile || {};
    let score = 0;
    const breakdown = {};

    // 1. Industry alignment (40 pts)
    if (ep.industry && ip.industry && ep.industry === ip.industry) {
        score += 40; breakdown.industry = 40;
    } else { breakdown.industry = 0; }

    // 2. Region match (25 pts)
    const importerPrefRegion = ip.preferredRegion || '';
    const exporterRegion = ep.region || '';
    if (importerPrefRegion && exporterRegion &&
        importerPrefRegion.toLowerCase() === exporterRegion.toLowerCase()) {
        score += 25; breakdown.region = 25;
    } else { breakdown.region = 0; }

    // 3. Certification match (20 pts)
    const required = ip.certificationRequired || [];
    const offered = ep.certifications || [];
    if (required.length === 0) {
        score += 20; breakdown.certification = 20; // no requirement = full marks
    } else {
        const matched = required.filter(c => offered.includes(c));
        const pts = Math.round((matched.length / required.length) * 20);
        score += pts; breakdown.certification = pts;
    }

    // 4. Reliability score meets min (10 pts)
    const minRel = ip.minReliabilityScore || 0;
    const relScore = ep.reliabilityScore || 0;
    if (relScore >= minRel) {
        score += 10; breakdown.reliability = 10;
    } else { breakdown.reliability = 0; }

    // 5. Budget compatibility (5 pts)
    const budgetMap = { low: 1, medium: 2, high: 3 };
    if (ip.budgetRange && ep.budgetRange &&
        budgetMap[ip.budgetRange] === budgetMap[ep.budgetRange]) {
        score += 5; breakdown.budget = 5;
    } else { breakdown.budget = 0; }

    return { score, breakdown };
}

function scoreImporterForExporter(importer, exporterProfile) {
    const ip = importer.tradeProfile || {};
    const ep = exporterProfile || {};
    let score = 0;
    const breakdown = {};

    // 1. Industry alignment (40 pts)
    if (ip.industry && ep.industry && ip.industry === ep.industry) {
        score += 40; breakdown.industry = 40;
    } else { breakdown.industry = 0; }

    // 2. Country is in exporter's target list (25 pts)
    const targetCountries = ep.exportingTo || [];
    const importerCountry = ip.importerCountry || ip.country || '';
    if (targetCountries.length === 0 ||
        targetCountries.some(c => c.toLowerCase() === importerCountry.toLowerCase())) {
        score += 25; breakdown.targetCountry = 25;
    } else { breakdown.targetCountry = 0; }

    // 3. Certification match — importer's required vs exporter's held (20 pts)
    const required = ip.certificationRequired || [];
    const offered = ep.certifications || [];
    if (required.length === 0) {
        score += 20; breakdown.certification = 20;
    } else {
        const matched = required.filter(c => offered.includes(c));
        const pts = Math.round((matched.length / required.length) * 20);
        score += pts; breakdown.certification = pts;
    }

    // 4. Exporter size preference (10 pts)
    const prefSize = ip.preferredExporterSize || '';
    const exportSize = ep.exporterSize || '';
    if (!prefSize || prefSize === exportSize) {
        score += 10; breakdown.size = 10;
    } else { breakdown.size = 0; }

    // 5. Budget range overlap (5 pts)
    const budgetMap = { low: 1, medium: 2, high: 3 };
    if (ip.budgetRange && ep.budgetRange &&
        budgetMap[ip.budgetRange] === budgetMap[ep.budgetRange]) {
        score += 5; breakdown.budget = 5;
    } else { breakdown.budget = 0; }

    return { score, breakdown };
}

/* ──────────────────────────────────────────────────────────────────
   GET /api/match/recommendations
   Returns top 10 matched profiles for the current user
───────────────────────────────────────────────────────────────── */
router.get('/recommendations', protect, async (req, res) => {
    const me = req.user;

    if (me.verificationStatus !== 'approved')
        return res.status(403).json({ message: 'Account not yet verified.' });

    try {
        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';

        // Find all approved opposite-role users
        const candidates = await User.find({
            role: oppositeRole,
            verificationStatus: 'approved',
            isOnboarded: true,
            _id: { $ne: me._id },
        });

        // Score each candidate
        const scored = candidates.map(candidate => {
            const { score, breakdown } =
                me.role === 'importer'
                    ? scoreExporterForImporter(candidate, me.tradeProfile)
                    : scoreImporterForExporter(candidate, me.tradeProfile);

            return {
                score,
                breakdown,
                matchPercent: score, // already out of 100
                user: {
                    id: candidate._id,
                    name: candidate.name,
                    photoURL: candidate.photoURL,
                    role: candidate.role,
                    isDemo: candidate.isDemo,
                    tradeProfile: candidate.tradeProfile,
                    createdAt: candidate.createdAt,
                },
            };
        });

        // Sort by score descending, return top 10
        scored.sort((a, b) => b.score - a.score);
        const top10 = scored.slice(0, 10);

        return res.json({ recommendations: top10, total: scored.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
