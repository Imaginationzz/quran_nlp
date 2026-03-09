
const fs = require('fs');

// Read lexicon-data.js
const lexiconContent = fs.readFileSync('c:/Users/yezid/Desktop/NLP_Project/src/lib/lexicon-data.js', 'utf8');
const missingPriority = JSON.parse(fs.readFileSync('c:/Users/yezid/Desktop/NLP_Project/missing-priority.json', 'utf8'));

// Simpler check for existence in lexicon (searching for the key as a string)
const missingBatch = [];
let count = 0;

for (const entry of missingPriority) {
    const arWord = entry.ar;
    // Check if word exists as a key in lexicon-data.js
    // We look for 'word': or "word":
    const regex = new RegExp(`['"]${arWord}['"]\\s*:`);
    if (!regex.test(lexiconContent)) {
        missingBatch.push(entry);
        count++;
    }
    if (count >= 50) break; // Get more than a batch to plan ahead
}

console.log(JSON.stringify(missingBatch, null, 2));
