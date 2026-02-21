const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// ─── POST /api/profile/role  ──────────────────────────────────────
// Set role ONE TIME — locked forever after this
router.post('/role', protect, async (req, res) => {
    const { role } = req.body;
    if (!['exporter', 'importer'].includes(role))
        return res.status(400).json({ message: 'Invalid role. Must be exporter or importer.' });

    const user = req.user;

    // Role is locked — cannot change once set
    if (user.role && user.role !== 'admin') {
        return res.status(403).json({ message: 'Role is locked and cannot be changed.' });
    }

    user.role = role;
    user.roleLockedAt = new Date();
    await user.save();

    return res.json({ message: 'Role set successfully.', role: user.role });
});

// ─── POST /api/profile/onboarding  ───────────────────────────────
// Save full trade profile — sets isOnboarded: true, verificationStatus: 'pending'
router.post('/onboarding', protect, async (req, res) => {
    const user = req.user;

    if (!user.role)
        return res.status(400).json({ message: 'Select a role before onboarding.' });

    const {
        // Common
        companyName, website, phone, country, region,
        linkedinProfile, industry, certifications,
        deliveryUrgency, sustainabilityOnly,
        // Importer
        importerCountry, preferredRegion, quantityRequired, quantityUnit,
        budgetRange, budgetMin, budgetMax, certificationRequired,
        preferredExporterSize, minReliabilityScore, riskSensitivity, buyingRequirements,
        // Exporter
        productsCategories, exportingTo, capacity, exporterSize,
        budgetCompatMin, budgetCompatMax,
    } = req.body;

    user.tradeProfile = {
        companyName, website, phone, country, region,
        linkedinProfile,
        industry,
        certifications: certifications || [],
        deliveryUrgency,
        sustainabilityOnly: sustainabilityOnly || false,
        reliabilityScore: Math.floor(Math.random() * 30) + 60, // random 60-90 for new users

        // Importer fields
        importerCountry, preferredRegion, quantityRequired,
        quantityUnit: quantityUnit || 'units',
        budgetRange, budgetMin, budgetMax,
        certificationRequired: certificationRequired || [],
        preferredExporterSize, minReliabilityScore: minReliabilityScore || 0,
        riskSensitivity, buyingRequirements,

        // Exporter fields
        productsCategories: productsCategories || [],
        exportingTo: exportingTo || [],
        capacity, exporterSize,
        budgetCompatMin, budgetCompatMax,
    };

    user.isOnboarded = true;
    user.verificationStatus = 'pending';

    await user.save();
    return res.json({
        message: 'Profile submitted. Awaiting admin verification.',
        isOnboarded: user.isOnboarded,
        verificationStatus: user.verificationStatus,
    });
});

// ─── GET /api/profile/me  ────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    return res.json(req.user);
});

// ─── PUT /api/profile/me  ────────────────────────────────────────
// Update trade profile (only for approved users)
router.put('/me', protect, async (req, res) => {
    const user = req.user;
    const updates = req.body;

    // Merge tradeProfile
    user.tradeProfile = { ...user.tradeProfile?.toObject?.() || {}, ...updates };
    await user.save();
    return res.json(user);
});

module.exports = router;
