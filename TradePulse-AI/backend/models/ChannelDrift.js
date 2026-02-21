const mongoose = require('mongoose');

const channelDriftSchema = new mongoose.Schema({
    Drift_ID: { type: String, required: true, unique: true },
    Month: String,
    Industry: String,
    LinkedIn_Trend: Number,
    Email_Trend: Number,
    WhatsApp_Trend: Number,
    SMS_Trend: Number,
    Call_Trend: Number,
    Tariff_News_Impact: Number,
    War_News_Impact: Number,
    Market_News_Impact: Number
}, { timestamps: true });

module.exports = mongoose.model('ChannelDrift', channelDriftSchema);
