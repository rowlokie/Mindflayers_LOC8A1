const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// ─── GET /api/profile/me ──────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    return res.json(req.user);
});

// ─── PUT /api/profile/me ──────────────────────────────────────────
router.put('/me', protect, async (req, res) => {
    const {
        name, phone, country,
        companyName, website, linkedinProfile,
        // Exporter fields
        products, targetCountries,
        // Importer fields
        buyingRequirements, companySize, annualBudget,
        // Role
        role, isOnboarded,
    } = req.body;

    try {
        const user = req.user;

        if (name) user.name = name;
        if (role) user.role = role;
        if (isOnboarded !== undefined) user.isOnboarded = isOnboarded;

        // Merge onboarding details
        user.onboardingDetails = {
            ...user.onboardingDetails,
            ...(companyName !== undefined && { companyName }),
            ...(website !== undefined && { website }),
            ...(linkedinProfile !== undefined && { linkedinProfile }),
            ...(phone !== undefined && { phone }),
            ...(country !== undefined && { country }),
            ...(products !== undefined && { products: products.split(',').map(p => p.trim()) }),
            ...(targetCountries !== undefined && { targetCountries: targetCountries.split(',').map(c => c.trim()) }),
            ...(buyingRequirements !== undefined && { buyingRequirements }),
            ...(companySize !== undefined && { companySize }),
            ...(annualBudget !== undefined && { annualBudget: Number(annualBudget) }),
        };

        await user.save();
        return res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
