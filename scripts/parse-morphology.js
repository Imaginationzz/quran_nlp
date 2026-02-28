const fs = require('fs');
const readline = require('readline');
const path = require('path');

const RAW_FILE = path.join(__dirname, '../data/raw/quran-morphology.txt');
const OUTPUT_FILE = path.join(__dirname, '../data/processed/quran-data.json');

async function parseMorphology() {
    const fileStream = fs.createReadStream(RAW_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const quranData = {}; // Sura -> Aya -> Word -> [Segments]
    const rootMap = {}; // Root -> [Locations]

    let isHeader = true;

    for await (const line of rl) {
        if (line.startsWith('#') || line.trim() === '' || line.startsWith('LOCATION')) {
            continue;
        }

        const [location, form, tag, features] = line.split('\t');
        if (!location) continue;

        // Parse location (1:1:1:1)
        const locMatch = location.match(/\((\d+):(\d+):(\d+):(\d+)\)/);
        if (!locMatch) continue;

        const [_, sura, aya, word, segment] = locMatch.map(Number);

        // Initialize structures
        if (!quranData[sura]) quranData[sura] = {};
        if (!quranData[sura][aya]) quranData[sura][aya] = {};
        if (!quranData[sura][aya][word]) quranData[sura][aya][word] = { form: '', segments: [] };

        const featureObj = {};
        features.split('|').forEach(f => {
            if (f.includes(':')) {
                const [key, val] = f.split(':');
                featureObj[key] = val;
            } else {
                featureObj[f] = true;
            }
        });

        const segmentData = {
            segment,
            form,
            tag,
            features: featureObj
        };

        quranData[sura][aya][word].segments.push(segmentData);

        // Accumulate word form (basic concatenation for now, could be improved)
        // The dataset provides segments (e.g., prefix, stem, suffix)
        // We'll treat the STEM as the primary word form if needed, 
        // but the 'FORM' column usually contains the specific segment text.

        // Index roots
        const root = featureObj.ROOT;
        if (root) {
            if (!rootMap[root]) rootMap[root] = [];
            rootMap[root].push({ sura, aya, word });
        }
    }

    const finalData = {
        quran: quranData,
        roots: rootMap
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
    console.log(`Successfully parsed morphological data into ${OUTPUT_FILE}`);
}

parseMorphology().catch(console.error);
