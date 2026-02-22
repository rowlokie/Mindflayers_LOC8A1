const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    isAI: { type: Boolean, default: false },
    senderName: { type: String },
}, { timestamps: true });

const connectionSchema = new Schema({
    user1: { type: String, required: true },
    user2: { type: String, required: true },
    matchScore: { type: Number, default: 0 },

    // AI-generated outreach message (auto-sent when match is made)
    aiOutreachMessage: { type: String, default: '' },

    // Messaging
    messages: [messageSchema],

    // Meeting
    meetingLink: { type: String, default: '' },
    meetingRoomId: { type: String, default: '' },
    meetingTime: { type: Date },
    meetingStatus: { type: String, enum: ['none', 'proposed', 'confirmed', 'completed'], default: 'none' },
    meetingProposedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    meetingProposedTime: { type: Date },
    user1ConfirmedMeeting: { type: Boolean, default: false },
    user2ConfirmedMeeting: { type: Boolean, default: false },

    // Status
    status: { type: String, enum: ['matched', 'archived'], default: 'matched' },

}, { timestamps: true });

// Prevent duplicate connections
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
