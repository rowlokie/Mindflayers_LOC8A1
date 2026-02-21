const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/* ── Admin guard ────────────────────────────────────────────────── */
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin')
        return res.status(403).json({ message: 'Admin access required.' });
    next();
};

/* ════════════════════════════════════════════════════════════════
   STATS
════════════════════════════════════════════════════════════════ */
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        const [pending, approved, rejected, exporters, importers, banned, total] = await Promise.all([
            User.countDocuments({ verificationStatus: 'pending', isOnboarded: true, role: { $in: ['exporter', 'importer'] } }),
            User.countDocuments({ verificationStatus: 'approved', role: { $in: ['exporter', 'importer'] } }),
            User.countDocuments({ verificationStatus: 'rejected', role: { $in: ['exporter', 'importer'] } }),
            User.countDocuments({ role: 'exporter' }),
            User.countDocuments({ role: 'importer' }),
            User.countDocuments({ isBanned: true }),
            User.countDocuments({ role: { $in: ['exporter', 'importer'] } }),
        ]);
        return res.json({ pending, approved, rejected, exporters, importers, banned, total });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   PENDING VERIFICATIONS
════════════════════════════════════════════════════════════════ */
router.get('/pending', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find({
            verificationStatus: 'pending', isOnboarded: true,
            role: { $in: ['exporter', 'importer'] },
        }).select('-password').sort({ createdAt: -1 });
        return res.json({ users, count: users.length });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   ALL USERS  (with search + filter)
════════════════════════════════════════════════════════════════ */
router.get('/all-users', protect, adminOnly, async (req, res) => {
    try {
        const { search, role, status, banned, page = 1, limit = 20 } = req.query;
        const query = { role: { $in: ['exporter', 'importer'] } };

        if (role && role !== 'all') query.role = role;
        if (status && status !== 'all') query.verificationStatus = status;
        if (banned === 'true') query.isBanned = true;
        if (banned === 'false') query.isBanned = false;
        if (search) {
            const rx = new RegExp(search, 'i');
            query.$or = [{ name: rx }, { email: rx }, { 'tradeProfile.companyName': rx }];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
        return res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   SINGLE USER DETAIL
════════════════════════════════════════════════════════════════ */
router.get('/user/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   APPROVE / REJECT VERIFICATION
════════════════════════════════════════════════════════════════ */
router.put('/verify/:id', protect, adminOnly, async (req, res) => {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status))
        return res.status(400).json({ message: 'Status must be approved or rejected.' });

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.verificationStatus = status;
        user.verificationNote = note || '';
        await user.save();
        return res.json({ message: `User ${status} successfully.`, user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   BAN USER
════════════════════════════════════════════════════════════════ */
router.put('/ban/:id', protect, adminOnly, async (req, res) => {
    const { reason } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.role === 'admin')
            return res.status(400).json({ message: 'Cannot ban another admin.' });

        user.isBanned = true;
        user.banReason = reason || 'Violation of platform terms.';
        user.bannedAt = new Date();
        user.bannedBy = req.user.email;
        await user.save();
        return res.json({ message: 'User banned.', user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   UNBAN USER
════════════════════════════════════════════════════════════════ */
router.put('/unban/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.isBanned = false;
        user.banReason = '';
        user.bannedAt = undefined;
        user.bannedBy = '';
        await user.save();
        return res.json({ message: 'User unbanned.', user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   PROMOTE TO ADMIN
════════════════════════════════════════════════════════════════ */
router.put('/promote/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.role = 'admin';
        user.verificationStatus = 'approved';
        await user.save();
        return res.json({ message: 'User promoted to admin.', user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   DEMOTE ADMIN → exporter/importer (must supply target role)
════════════════════════════════════════════════════════════════ */
router.put('/demote/:id', protect, adminOnly, async (req, res) => {
    const { role } = req.body;
    if (!['exporter', 'importer'].includes(role))
        return res.status(400).json({ message: 'Provide target role: exporter or importer.' });
    if (req.params.id === req.user.id.toString())
        return res.status(400).json({ message: 'You cannot demote yourself.' });

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.role = role;
        await user.save();
        return res.json({ message: 'Admin demoted.', user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   ADD ADMIN NOTE (internal, private)
════════════════════════════════════════════════════════════════ */
router.put('/note/:id', protect, adminOnly, async (req, res) => {
    const { note } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.adminNote = note || '';
        await user.save();
        return res.json({ message: 'Note saved.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   RESET VERIFICATION (back to pending)
════════════════════════════════════════════════════════════════ */
router.put('/reset-verification/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.verificationStatus = 'pending';
        user.verificationNote = '';
        await user.save();
        return res.json({ message: 'Verification reset to pending.', user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   DELETE USER PERMANENTLY
════════════════════════════════════════════════════════════════ */
router.delete('/delete/:id', protect, adminOnly, async (req, res) => {
    if (req.params.id === req.user.id.toString())
        return res.status(400).json({ message: 'You cannot delete yourself.' });
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        return res.json({ message: 'User permanently deleted.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ════════════════════════════════════════════════════════════════
   BULK APPROVE (all pending)
════════════════════════════════════════════════════════════════ */
router.post('/bulk-approve', protect, adminOnly, async (req, res) => {
    try {
        const result = await User.updateMany(
            { verificationStatus: 'pending', isOnboarded: true, role: { $in: ['exporter', 'importer'] } },
            { $set: { verificationStatus: 'approved' } }
        );
        return res.json({ message: `${result.modifiedCount} users approved.`, count: result.modifiedCount });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
