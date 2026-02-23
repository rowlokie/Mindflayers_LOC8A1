require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const News = require('../models/News');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tradepulse-ai';

// Example: Using NewsAPI to fetch live trade news
// Get an API key from https://newsapi.org/
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY';

/**
 * 1. PLATFORM FOR LIVE EXIM DATA (LEADS):
 * - OpenCorporates API: For retrieving registered companies across the globe.
 * - UN Comtrade API (https://comtradeapi.un.org/): For official international trade statistics and market trends.
 * - Panjiva / ImportGenius: (Commercial APIs) Best for getting exact Bill of Lading data (who imported what, when).
 * 
 * 2. PLATFORM FOR LIVE NEWS (RISK ALERTS):
 * - NewsAPI.org: Excellent for pulling breaking news regarding trade, tariffs, or supply chain.
 * - GDELT Project (https://www.gdeltproject.org/): Global database of events, amazing for predicting "War_Flag" or "Natural_Calamity_Flag".
 */

async function fetchLiveNews() {
    console.log('Fetching live news data...');
    try {
        // Mocking the fetch if key is not set, otherwise actually fetch:
        let articles = [];
        if (NEWS_API_KEY !== 'YOUR_NEWS_API_KEY') {
            const res = await fetch(`https://newsapi.org/v2/everything?q=global+trade+tariffs+supply+chain&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
            const data = await res.json();
            if (data.articles) articles = data.articles.slice(0, 10);
        } else {
            // Mock Fallback live data 
            articles = [
                {
                    source: { name: 'Reuters' },
                    title: 'New Tariffs Imposed on Semiconductor Imports to US',
                    description: 'Major changes in electronics trade corridors...',
                    url: 'https://example.com/news1',
                    publishedAt: new Date().toISOString()
                },
                {
                    source: { name: 'Bloomberg' },
                    title: 'Supply Chain Disruptions in the Suez Canal continue',
                    description: 'Shipping delays affecting textile and machinery exports from Asia to Europe.',
                    url: 'https://example.com/news2',
                    publishedAt: new Date().toISOString()
                }
            ];
        }

        const newsDocs = articles.map(art => ({
            sourceName: art.source?.name || 'Unknown',
            title: art.title,
            description: art.description,
            url: art.url,
            publishedAt: new Date(art.publishedAt),

            // AI Classification (In a real app, you would pass art.title to Gemini to extract these metrics)
            Affected_Industry: art.title.includes('Semiconductor') ? 'Electronics' : 'General',
            Impact_Level: 'High',
            Tariff_Change: art.title.includes('Tariff') ? 0.8 : 0,
            War_Flag: art.title.includes('War') ? 1.0 : 0
        }));

        await News.deleteMany({}); // Clear old news cache
        await News.insertMany(newsDocs);
        console.log(`✓ Inserted ${newsDocs.length} live news records into MongoDB`);
    } catch (err) {
        console.error('Error fetching live news:', err.message);
    }
}

async function syncLiveLeads() {
    console.log('Fetching live company leads from OpenCorporates/UN Comtrade...');
    // In a real implementation you would call APIs like UN Comtrade to find live companies.
    // For this resume project, we simulate fetching live records and mapping them to our User schema.
    try {
        const liveCompanies = [
            {
                name: 'LiveTech Global LLC',
                email: 'contact@livetechglobal.com',
                role: 'importer',
                isOnboarded: true,
                verificationStatus: 'approved',
                tradeProfile: {
                    companyName: 'LiveTech Global LLC',
                    country: 'USA',
                    region: 'North America',
                    industry: 'Electronics',
                    budgetMax: 2000000,
                    quantityRequired: 50000,
                    certifications: ['ISO 9001'],
                }
            }
        ];

        for (const company of liveCompanies) {
            await User.updateOne(
                { email: company.email },
                { $set: company },
                { upsert: true }
            );
        }
        console.log(`✓ Upserted ${liveCompanies.length} live company leads`);

    } catch (err) {
        console.error('Error fetching live leads:', err);
    }
}

async function runLiveSync() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to MongoDB');

        await fetchLiveNews();
        await syncLiveLeads();

        console.log('🚀 Live Data Sync Complete!');
    } catch (err) {
        console.error('✗ Sync failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    }
}

runLiveSync();
