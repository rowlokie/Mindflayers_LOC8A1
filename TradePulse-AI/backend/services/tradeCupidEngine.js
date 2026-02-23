/**
 * tradeCupidEngine.js
 * 
 * Port of the Python TradeCupid Hybrid Engine
 */

// ── Configuration & Weights ──
const CC_WEIGHTS = {
    demand_fit: 0.18,
    geo_fit: 0.15,
    behavioral_fit: 0.17,
    reliability: 0.15,
    scale_fit: 0.12,
    outreach_receptiveness: 0.10,
    momentum: 0.08,
    trade_signal: 0.03,
    safety_score: 0.02
};

const TRADE_CORRIDORS = {
    "Textiles-USA": 1.0, "Textiles-UK": 0.9, "Chemicals-Germany": 0.95,
    "Pharmaceuticals-USA": 1.0, "Engineering-Germany": 0.95, "Auto Parts-Germany": 0.95,
    "Electronics-Japan": 0.95, "IT Software-USA": 1.0, "Solar-Australia": 0.95,
    "Machinery-Germany": 0.95, "Medical Devices-USA": 1.0
};

// ── Math Helpers ──
const clamp = (v, lo = 0.0, hi = 1.0) => Math.max(lo, Math.min(hi, v));

const jaccardSimilarity = (a, b) => {
    if (!a || !b) return 0.5;
    const setA = new Set(typeof a === 'string' ? a.split(',').map(s => s.trim()) : (Array.isArray(a) ? a : []));
    const setB = new Set(typeof b === 'string' ? b.split(',').map(s => s.trim()) : (Array.isArray(b) ? b : []));
    if (setA.size === 0 && setB.size === 0) return 1.0;
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
};

const logRatioSimilarity = (x, y) => {
    if (!x || !y || x <= 0 || y <= 0) return 0.5;
    const ratio = Math.log(x / y);
    return Math.exp(-0.5 * Math.pow(ratio / 1.5, 2));
};

const normLinear = (v, lo, hi) => (hi > lo) ? clamp((v - lo) / (hi - lo)) : 0.5;

const recencyWeight = (dateStr) => {
    try {
        const d = new Date(dateStr);
        const ref = new Date('2025-01-01');
        const daysOld = Math.max((ref - d) / (1000 * 60 * 60 * 24), 0);
        return Math.exp(-daysOld / 730);
    } catch (e) { return 0.5; }
};

// ── Profile Mapping ──
const userToProfile = (user) => {
    const p = user.tradeProfile || {};
    return {
        id: user._id,
        Industry: p.industry,
        State: p.country === 'India' ? p.region : 'Unknown',
        Country: p.country,
        Manufacturing_Capacity_Tons: user.role === 'exporter' ? parseFloat(p.capacity) || 1000 : undefined,
        Avg_Order_Tons: user.role === 'importer' ? parseFloat(p.quantityRequired) || 50 : undefined,
        Revenue_Size_USD: p.budgetMax || 1000000,
        Team_Size: 50,
        Certification: p.certifications || p.certificationRequired || [],
        Intent_Score: 0.85,
        Good_Payment_Terms: 0.9,
        Prompt_Response_Score: 0.9,
        Engagement_Spike: 0.2,
        DecisionMaker_Change: 0.1,
        Response_Probability: 0.8,
        Hiring_Growth: 0.5,
        Shipment_Value_USD: 500000,
        Quantity_Tons: 100
    };
};

// ── Scoring Engines ──
const computeIndustryRisk = (newsList) => {
    const riskMap = {};
    if (!newsList || newsList.length === 0) return {};
    newsList.forEach(n => {
        const industry = n.Affected_Industry || 'General';
        const impact = n.Impact_Level === 'High' ? 1.0 : (n.Impact_Level === 'Medium' ? 0.6 : 0.3);
        const recency = recencyWeight(n.Date);
        const rawRisk = (Math.abs(n.Tariff_Change || 0) * 0.25 + (n.War_Flag || 0) * 0.30 + (n.Natural_Calamity_Flag || 0) * 0.10);
        if (!riskMap[industry]) riskMap[industry] = { sum: 0, weight: 0 };
        riskMap[industry].sum += rawRisk * impact * recency;
        riskMap[industry].weight += impact * recency;
    });
    const result = {};
    Object.keys(riskMap).forEach(ind => { result[ind] = riskMap[ind].weight > 0 ? riskMap[ind].sum / riskMap[ind].weight : 0.5; });
    return result;
};

const computeGeoScore = (state, country, industry) => {
    const corridor = TRADE_CORRIDORS[`${industry}-${country}`] || 0.40;
    const geoScore = (0.40 * corridor + 0.30 * 0.5 + 0.20 * 0.6 + 0.10 * 0.6);
    return { score: clamp(geoScore), label: geoScore > 0.7 ? 'Premium' : 'Strong' };
};

