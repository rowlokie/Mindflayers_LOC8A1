const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ── Auth ──────────────────────────────────────────────────────────
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    googleId: { type: String },
    photoURL: { type: String, default: '' },

    // ── Role (set ONCE, locked forever) ──────────────────────────────
    role: {
        type: String,
        enum: ['exporter', 'importer', 'admin'],
        default: null,
    },
    roleLockedAt: { type: Date }, // timestamp when role was first set

    // ── Onboarding & Verification ─────────────────────────────────────
    isOnboarded: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    verificationNote: { type: String, default: '' },  // admin rejection reason

    // ── Trade Profile ─────────────────────────────────────────────────
    tradeProfile: {
        // ── Common fields ──
        companyName: String,
        website: String,
        phone: String,
        country: String,       // where the company is located
        region: String,       // Asia | Europe | North America | South America | Middle East | Africa | Oceania
        linkedinProfile: String,
        industry: String,       // Steel | Textile | Electronics | Pharma | Agriculture | Chemicals | Automotive | Food & Beverages | Machinery | Medical Devices
        certifications: [String],     // ISO 9001 | ISO 14001 | FDA | CE | OEKO-TEX | GMP | HACCP | BRC | SA8000
        deliveryUrgency: String,       // Immediate | 1 Month | 3 Months | 6 Months
        sustainabilityOnly: { type: Boolean, default: false },
        reliabilityScore: { type: Number, default: 0, min: 0, max: 100 },

        // ── Importer-specific ──
        importerCountry: String,   // importer's own country (for tariff info)
        preferredRegion: String,   // preferred region to import from
        quantityRequired: Number,
        quantityUnit: String,   // units | tons | pieces | kg | liters
        budgetRange: String,   // low | medium | high
        budgetMin: Number,
        budgetMax: Number,
        certificationRequired: [String],
        preferredExporterSize: String,   // Small business | Mid-size | Large enterprise
        minReliabilityScore: { type: Number, default: 0 },
        riskSensitivity: String,   // low | medium | high
        buyingRequirements: String,

        // ── Exporter-specific ──
        productsCategories: [String],
        exportingTo: [String],  // target countries
        capacity: String,    // e.g. "50,000 units/month"
        exporterSize: String,    // Small business | Mid-size | Large enterprise
        budgetCompatMin: Number,
        budgetCompatMax: Number,
    },

    // ── Seed flag (to distinguish demo vs real users) ─────────────────
    isDemo: { type: Boolean, default: false },

    // ── Admin management ──────────────────────────────────────────────
    adminNote: { type: String, default: '' },      // internal notes by admin (never shown to user)
    reportCount: { type: Number, default: 0 },       // number of reports received

    // ── Ban ───────────────────────────────────────────────────────────
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    bannedAt: { type: Date },
    bannedBy: { type: String, default: '' },        // admin email who issued the ban

}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
