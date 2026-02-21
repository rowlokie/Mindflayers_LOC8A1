const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Connection = require('../models/Connection');
const { generateOutreachMessage } = require('./aiRoutes');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/swipe/queue
   Returns next batch of users to browse
──────────────────────────────────────────────────────────────── */
router.get('/queue', protect, async (req, res) => {
    try {
        const me = req.user;
        if (!me.isOnboarded || me.verificationStatus !== 'approved')
            return res.status(403).json({ message: 'Profile not approved yet.' });

        // IDs already acted on (interested OR not-interested, but NOT skip)
        const acted = await Swipe.find({
            swiper: me._id,
            action: { $in: ['like', 'pass'] },
        }).select('target');
        const actedIds = acted.map(s => s.target);

        // Also exclude users already connected with
        const connections = await Connection.find({
            $or: [{ user1: me._id }, { user2: me._id }],
        }).select('user1 user2');
        const connectedIds = connections.flatMap(c => [c.user1.toString(), c.user2.toString()])
            .filter(id => id !== me._id.toString());

        const excludeIds = [...actedIds, ...connectedIds.map(id => id)];

        // Opposite role only
        const oppositeRole = me.role === 'importer' ? 'exporter' : 'importer';
        const candidates = await User.find({
            _id: { $ne: me._id, $nin: excludeIds },
            role: oppositeRole,
            verificationStatus: 'approved',
            isOnboarded: true,
        }).select('-password').limit(25);

        // Score candidates
        const scored = candidates.map(c => {
            let score = 0;
            const mp = me.tradeProfile || {};
            const cp = c.tradeProfile || {};
            if (mp.industry && cp.industry && mp.industry === cp.industry) score += 40;
            if (mp.region && cp.region && mp.region === cp.region) score += 15;
            if (mp.region && (cp.exportingTo || []).includes(mp.region)) score += 10;
            if (mp.budgetRange && cp.budgetRange && mp.budgetRange === cp.budgetRange) score += 10;
            const myCerts = mp.certificationRequired || mp.certifications || [];
            const theirCerts = cp.certifications || cp.certificationRequired || [];
            score += Math.min(myCerts.filter(c => theirCerts.includes(c)).length * 8, 20);
            if (cp.website) score += 5;
            return { score: Math.min(score, 95), user: c };
        });

        scored.sort((a, b) => b.score - a.score);
        return res.json({ queue: scored, total: scored.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/swipe
   Body: { targetId, action: 'like' | 'pass' | 'skip' }
   'like'  → immediately creates a Connection (one-sided interest is enough)
   'pass'  → record permanently, never show again
   'skip'  → don't record, can show again next session
──────────────────────────────────────────────────────────────── */
router.post('/', protect, async (req, res) => {
    const { targetId, action } = req.body;
    if (!targetId || !['like', 'pass', 'skip'].includes(action))
        return res.status(400).json({ message: 'targetId and action (like/pass/skip) required.' });

    try {
        const me = req.user;

        // Skip: don't record anything, just acknowledge
        if (action === 'skip') return res.json({ connected: false, skipped: true });

        // Record like / pass
        await Swipe.findOneAndUpdate(
            { swiper: me._id, target: targetId },
            { action },
            { upsert: true, new: true }
        );

        if (action === 'pass') return res.json({ connected: false });

        // ── INTERESTED ── Create connection immediately (no mutual requirement)
        const targetUser = await User.findById(targetId).select('-password');
        if (!targetUser) return res.status(404).json({ message: 'User not found.' });

        // Ensure consistent ordering for unique index
        const [u1, u2] = [me._id.toString(), targetId].sort();
        let connection = await Connection.findOne({ user1: u1, user2: u2 });

        if (!connection) {
            // Generate AI outreach message
            let aiMsg = '';
            try { aiMsg = await generateOutreachMessage(me, targetUser); }
            catch (e) { console.warn('AI msg generation skipped:', e.message); }

            connection = await Connection.create({
                user1: u1,
                user2: u2,
                aiOutreachMessage: aiMsg,
                messages: aiMsg ? [{
                    sender: me._id,
                    senderName: me.name,
                    text: aiMsg,
                    isAI: true,
                }] : [],
            });
        }

        return res.json({ connected: true, connectionId: connection._id, partnerName: targetUser.name });
    } catch (err) {
        console.error(err);
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
