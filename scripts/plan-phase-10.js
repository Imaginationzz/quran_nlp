
const fs = require('fs');
const lexiconContent = fs.readFileSync('c:/Users/yezid/Desktop/NLP_Project/src/lib/lexicon-data.js', 'utf8');
const missingPriority = JSON.parse(fs.readFileSync('c:/Users/yezid/Desktop/NLP_Project/missing-priority.json', 'utf8'));

const missingWords = [];
for (const entry of missingPriority) {
    const regex = new RegExp(`['"]${entry.ar}['"]\\s*:`);
    if (!regex.test(lexiconContent)) {
        missingWords.push(entry);
    }
    if (missingWords.length >= 50) break;
}

console.log(JSON.stringify(missingWords, null, 2));
