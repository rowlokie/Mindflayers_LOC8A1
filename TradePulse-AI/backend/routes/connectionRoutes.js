const express = require('express');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const protect = require('../middleware/authMiddleware');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { getImporters, getExporters } = require('../utils/csvHelper');

const router = express.Router();

const getPartnerOrCsv = async (partnerId, selectFields) => {
    if (mongoose.Types.ObjectId.isValid(partnerId)) {
        return await User.findById(partnerId).select(selectFields).catch(() => null);
    }
    const rawCsv = partnerId.startsWith('BUY_') ? getImporters() : getExporters();
    const csvUser = rawCsv.find(u => u.Buyer_ID === partnerId || u.Exporter_ID === partnerId);
    if (csvUser) {
        return {
            _id: partnerId,
            name: csvUser.Company_Name || partnerId,
            email: `${partnerId.toLowerCase()}@demo.tradepulse.ai`,
            role: partnerId.startsWith('BUY_') ? 'importer' : 'exporter',
            verificationStatus: 'approved',
            tradeProfile: {
                companyName: csvUser.Company_Name || partnerId,
                industry: csvUser.Industry || 'General',
                country: csvUser.Country || 'Global',
            }
        };
    }
    return null;
};

const isMember = (conn, userId) => {
    const uid = userId.toString();
    return conn.user1 === uid || conn.user2 === uid;
};

