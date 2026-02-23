require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { getImporters, getExporters } = require('../utils/csvHelper');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tradepulse-ai';

async function migrateCsvToDb() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to MongoDB for Migration');

        console.log('Reading CSV files...');
        const importers = getImporters();
        const exporters = getExporters();

        console.log(`Found ${importers.length} Importers and ${exporters.length} Exporters in CSV.`);

        // 1. Process Importers
        const importerDocs = importers.map((row, index) => {
            const uid = row.Buyer_ID || `BUY_${Math.random().toString(36).substring(7)}`;
            return {
                name: row.Company_Name || uid,
                email: `${uid.toLowerCase()}_${index}@shadow.tradepulse.ai`, // Strictly Unique email
                password: 'shadow_password', // Mock password, will never be used
                role: 'importer',
                isOnboarded: true,
                verificationStatus: 'approved',
                isDemo: true,
                tradeProfile: {
                    companyName: row.Company_Name || uid,
                    industry: row.Industry || 'General',
                    country: row.Country || 'Global',
                    region: row.State || 'Unknown',
                    budgetMax: Number(row.Revenue_Size_USD) || 1000000,
                    quantityRequired: Number(row.Avg_Order_Tons) || 50,
                    certifications: row.Certification ? [row.Certification] : []
                }
            };
        });

        // 2. Process Exporters
        const exporterDocs = exporters.map((row, index) => {
            const uid = row.Exporter_ID || `EXP_${Math.random().toString(36).substring(7)}`;
            return {
                name: row.Company_Name || uid,
                email: `${uid.toLowerCase()}_${index}@shadow.tradepulse.ai`, // Strictly Unique email
                password: 'shadow_password',
                role: 'exporter',
                isOnboarded: true,
                verificationStatus: 'approved',
                isDemo: true,
                tradeProfile: {
                    companyName: row.Company_Name || uid,
                    industry: row.Industry || 'General',
                    country: row.Country || 'Global',
                    region: row.State || 'Unknown',
                    budgetMax: Number(row.Revenue_Size_USD) || 1000000,
                    capacity: row.Manufacturing_Capacity_Tons ? row.Manufacturing_Capacity_Tons.toString() : '1000',
                    certifications: row.Certification ? [row.Certification] : []
                }
            };
        });

        // Delete previous shadow profiles to avoid duplicates during testing
        console.log('Cleaning up old dataset records...');
        await User.deleteMany({ email: { $regex: '@shadow.tradepulse.ai$' } });

        console.log('Inserting into MongoDB... This might take a few seconds.');

        // Insert in batches to prevent memory crashes with thousands of rows
        if (importerDocs.length > 0) {
            await User.insertMany(importerDocs, { ordered: false });
            console.log(`✓ Successfully migrated ${importerDocs.length} Importers into MongoDB.`);
        }

        if (exporterDocs.length > 0) {
            await User.insertMany(exporterDocs, { ordered: false });
            console.log(`✓ Successfully migrated ${exporterDocs.length} Exporters into MongoDB.`);
        }

        console.log('🚀 Final Migration Complete! Your Database now has the entire dataset.');

    } catch (err) {
        console.error('Migration Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

migrateCsvToDb();
