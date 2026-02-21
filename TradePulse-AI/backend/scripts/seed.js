/**
 * TradePulse AI — Demo Seed Script
 * Run: node scripts/seed.js
 *
 * Creates:
 *  - 10 pre-approved Exporters (diverse industries & regions)
 *  - 10 pre-approved Importers (diverse requirements)
 *  - 1 Admin user
 *
 * Existing demo users are cleared before re-seeding.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tradepulse-ai';

/* ─────────────────────────────────────────────────────────────────
   DEMO EXPORTERS
───────────────────────────────────────────────────────────────── */
const EXPORTERS = [
    {
        name: 'Global Textiles Ltd',
        email: 'export@globaltextiles.in',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'Global Textiles Ltd', country: 'India', region: 'Asia',
            industry: 'Textile', productsCategories: ['Cotton Fabrics', 'Denim', 'Synthetic Blends'],
            exportingTo: ['USA', 'Germany', 'UAE', 'UK'], capacity: '80,000 units/month',
            certifications: ['ISO 9001', 'OEKO-TEX', 'SA8000'],
            exporterSize: 'Large enterprise', budgetRange: 'medium',
            budgetCompatMin: 50000, budgetCompatMax: 500000,
            reliabilityScore: 89, deliveryUrgency: '1 Month', sustainabilityOnly: true,
        },
    },
    {
        name: 'Pharma Solutions India',
        email: 'export@pharmasolutions.in',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'Pharma Solutions India', country: 'India', region: 'Asia',
            industry: 'Pharma', productsCategories: ['Generic Medicines', 'API', 'Nutraceuticals'],
            exportingTo: ['USA', 'Germany', 'UK', 'Canada', 'Australia'],
            certifications: ['FDA', 'GMP', 'ISO 9001'],
            exporterSize: 'Large enterprise', capacity: '5M tablets/month',
            budgetRange: 'high', budgetCompatMin: 200000, budgetCompatMax: 5000000,
            reliabilityScore: 94, deliveryUrgency: '1 Month', sustainabilityOnly: false,
        },
    },
    {
        name: 'AgriExport India Pvt Ltd',
        email: 'export@agriexportindia.com',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'AgriExport India Pvt Ltd', country: 'India', region: 'Asia',
            industry: 'Agriculture', productsCategories: ['Spices', 'Pulses', 'Rice', 'Wheat'],
            exportingTo: ['USA', 'UAE', 'Saudi Arabia', 'UK', 'Germany'],
            certifications: ['ISO 9001', 'HACCP', 'ISO 14001'],
            exporterSize: 'Mid-size', capacity: '500 tons/month',
            budgetRange: 'medium', budgetCompatMin: 20000, budgetCompatMax: 300000,
            reliabilityScore: 82, deliveryUrgency: '1 Month', sustainabilityOnly: true,
        },
    },
    {
        name: 'SteelCraft Mumbai',
        email: 'export@steelcraftmumbai.com',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'SteelCraft Mumbai', country: 'India', region: 'Asia',
            industry: 'Steel', productsCategories: ['Structural Steel', 'Stainless Steel', 'Flat Rollings'],
            exportingTo: ['UAE', 'USA', 'Germany', 'South Korea', 'Japan'],
            certifications: ['ISO 9001', 'CE'],
            exporterSize: 'Large enterprise', capacity: '10,000 tons/month',
            budgetRange: 'high', budgetCompatMin: 500000, budgetCompatMax: 10000000,
            reliabilityScore: 91, deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
    {
        name: 'ElecTech Exports Bangalore',
        email: 'export@electechexports.in',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'ElecTech Exports Bangalore', country: 'India', region: 'Asia',
            industry: 'Electronics', productsCategories: ['PCBs', 'IoT Modules', 'LED Components', 'Sensors'],
            exportingTo: ['USA', 'Germany', 'Japan', 'UK', 'France'],
            certifications: ['CE', 'ISO 9001', 'ISO 14001'],
            exporterSize: 'Mid-size', capacity: '50,000 units/month',
            budgetRange: 'medium', budgetCompatMin: 100000, budgetCompatMax: 2000000,
            reliabilityScore: 86, deliveryUrgency: '1 Month', sustainabilityOnly: false,
        },
    },
    {
        name: 'Euro Steel GmbH',
        email: 'export@eurosteel.de',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'Euro Steel GmbH', country: 'Germany', region: 'Europe',
            industry: 'Steel', productsCategories: ['High-Grade Steel', 'Alloy Steel', 'Coils'],
            exportingTo: ['USA', 'UK', 'France', 'Netherlands', 'Brazil'],
            certifications: ['ISO 9001', 'CE', 'ISO 14001'],
            exporterSize: 'Large enterprise', capacity: '20,000 tons/month',
            budgetRange: 'high', budgetCompatMin: 1000000, budgetCompatMax: 20000000,
            reliabilityScore: 97, deliveryUrgency: '3 Months', sustainabilityOnly: true,
        },
    },
    {
        name: 'AutoParts Pune Exports',
        email: 'export@autopartspune.com',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'AutoParts Pune Exports', country: 'India', region: 'Asia',
            industry: 'Automotive', productsCategories: ['Engine Parts', 'Brake Systems', 'EV Components'],
            exportingTo: ['Germany', 'USA', 'Japan', 'South Korea', 'UK'],
            certifications: ['ISO 9001', 'CE', 'IATF 16949'],
            exporterSize: 'Large enterprise', capacity: '100,000 units/month',
            budgetRange: 'high', budgetCompatMin: 500000, budgetCompatMax: 5000000,
            reliabilityScore: 88, deliveryUrgency: '1 Month', sustainabilityOnly: false,
        },
    },
    {
        name: 'FoodPro Exports Chennai',
        email: 'export@foodprochennai.com',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'FoodPro Exports Chennai', country: 'India', region: 'Asia',
            industry: 'Food & Beverages', productsCategories: ['Processed Foods', 'Beverages', 'Snacks'],
            exportingTo: ['UK', 'USA', 'UAE', 'Saudi Arabia', 'Canada'],
            certifications: ['ISO 9001', 'HACCP', 'BRC', 'ISO 14001'],
            exporterSize: 'Mid-size', capacity: '200 tons/month',
            budgetRange: 'medium', budgetCompatMin: 50000, budgetCompatMax: 1000000,
            reliabilityScore: 85, deliveryUrgency: '1 Month', sustainabilityOnly: true,
        },
    },
    {
        name: 'ChemEx Asia Pvt Ltd',
        email: 'export@chemexasia.com',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'ChemEx Asia Pvt Ltd', country: 'India', region: 'Asia',
            industry: 'Chemicals', productsCategories: ['Industrial Solvents', 'Polymers', 'Dyes'],
            exportingTo: ['Germany', 'France', 'USA', 'Brazil', 'China'],
            certifications: ['ISO 9001', 'ISO 14001', 'REACH'],
            exporterSize: 'Mid-size', capacity: '1,000 tons/month',
            budgetRange: 'medium', budgetCompatMin: 100000, budgetCompatMax: 3000000,
            reliabilityScore: 80, deliveryUrgency: '1 Month', sustainabilityOnly: false,
        },
    },
    {
        name: 'MachineryWorld Coimbatore',
        email: 'export@machineryworld.in',
        role: 'exporter', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'MachineryWorld Coimbatore', country: 'India', region: 'Asia',
            industry: 'Machinery', productsCategories: ['CNC Machines', 'Textile Machinery', 'Pumps'],
            exportingTo: ['USA', 'UK', 'Germany', 'Netherlands', 'UAE'],
            certifications: ['ISO 9001', 'CE'],
            exporterSize: 'Mid-size', capacity: '500 units/month',
            budgetRange: 'high', budgetCompatMin: 200000, budgetCompatMax: 5000000,
            reliabilityScore: 83, deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
];

