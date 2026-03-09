
const fs = require('fs');
const lexiconContent = fs.readFileSync('c:/Users/yezid/Desktop/NLP_Project/src/lib/lexicon-data.js', 'utf8');
const missingPriority = JSON.parse(fs.readFileSync('c:/Users/yezid/Desktop/NLP_Project/missing-priority.json', 'utf8'));

const missingWords = [];
for (const entry of missingPriority) {
    const regex = new RegExp(`['"]${entry.ar}['"]\\s*:`);
    if (!regex.test(lexiconContent)) {
        missingWords.push(entry);
    }
}

console.log(JSON.stringify(missingWords.slice(0, 15), null, 2));
