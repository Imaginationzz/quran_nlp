const fs = require('fs');
const content = fs.readFileSync('src/lib/lexicon-data.js', 'utf8');

const startMarker = 'export const STATIC_LEXICON = {';
const endMarker = '};';

const startIndex = content.indexOf(startMarker) + startMarker.length;
const endIndex = content.lastIndexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find STATIC_LEXICON markers.');
    process.exit(1);
}

const objectContent = content.substring(startIndex, endIndex);

// Split by entry pattern: 'key': {
const entries = [];
const entryRegex = /'([^']+)':\s*\{([\s\S]*?)\},?/g;
let match;

while ((match = entryRegex.exec(objectContent)) !== null) {
    entries.push({
        key: match[1],
        content: `    '${match[1]}': {${match[2]}},`
    });
}

console.log(`Found ${entries.length} entries.`);

// Deduplicate using a Map (last one wins)
const uniqueEntriesMap = new Map();
entries.forEach(e => uniqueEntriesMap.set(e.key, e.content));

console.log(`Unique entries: ${uniqueEntriesMap.size}`);

// Sort keys alphabetically
const sortedKeys = Array.from(uniqueEntriesMap.keys()).sort();
const sortedEntries = sortedKeys.map(k => uniqueEntriesMap.get(k));

const newContent = content.substring(0, startIndex) + '\n' + sortedEntries.join('\n') + '\n' + content.substring(endIndex);

fs.writeFileSync('src/lib/lexicon-data.js', newContent);
console.log('Successfully deduplicated and sorted the lexicon.');
