const fs = require('fs');
const path = require('path');

const BUCKWALTER_TO_ARABIC = {
    'A': 'ا', 'b': 'ب', 't': 'ت', 'v': 'ث', 'j': 'ج', 'H': 'ح', 'x': 'خ',
    'd': 'د', '*': 'ذ', 'r': 'ر', 'z': 'ز', 's': 'س', '$': 'ش', 'S': 'ص',
    'D': 'ض', 'T': 'ط', 'Z': 'ظ', 'E': 'ع', 'g': 'غ', 'f': 'ف', 'q': 'ق',
    'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'h': 'ه', 'w': 'و', 'y': 'ي',
    "'": 'ء', '>': 'أ', '&': 'ؤ', '<': 'إ', '}': 'ئ', '|': 'آ', 'Y': 'ى', 'p': 'ة',
    'a': '\u064E', 'u': '\u064F', 'i': '\u0650', 'o': '\u0652', '~': '\u0651',
    'F': '\u064B', 'N': '\u064C', 'K': '\u064D', '`': '\u0670', '^': '\u0653',
    '{': 'ا', '@': '', '#': '', '_': ''
};

function fromBuckwalter(text) {
    if (!text) return text;
    return text.split('').map(char => BUCKWALTER_TO_ARABIC[char] || char).join('');
}

function stripDiacritics(text) {
    if (!text) return text;
    return text.replace(/[\u064B-\u0652\u0670\u0653]/g, '');
}

async function run() {
    // Load static lexicon
    const lexiconPath = path.join(process.cwd(), 'src/lib/lexicon-data.js');
    const lexiconContent = fs.readFileSync(lexiconPath, 'utf8');
    const existingKeys = new Set();
    const keyMatches = lexiconContent.matchAll(/'([^']+)': \{/g);
    for (const match of keyMatches) {
        existingKeys.add(match[1]);
        existingKeys.add(stripDiacritics(match[1]));
    }

    // Load Quran Data
    const quranPath = path.join(process.cwd(), 'data/processed/quran-data.json');
    const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf8'));

    const targetSuras = [1, 2, 3, 4, 5, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
    const lemmaFrequencies = {};

    for (const sura of targetSuras) {
        const suraData = quranData.quran[sura];
        if (!suraData) continue;

        for (const aya in suraData) {
            const words = suraData[aya];
            for (const wordId in words) {
                const word = words[wordId];
                const stemSegment = word.segments.find(s =>
                    s.tag === 'N' || s.tag === 'V' || s.tag === 'ADJ' || s.tag === 'PN'
                );

                if (stemSegment) {
                    const rawLemma = stemSegment.features.LEM || stemSegment.features.ROOT || stemSegment.form;
                    const arLemma = fromBuckwalter(rawLemma);
                    const cleanAr = stripDiacritics(arLemma);

                    if (!existingKeys.has(arLemma) && !existingKeys.has(cleanAr)) {
                        lemmaFrequencies[arLemma] = (lemmaFrequencies[arLemma] || 0) + 1;
                    }
                }
            }
        }
    }

    const missing = Object.entries(lemmaFrequencies)
        .map(([ar, count]) => ({ ar, clean: stripDiacritics(ar), count }))
        .sort((a, b) => b.count - a.count);

    fs.writeFileSync('missing-priority.json', JSON.stringify(missing, null, 2));
    console.log(`Found ${missing.length} missing unique lemmas in target Surahs.`);
    console.log(`Top 10 missing:`, missing.slice(0, 10));
}

run();
