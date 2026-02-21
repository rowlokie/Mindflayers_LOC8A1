const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // hidden by default; only for email/password users
    googleId: { type: String },
    photoURL: { type: String },
    role: { type: String, enum: ['exporter', 'importer', 'admin'], default: 'exporter' },
    isOnboarded: { type: Boolean, default: false },

    onboardingDetails: {
        companyName: String,
        website: String,
        linkedinProfile: String,
        phone: String,
        country: String,

        // Exporter
        products: [String],
        targetCountries: [String],
        businessCategory: String,

        // Importer
        buyingRequirements: String,
        companySize: String,
        preferredChannels: [String],
        annualBudget: Number,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