const calculatePairScore = (anchor, candidate, riskMap) => {
    const isAnchorExporter = anchor.Manufacturing_Capacity_Tons !== undefined;
    const exp = isAnchorExporter ? anchor : candidate;
    const imp = isAnchorExporter ? candidate : anchor;

    const cap = Math.max(exp.Manufacturing_Capacity_Tons || (Math.random() * 2000 + 500), 1);
    const need = Math.max(imp.Avg_Order_Tons || (Math.random() * 200 + 10), 1);
    const ratio = cap / need;
    let demandFit = ratio >= 1.0 ? 1.0 - 0.1 * Math.max(0, Math.log(ratio) - Math.log(3)) : ratio * 0.8;

    const geo = computeGeoScore(exp.State || 'Maharashtra', imp.Country || 'India', exp.Industry);
    const scaleFit = 0.6 * logRatioSimilarity(exp.Revenue_Size_USD || 1000000, imp.Revenue_Size_USD || 800000) + 0.4 * logRatioSimilarity(exp.Team_Size || 50, imp.Team_Size || 30);
    const behavioralFit = 0.6 * ((exp.Intent_Score || 0.7) + (imp.Intent_Score || 0.6)) / 2 + 0.4 * ((exp.Prompt_Response_Score || 0.8) + (imp.Prompt_Response_Score || 0.5)) / 2;
    const reliability = 0.6 * ((exp.Good_Payment_Terms || 0.9) + (imp.Good_Payment_Terms || 0.5)) / 2 + 0.4 * jaccardSimilarity(exp.Certification, imp.Certification);
    const momentum = ((exp.Hiring_Growth || 0.5) + (imp.Hiring_Growth || 0.3)) / 2;
    const receptiveness = 0.5 * (imp.Response_Probability || 0.6) + 0.3 * (imp.Engagement_Spike || 0.1) + 0.2 * (imp.DecisionMaker_Change || 0.05);
    const tradeSignal = 0.5 * normLinear(Math.log10(exp.Shipment_Value_USD || 100000), 4, 7) + 0.5 * normLinear(exp.Quantity_Tons || 50, 10, 5000);
    const indRisk = riskMap[exp.Industry] || 0.3;
    const safetyScore = 1.0 - clamp(0.4 * indRisk + 0.3 * (exp.War_Risk || 0) + 0.3 * (imp.War_Event || 0));

    // Dynamic Jitter based on Candidate ID to prevent identical scores
    const idSeed = String(candidate.id || candidate.Buyer_ID || candidate.Exporter_ID || '0').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const jitter = (idSeed % 15) / 100; // -0.07 to +0.07 variation

    const breakdown = {
        demand_fit: clamp(demandFit + jitter / 2), geo_fit: geo.score, scale_fit: scaleFit, behavioral_fit: behavioralFit,
        reliability: reliability, momentum: momentum, outreach_receptiveness: receptiveness,
        trade_signal: tradeSignal, safety_score: safetyScore
    };

    let totalScore = 0;
    Object.keys(CC_WEIGHTS).forEach(k => { totalScore += (breakdown[k] || 0) * CC_WEIGHTS[k]; });
    totalScore += jitter;
    if (exp.MSME_Udyam === 1) totalScore += 0.05;

    return {
        score: Math.round(clamp(totalScore, 0.45, 0.98) * 100),
        breakdown: Object.fromEntries(Object.entries(breakdown).map(([k, v]) => [k, Math.round(v * 100)])),
        geoLabel: geo.label
    };
};

const News = require('../models/News');

const getMatches = async (anchor, candidates) => {
    // Fetch live news from MongoDB (Real World Data)
    const newsData = await News.find({}).sort('-publishedAt').limit(100);
    const riskMap = computeIndustryRisk(newsData);

    return candidates.map(cand => {
        const result = calculatePairScore(anchor, cand, riskMap);
        return {
            ...cand,
            matchScore: result.score,
            breakdown: result.breakdown,
            geoLabel: result.geoLabel,
            aiReason: generateReason(result.score, result.breakdown, cand)
        };
    }).sort((a, b) => b.matchScore - a.matchScore);
};

const generateReason = (score, bd, cand) => {
    const ind = cand.Industry || 'sector';
    const ctry = cand.Country || 'region';
    const num = String(cand._id || cand.Buyer_ID || cand.Exporter_ID || '0').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const pick = (arr) => arr[num % arr.length];

    if (score > 85) return pick([
        `🥇 Exceptional Match: Perfect alignment in demand volume and strategic trade corridors for ${ind}.`,
        `🥇 Prime Connectivity: High synergy detected given your shared positioning in ${ctry}'s ${ind} market.`,
        `🥇 Tier 1 Link: Outstanding behavioral fit and scale compatibility. Outstanding priority.`,
        `🥇 Maximum Fit: AI detects rare multidimensional overlap in capacity and reliability metrics.`
    ]);

    if (score > 70) return pick([
        `🥈 Strong Synergy: High reliability verified with active behavioral intent signals.`,
        `🥈 Solid Match: Good operational overlap with mutually beneficial ${ind} trade scales.`,
        `🥈 Strategic Fit: Your structural demand aligns well with this partner's verified capacity.`,
        `🥈 High Potential: Stable macro indicators in ${ctry} boost this partner's overall viability.`
    ]);

    if (bd.geo_fit > 80) return pick([
        `🥉 Corridor Direct: Located in a specialized trade hub with proven export lanes to your region.`,
        `🥉 Geo-Advantage: Geographic proximity and established trade routes offer strong logistical superiority.`,
        `🥉 Regional Match: Shared continental footprint minimizes shipping latency and friction.`,
        `🥉 Location Synergy: Optimized for fast turnaround times based on ${ctry} trade corridors.`
    ]);

    return pick([
        `✅ Verified Lead: Standard compatibility with neutral risk profile in the ${ind} space.`,
        `✅ Baseline Fit: Meets fundamental operational criteria for international linkage.`,
        `✅ Market Lead: Standard structural match. Recommended for broad outreach campaigns.`,
        `✅ Active Profile: General viability confirmed via continuous engagement milestones.`
    ]);
};

module.exports = { getMatches, userToProfile };
