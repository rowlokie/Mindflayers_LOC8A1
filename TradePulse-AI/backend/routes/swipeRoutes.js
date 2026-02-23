const express = require('express');
const bcrypt = require('bcryptjs');
const protect = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Connection = require('../models/Connection');
const { generateOutreachMessage } = require('./aiRoutes');
const tradeCupid = require('../services/tradeCupidEngine');
const { getImporters, getExporters } = require('../utils/csvHelper');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/swipe/queue
   Returns next batch of users from MongoDB and CSV to browse
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

        // Filter valid ObjectIds for Mongo query to prevent CastError
        const mongoActedIds = actedIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        const anchor = tradeCupid.userToProfile(me);

        // 2. Fetch from MongoDB (Limit to 50 for speed)
        const dbUsers = await User.find({ role: oppositeRole, _id: { $nin: mongoActedIds, $ne: me._id } }).limit(50);

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

        // 3. Fetch from CSV (Limit to 150)
        let csvRaw = oppositeRole === 'importer' ? getImporters() : getExporters();

        // Exclude CSV users that user already acted upon
        const availableCsv = csvRaw.filter(c => {
            const id = oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID;
            return !actedIds.includes(id);
        });

        const csvCandidates = availableCsv.slice(0, 150).map(c => ({
            ...c,
            _id: oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID,
            Company_Name: c.Company_Name || (oppositeRole === 'importer' ? c.Buyer_ID : c.Exporter_ID),
        }));

        const mergedCandidates = [...dbCandidates, ...csvCandidates];

        // Use TradeCupid engine to find top matches
        const matches = await tradeCupid.getMatches(anchor, mergedCandidates);

        // Take top 40 best matches, shuffle them, then return 20 to make the queue feel dynamic
        const topPool = matches.slice(0, 40);
        for (let i = topPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [topPool[i], topPool[j]] = [topPool[j], topPool[i]];
        }
        const topMatches = topPool.slice(0, 20);

        const scored = topMatches.map(r => {
            const id = r._id;
            return {
                score: r.matchScore,
                user: {
                    id: id,
                    name: r.Company_Name,
                    role: oppositeRole,
                    tradeProfile: {
                        companyName: r.Company_Name,
                        industry: r.Industry,
                        country: r.Country,
                        region: r.State,
                        certifications: r.Certification ? (Array.isArray(r.Certification) ? r.Certification : [r.Certification]) : [],
                        budgetMax: r.Revenue_Size_USD,
                        capacity: r.Manufacturing_Capacity_Tons,
                        quantityRequired: r.Avg_Order_Tons,
                        teamSize: r.Team_Size,
                    }
                },
                source: 'Live Database',
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

        // ── INTERESTED (LIKE) ──
        let partnerData = await User.findById(targetId).catch(() => null);

        // If not found in DB, it might be a CSV lead. We must materialize it into MongoDB on-demand!
        let newTargetId = targetId;
        if (!partnerData && (targetId.startsWith('BUY_') || targetId.startsWith('EXP_'))) {
            const rawCsv = targetId.startsWith('BUY_') ? getImporters() : getExporters();
            const csvUser = rawCsv.find(c => c.Buyer_ID === targetId || c.Exporter_ID === targetId);

            if (csvUser) {
                const isImporter = targetId.startsWith('BUY_');
                // Create a shadow account in DB so the user can literally login to it later for the demo
                partnerData = await User.create({
                    name: csvUser.Company_Name || targetId,
                    email: `${targetId.toLowerCase()}@demo.tradepulse.ai`,
                    password: await bcrypt.hash('demo_password123', 10), // Hashed for login
                    role: isImporter ? 'importer' : 'exporter',
                    isOnboarded: true,
                    verificationStatus: 'approved',
                    isDemo: true,
                    tradeProfile: {
                        companyName: csvUser.Company_Name || targetId,
                        industry: csvUser.Industry || 'General',
                        country: csvUser.Country || 'Global',
                        region: csvUser.State || 'Unknown',
                        budgetMax: Number(csvUser.Revenue_Size_USD) || 1000000,
                        quantityRequired: Number(csvUser.Avg_Order_Tons) || 50,
                        capacity: csvUser.Manufacturing_Capacity_Tons ? csvUser.Manufacturing_Capacity_Tons.toString() : '1000',
                        certifications: csvUser.Certification ? [csvUser.Certification] : []
                    }
                });
                newTargetId = partnerData._id.toString();
            }
        }

        if (!partnerData) return res.status(404).json({ message: 'Target not found.' });

        const [u1, u2] = [me._id.toString(), newTargetId].sort();
        let connection = await Connection.findOne({ user1: u1, user2: u2 });

        if (!connection) {
            // AUTO-MESSAGE GENERATION
            const outreach = await generateOutreachMessage(me, partnerData);

            connection = await Connection.create({
                user1: u1,
                user2: u2,
                source: 'platform',
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
            partnerName: partnerData.name || partnerData.tradeProfile?.companyName || newTargetId
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