/* ─────────────────────────────────────────────────────────────────
   DEMO IMPORTERS
───────────────────────────────────────────────────────────────── */
const IMPORTERS = [
    {
        name: 'AcmeCorp USA',
        email: 'import@acmecorp.com',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'AcmeCorp USA', country: 'USA', importerCountry: 'USA', region: 'North America',
            industry: 'Textile', preferredRegion: 'Asia',
            buyingRequirements: 'High-quality cotton and denim fabrics for apparel manufacturing',
            quantityRequired: 50000, quantityUnit: 'units',
            budgetRange: 'medium', budgetMin: 100000, budgetMax: 500000,
            certificationRequired: ['ISO 9001', 'OEKO-TEX'],
            preferredExporterSize: 'Large enterprise', minReliabilityScore: 75,
            riskSensitivity: 'low', deliveryUrgency: '1 Month', sustainabilityOnly: true,
        },
    },
    {
        name: 'MedSupply Germany',
        email: 'import@medsupply.de',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'MedSupply Germany', country: 'Germany', importerCountry: 'Germany', region: 'Europe',
            industry: 'Pharma', preferredRegion: 'Asia',
            buyingRequirements: 'Generic medicines and active pharmaceutical ingredients',
            quantityRequired: 5, quantityUnit: 'million tablets',
            budgetRange: 'high', budgetMin: 500000, budgetMax: 5000000,
            certificationRequired: ['FDA', 'GMP', 'ISO 9001'],
            preferredExporterSize: 'Large enterprise', minReliabilityScore: 85,
            riskSensitivity: 'low', deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
    {
        name: 'GreenFood UK',
        email: 'import@greenfooduk.co.uk',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'GreenFood UK', country: 'UK', importerCountry: 'UK', region: 'Europe',
            industry: 'Agriculture', preferredRegion: 'Asia',
            buyingRequirements: 'Organic spices, rice and pulses for supermarket chains',
            quantityRequired: 200, quantityUnit: 'tons',
            budgetRange: 'medium', budgetMin: 50000, budgetMax: 300000,
            certificationRequired: ['ISO 9001', 'HACCP'],
            preferredExporterSize: 'Mid-size', minReliabilityScore: 70,
            riskSensitivity: 'low', deliveryUrgency: '1 Month', sustainabilityOnly: true,
        },
    },
    {
        name: 'BuildMasters UAE',
        email: 'import@buildmasters.ae',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'BuildMasters UAE', country: 'UAE', importerCountry: 'UAE', region: 'Middle East',
            industry: 'Steel', preferredRegion: 'Asia',
            buyingRequirements: 'Structural and stainless steel for large construction projects',
            quantityRequired: 5000, quantityUnit: 'tons',
            budgetRange: 'high', budgetMin: 1000000, budgetMax: 10000000,
            certificationRequired: ['ISO 9001'],
            preferredExporterSize: 'Large enterprise', minReliabilityScore: 80,
            riskSensitivity: 'medium', deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
    {
        name: 'TechImport Japan',
        email: 'import@techimport.co.jp',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'TechImport Japan', country: 'Japan', importerCountry: 'Japan', region: 'Asia',
            industry: 'Electronics', preferredRegion: 'Asia',
            buyingRequirements: 'PCBs, IoT modules, and sensor components for consumer electronics',
            quantityRequired: 100000, quantityUnit: 'units',
            budgetRange: 'medium', budgetMin: 200000, budgetMax: 2000000,
            certificationRequired: ['CE', 'ISO 9001'],
            preferredExporterSize: 'Mid-size', minReliabilityScore: 75,
            riskSensitivity: 'medium', deliveryUrgency: '1 Month', sustainabilityOnly: false,
        },
    },
    {
        name: 'FreshMarket Australia',
        email: 'import@freshmarket.com.au',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'FreshMarket Australia', country: 'Australia', importerCountry: 'Australia', region: 'Oceania',
            industry: 'Food & Beverages', preferredRegion: 'Asia',
            buyingRequirements: 'Processed foods, snacks and beverages for supermarket distribution',
            quantityRequired: 100, quantityUnit: 'tons',
            budgetRange: 'medium', budgetMin: 50000, budgetMax: 500000,
            certificationRequired: ['ISO 9001', 'HACCP', 'BRC'],
            preferredExporterSize: 'Mid-size', minReliabilityScore: 75,
            riskSensitivity: 'low', deliveryUrgency: '1 Month', sustainabilityOnly: true,
        },
    },
    {
        name: 'AutoDrive Canada',
        email: 'import@autodrive.ca',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'AutoDrive Canada', country: 'Canada', importerCountry: 'Canada', region: 'North America',
            industry: 'Automotive', preferredRegion: 'Asia',
            buyingRequirements: 'Engine parts, brake systems and EV components for assembly',
            quantityRequired: 50000, quantityUnit: 'units',
            budgetRange: 'high', budgetMin: 500000, budgetMax: 5000000,
            certificationRequired: ['ISO 9001', 'CE'],
            preferredExporterSize: 'Large enterprise', minReliabilityScore: 80,
            riskSensitivity: 'low', deliveryUrgency: '1 Month', sustainabilityOnly: false,
        },
    },
    {
        name: 'ChemSolutions France',
        email: 'import@chemsolutions.fr',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'ChemSolutions France', country: 'France', importerCountry: 'France', region: 'Europe',
            industry: 'Chemicals', preferredRegion: 'Asia',
            buyingRequirements: 'Industrial solvents and polymers for manufacturing',
            quantityRequired: 500, quantityUnit: 'tons',
            budgetRange: 'medium', budgetMin: 100000, budgetMax: 1500000,
            certificationRequired: ['ISO 9001', 'ISO 14001'],
            preferredExporterSize: 'Mid-size', minReliabilityScore: 70,
            riskSensitivity: 'medium', deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
    {
        name: 'MachTech South Korea',
        email: 'import@machtech.co.kr',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'MachTech South Korea', country: 'South Korea', importerCountry: 'South Korea', region: 'Asia',
            industry: 'Machinery', preferredRegion: 'Asia',
            buyingRequirements: 'CNC machines and textile machinery for factory expansion',
            quantityRequired: 50, quantityUnit: 'units',
            budgetRange: 'high', budgetMin: 500000, budgetMax: 5000000,
            certificationRequired: ['ISO 9001', 'CE'],
            preferredExporterSize: 'Mid-size', minReliabilityScore: 75,
            riskSensitivity: 'medium', deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
    {
        name: 'TextileWorld Brazil',
        email: 'import@textileworld.br',
        role: 'importer', isOnboarded: true, verificationStatus: 'approved', isDemo: true,
        tradeProfile: {
            companyName: 'TextileWorld Brazil', country: 'Brazil', importerCountry: 'Brazil', region: 'South America',
            industry: 'Textile', preferredRegion: 'Asia',
            buyingRequirements: 'Synthetic blends and cotton fabrics for local apparel brands',
            quantityRequired: 30000, quantityUnit: 'units',
            budgetRange: 'medium', budgetMin: 50000, budgetMax: 400000,
            certificationRequired: ['ISO 9001'],
            preferredExporterSize: 'Mid-size', minReliabilityScore: 65,
            riskSensitivity: 'high', deliveryUrgency: '3 Months', sustainabilityOnly: false,
        },
    },
];

/* ─────────────────────────────────────────────────────────────────
   ADMIN USER
───────────────────────────────────────────────────────────────── */
const ADMIN = {
    name: 'Admin',
    email: 'admin@tradepulse.ai',
    role: 'admin',
    isOnboarded: true,
    verificationStatus: 'approved',
    isDemo: true,
};

/* ─────────────────────────────────────────────────────────────────
   SEED RUNNER
───────────────────────────────────────────────────────────────── */
async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Clear existing demo data
        const deleted = await User.deleteMany({ isDemo: true });
        console.log(`✓ Cleared ${deleted.deletedCount} existing demo users`);

        // Insert exporters
        const exporters = await User.insertMany(EXPORTERS);
        console.log(`✓ Inserted ${exporters.length} exporters`);

        // Insert importers
        const importers = await User.insertMany(IMPORTERS);
        console.log(`✓ Inserted ${importers.length} importers`);

        // Insert admin
        const existing = await User.findOne({ email: ADMIN.email });
        if (!existing) {
            await User.create(ADMIN);
            console.log('✓ Admin user created → email: admin@tradepulse.ai');
        } else {
            console.log('✓ Admin user already exists');
        }

        console.log('\n🚀 Seed complete!');
        console.log(`   Exporters : ${exporters.length}`);
        console.log(`   Importers : ${importers.length}`);
        console.log(`   Admin     : 1`);
        console.log('\n   Admin login (set password manually or use Firebase):');
        console.log('   Email: admin@tradepulse.ai\n');

    } catch (err) {
        console.error('✗ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    }
}

seed();
