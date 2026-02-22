const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tradepulse-ai')
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => console.error('✗ MongoDB error:', err));

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/match', require('./routes/matchRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/swipe', require('./routes/swipeRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));


// ─── Health ───────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ status: 'TradePulse AI API running ✓' }));

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
