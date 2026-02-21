const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

const userPublic = (u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    photoURL: u.photoURL,
    role: u.role,
    isOnboarded: u.isOnboarded,
    verificationStatus: u.verificationStatus,
    verificationNote: u.verificationNote,
    isBanned: u.isBanned,
    banReason: u.banReason,
    tradeProfile: u.tradeProfile,
    createdAt: u.createdAt,
});

// Admin emails — set ADMIN_EMAILS=you@gmail.com,other@email.com in backend/.env
const getAdminEmails = () =>
    (process.env.ADMIN_EMAILS || '')
        .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

// ─── POST /api/auth/register ─────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ message: 'Name, email and password are required.' });
    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ message: 'Email already registered.' });
        const hashed = await bcrypt.hash(password, 10);
        const isAdmin = getAdminEmails().includes(email.toLowerCase());
        const user = await User.create({
            name, email: email.toLowerCase(), password: hashed,
            ...(isAdmin ? { role: 'admin', isOnboarded: true, verificationStatus: 'approved' } : {}),
        });
        return res.status(201).json({ token: signToken(user._id), user: userPublic(user) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── POST /api/auth/login ────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required.' });
    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials.' });
        return res.json({ token: signToken(user._id), user: userPublic(user) });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── POST /api/auth/google  (Firebase OAuth sync) ────────────────
router.post('/google', async (req, res) => {
    const { name, email, googleId, photoURL } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const adminEmails = getAdminEmails();
    const isAdminEmail = adminEmails.includes(email.toLowerCase());

    try {
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            user = await User.create({
                name: name || email,
                email: email.toLowerCase(),
                googleId,
                photoURL: photoURL || '',
                ...(isAdminEmail ? { role: 'admin', isOnboarded: true, verificationStatus: 'approved' } : {}),
            });
        } else {
            if (!user.googleId) user.googleId = googleId;
            if (photoURL && !user.photoURL) user.photoURL = photoURL;
            // Re-promote if email is now in admin list
            if (isAdminEmail && user.role !== 'admin') {
                user.role = 'admin';
                user.isOnboarded = true;
                user.verificationStatus = 'approved';
            }
            await user.save();
        }

        return res.json({ token: signToken(user._id), user: userPublic(user) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── GET /api/auth/me ────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    return res.json({ user: userPublic(req.user) });
});

module.exports = router;
