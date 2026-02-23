const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    sourceName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },

    // AI Processed Data
    Affected_Industry: { type: String, default: 'General' },
    Impact_Level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    Tariff_Change: { type: Number, default: 0 },
    War_Flag: { type: Number, default: 0 },
    Natural_Calamity_Flag: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
