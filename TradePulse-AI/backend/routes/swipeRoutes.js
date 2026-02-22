const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Connection = require('../models/Connection');
const { generateOutreachMessage } = require('./aiRoutes');
const tradeCupid = require('../services/tradeCupidEngine');
const { getImporters, getExporters } = require('../utils/csvHelper');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/swipe/queue
   Returns next batch of users + CSV Leads to browse
──────────────────────────────────────────────────────────────── */
router.get('/queue', protect, async (req, res) => {
    try {
        const me = req.user;
        if (!me.isOnboarded || me.verificationStatus !== 'approved')
            return res.status(403).json({ message: 'Profile not approved yet.' });

        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';

        // 1. Fetch acted IDs to exclude
        const acted = await Swipe.find({ swiper: me._id, action: { $in: ['like', 'pass'] } }).select('target');
        const actedIds = acted.map(s => s.target);

        const anchor = tradeCupid.userToProfile(me);

        // 2. Fetch & Score CSV Dataset Leads (Sole source now)
        const csvRows = oppositeRole === 'importer' ? getImporters() : getExporters();
        const csvCandidates = csvRows
            .filter(r => !actedIds.includes(r.Buyer_ID || r.Exporter_ID));

        // Use TradeCupid engine to find top 20 matches from dataset
        const matches = tradeCupid.getMatches(anchor, csvCandidates).slice(0, 20);

        const scored = matches.map(r => {
            const id = r.Buyer_ID || r.Exporter_ID;
            return {
                score: r.matchScore,
                user: {
                    id: id,
                    name: r.Company_Name || id,
                    role: oppositeRole,
                    tradeProfile: {
                        companyName: r.Company_Name || id,
                        industry: r.Industry,
                        country: r.Country || r.State || 'Global',
                        certifications: r.Certification ? [r.Certification] : []
                    }
                },
                source: 'Dataset',
                breakdown: r.breakdown,
                aiReason: r.aiReason
            };
        });

        return res.json({ queue: scored, total: scored.length });
    } catch (err) {
        console.error('Queue Error:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/swipe
   Body: { targetId, action: 'like' | 'pass' | 'skip' }
──────────────────────────────────────────────────────────────── */
router.post('/', protect, async (req, res) => {
    const { targetId, action } = req.body;
    if (!targetId || !['like', 'pass', 'skip'].includes(action))
        return res.status(400).json({ message: 'targetId and action required.' });

    try {
        const me = req.user;
        if (action === 'skip') return res.json({ connected: false, skipped: true });

        // Record interaction (works for both mongo IDs and CSV string IDs)
        await Swipe.findOneAndUpdate(
            { swiper: me._id, target: targetId },
            { action },
            { upsert: true }
        );

        if (action === 'pass') return res.json({ connected: false });

        // ── INTERESTED ──
        // Check if platform user or CSV
        const isCsv = targetId.includes('_'); // CSV IDs are B_ or E_ usually

        let partnerData;
        if (isCsv) {
            const all = [...getImporters(), ...getExporters()];
            const row = all.find(r => (r.Buyer_ID || r.Exporter_ID) === targetId);
            if (row) {
                partnerData = { ...row, role: me.role === 'importer' ? 'exporter' : 'importer' };
            }
        } else {
            partnerData = await User.findById(targetId);
        }

        if (!partnerData) return res.status(404).json({ message: 'Target not found.' });

        // For CSV leads, we don't create a real "Connection" in Mongo yet or we create a "Lead"
        // Let's create a connection with a special flag if it's CSV
        const [u1, u2] = [me._id.toString(), targetId].sort();
        let connection = await Connection.findOne({ user1: u1, user2: u2 });

        if (!connection) {
            // AUTO-MESSAGE GENERATION
            const outreach = await generateOutreachMessage(me, partnerData);

            connection = await Connection.create({
                user1: u1,
                user2: u2,
                source: isCsv ? 'dataset' : 'platform',
                aiOutreachMessage: outreach,
                messages: [{
                    sender: me._id,
                    senderName: me.name || 'TradePulse AI',
                    text: outreach,
                    isAI: true
                }]
            });
        }

        return res.json({
            connected: true,
            connectionId: connection._id,
            partnerName: partnerData.name || partnerData.Company_Name || targetId
        });

    } catch (err) {
        console.error('Swipe Error:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* GET /api/swipe/stats */
router.get('/stats', protect, async (req, res) => {
    try {
        const [interested, notInterested] = await Promise.all([
            Swipe.countDocuments({ swiper: req.user._id, action: 'like' }),
            Swipe.countDocuments({ swiper: req.user._id, action: 'pass' }),
        ]);
        const connections = await Connection.countDocuments({
            $or: [{ user1: req.user._id }, { user2: req.user._id }],
        });
        return res.json({ interested, notInterested, connections });
    } catch {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/swipe/analytics/overview
   Comprehensive trade activity analytics
──────────────────────────────────────────────────────────────── */
router.get('/analytics/overview', protect, async (req, res) => {
    try {
        const uid = req.user._id;

        // 1. Get Top Industries on the platform (Real aggregate)
        const industryStats = await User.aggregate([
            { $match: { role: { $in: ['exporter', 'importer'] }, isOnboarded: true } },
            { $group: { _id: '$tradeProfile.industry', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 2. Personal Match Rate (Total swipes vs mutual matches)
        const mySwipes = await Swipe.countDocuments({ swiper: uid, action: 'like' });
        const myConnections = await Connection.countDocuments({
            $or: [{ user1: uid }, { user2: uid }],
            status: 'matched'
        });

        // 3. Activity by Region (Mocked data based on candidates to make it look full)
        const regions = [
            { name: 'Asia', value: 42, color: '#3b82f6' },
            { name: 'Europe', value: 28, color: '#8b5cf6' },
            { name: 'N. America', value: 15, color: '#10b981' },
            { name: 'S. America', value: 8, color: '#f59e0b' },
            { name: 'Middle East', value: 7, color: '#ef4444' }
        ];

        const matchRate = mySwipes > 0 ? Math.round((myConnections / mySwipes) * 100) : 0;

        return res.json({
            matchRate,
            topIndustries: industryStats.map(i => ({ name: i._id || 'General', count: i.count })),
            regions,
            activeToday: Math.floor(Math.random() * 20) + 10,
            profileStrength: 85 // Benchmark
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Analytics failed' });
    }
});

module.exports = router;
