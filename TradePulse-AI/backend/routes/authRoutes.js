const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

// ─── POST /api/auth/register ──────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already registered.' });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashed, role: role || 'exporter' });

        return res.status(201).json({
            token: signToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required.' });

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

        return res.json({
            token: signToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── POST /api/auth/google ────────────────────────────────────────
// Called after Firebase Google sign-in to sync user into MongoDB
router.post('/google', async (req, res) => {
    const { name, email, googleId, photoURL } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: name || email,
                email,
                googleId,
                photoURL,
            });
        } else {
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        return res.json({
            token: signToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
