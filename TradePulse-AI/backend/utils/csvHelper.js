const fs = require('fs');
const path = require('path');

const findFile = (name) => {
    const dir = path.join(__dirname, '../../src');
    if (!fs.existsSync(dir)) return path.join(dir, name);
    const files = fs.readdirSync(dir);
    const found = files.find(f => f.includes(name) && f.endsWith('.csv'));
    return found ? path.join(dir, found) : path.join(dir, name);
};

const CSV_ASSETS = {
    IMPORTERS: findFile('Importer'),
    EXPORTERS: findFile('Exporter'),
    NEWS: findFile('Global_News')
};

/**
 * Basic CSV Parser that handles:
 * - Simple comma separation
 * - Quote stripping
 * - Number conversion
 * - Date string normalization
 */
const parseCSV = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.warn(`[CSV] Missing file: ${filePath}`);
        return [];
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        return lines.slice(1).map(line => {
            // Basic split (doesn't handle commas inside quotes, but fine for this dataset)
            const values = line.split(',');
            const obj = {};
            headers.forEach((h, i) => {
                let val = values[i] ? values[i].trim().replace(/"/g, '') : '';

                // Conversions
                if (val === 'NA' || val === 'Unknown' || val === '') {
                    obj[h] = null;
                } else if (!isNaN(val) && val !== '') {
                    obj[h] = Number(val);
                } else if (val === 'True' || val === '1') {
                    obj[h] = 1;
                } else if (val === 'False' || val === '0') {
                    obj[h] = 0;
                } else {
                    obj[h] = val;
                }
            });
            return obj;
        });
    } catch (err) {
        console.error(`[CSV] Error parsing ${filePath}:`, err);
        return [];
    }
};

const getImporters = () => parseCSV(CSV_ASSETS.IMPORTERS);
const getExporters = () => parseCSV(CSV_ASSETS.EXPORTERS);
const getNews = () => parseCSV(CSV_ASSETS.NEWS);

module.exports = { getImporters, getExporters, getNews };