/* ─────────────────────────────────────────────────────────────
   GET /api/connections
──────────────────────────────────────────────────────────────── */
router.get('/', protect, async (req, res) => {
    try {
        const uid = req.user._id.toString();
        const connections = await Connection.find({
            $or: [{ user1: uid }, { user2: uid }],
            status: 'matched',
        }).sort({ updatedAt: -1 });

        // Enrich with User or CSV data
        const enriched = await Promise.all(connections.map(async (c) => {
            const partnerId = c.user1 === uid ? c.user2 : c.user1;
            let partner = await getPartnerOrCsv(partnerId, 'name email photoURL tradeProfile role verificationStatus createdAt');

            return {
                ...c.toObject(),
                partner,
                lastMessage: c.messages[c.messages.length - 1] || null,
                unread: c.messages.filter(m => m.sender?.toString() !== uid).length,
            };
        }));

        // Filter out connections where partner data disappeared (shouldn't happen but safe)
        const result = enriched.filter(e => e.partner);

        return res.json({ connections: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/connections/meetings   ← must be BEFORE /:id
   All meetings for the current user (proposed + confirmed)
──────────────────────────────────────────────────────────────── */
router.get('/meetings', protect, async (req, res) => {
    try {
        const uid = req.user._id.toString();
        const connections = await Connection.find({
            $or: [{ user1: uid }, { user2: uid }],
            meetingStatus: { $in: ['proposed', 'confirmed'] },
            status: 'matched',
        }).sort({ meetingProposedTime: 1 });

        const meetings = await Promise.all(connections.map(async (c) => {
            const partnerId = c.user1 === uid ? c.user2 : c.user1;
            let partner = await getPartnerOrCsv(partnerId, 'name email photoURL tradeProfile role');

            const isUser1 = c.user1 === uid;
            const iConfirmed = isUser1 ? c.user1ConfirmedMeeting : c.user2ConfirmedMeeting;
            const iProposed = c.meetingProposedBy?.toString() === uid;

            return {
                connectionId: c._id,
                partner,
                meetingStatus: c.meetingStatus,
                meetingLink: c.meetingLink,
                meetingTime: c.meetingTime,
                meetingProposedTime: c.meetingProposedTime,
                meetingProposedBy: c.meetingProposedBy,
                iConfirmed,
                iProposed,
                roomId: c.meetingRoomId || c._id.toString(),
            };
        }));

        return res.json({ meetings: meetings.filter(m => m.partner) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/connections/:id
──────────────────────────────────────────────────────────────── */
router.get('/:id', protect, async (req, res) => {
    try {
        const uid = req.user._id.toString();
        const conn = await Connection.findById(req.params.id);
        if (!conn || !isMember(conn, req.user._id))
            return res.status(404).json({ message: 'Connection not found.' });

        const partnerId = conn.user1 === uid ? conn.user2 : conn.user1;
        let partner = await getPartnerOrCsv(partnerId, 'name email photoURL tradeProfile role verificationStatus createdAt');

        return res.json({ connection: { ...conn.toObject(), partner } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/connections/:id/message
──────────────────────────────────────────────────────────────── */
router.post('/:id/message', protect, async (req, res) => {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required.' });
    try {
        const conn = await Connection.findById(req.params.id);
        if (!conn || !isMember(conn, req.user._id))
            return res.status(404).json({ message: 'Connection not found.' });
        conn.messages.push({ sender: req.user._id, senderName: req.user.name, text: text.trim(), isAI: false });
        await conn.save();
        return res.json({ message: conn.messages[conn.messages.length - 1] });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/connections/:id/propose-meeting
   Uses connection ID as the Jitsi room (deterministic, in-app ready)
──────────────────────────────────────────────────────────────── */
router.post('/:id/propose-meeting', protect, async (req, res) => {
    const { proposedTime } = req.body;
    if (!proposedTime) return res.status(400).json({ message: 'proposedTime (ISO) required.' });
    try {
        const conn = await Connection.findById(req.params.id);
        if (!conn || !isMember(conn, req.user._id))
            return res.status(404).json({ message: 'Connection not found.' });

        // Deterministic room name — same for both users via same connection ID
        const roomId = `TradePulse-${conn._id.toString().slice(-10)}`;
        const meetLink = `https://meet.jit.si/${roomId}`;

        conn.meetingLink = meetLink;
        conn.meetingRoomId = roomId;
        conn.meetingProposedBy = req.user._id;
        conn.meetingProposedTime = new Date(proposedTime);
        conn.meetingStatus = 'proposed';
        conn.user1ConfirmedMeeting = conn.user1 === req.user._id.toString();
        conn.user2ConfirmedMeeting = conn.user2 === req.user._id.toString();

        conn.messages.push({
            sender: req.user._id,
            senderName: req.user.name,
            text: `📅 Meeting proposed for ${new Date(proposedTime).toLocaleString()}.`,
            isAI: true,
        });

        await conn.save();
        return res.json({ meetingLink: meetLink, roomId, meetingStatus: conn.meetingStatus });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/connections/:id/confirm-meeting
──────────────────────────────────────────────────────────────── */
router.put('/:id/confirm-meeting', protect, async (req, res) => {
    try {
        const conn = await Connection.findById(req.params.id);
        if (!conn || !isMember(conn, req.user._id))
            return res.status(404).json({ message: 'Connection not found.' });
        if (conn.meetingStatus !== 'proposed')
            return res.status(400).json({ message: 'No meeting proposed.' });

        const isUser1 = conn.user1 === req.user._id.toString();
        if (isUser1) conn.user1ConfirmedMeeting = true;
        else conn.user2ConfirmedMeeting = true;

        if (conn.user1ConfirmedMeeting && conn.user2ConfirmedMeeting) {
            conn.meetingStatus = 'confirmed';
            conn.meetingTime = conn.meetingProposedTime;
            conn.messages.push({
                senderName: 'System',
                text: `✅ Meeting confirmed for ${conn.meetingTime?.toLocaleString()}! Click "Join Meeting" in the Meetings tab.`,
                isAI: true,
            });
        }

        await conn.save();
        return res.json({ meetingStatus: conn.meetingStatus, meetingLink: conn.meetingLink, roomId: conn.meetingRoomId });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/connections/:id/reject-meeting
──────────────────────────────────────────────────────────────── */
router.put('/:id/reject-meeting', protect, async (req, res) => {
    try {
        const conn = await Connection.findById(req.params.id);
        if (!conn || !isMember(conn, req.user._id))
            return res.status(404).json({ message: 'Connection not found.' });

        conn.meetingStatus = 'none';
        conn.meetingLink = '';
        conn.meetingRoomId = '';
        conn.meetingProposedBy = null;
        conn.meetingProposedTime = null;
        conn.user1ConfirmedMeeting = false;
        conn.user2ConfirmedMeeting = false;

        conn.messages.push({
            senderName: req.user.name,
            text: '❌ Meeting request was declined.',
            isAI: true,
        });

        await conn.save();
        return res.json({ message: 'Meeting rejected.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/connections/:id   (archive)
──────────────────────────────────────────────────────────────── */
router.delete('/:id', protect, async (req, res) => {
    try {
        const conn = await Connection.findById(req.params.id);
        if (!conn || !isMember(conn, req.user._id))
            return res.status(404).json({ message: 'Connection not found.' });
        conn.status = 'archived';
        await conn.save();
        return res.json({ message: 'Connection archived.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
