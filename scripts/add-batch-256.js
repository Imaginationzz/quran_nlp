const fs = require('fs');
const content = fs.readFileSync('src/lib/lexicon-data.js', 'utf8');
const marker = '};';
const lastIndex = content.lastIndexOf(marker);

const nextWords = `    'مَقَابِر': {
        meaning: 'جمع مقبرة، وهي حفر القبور التي يدفن فيها الموتى وتوضع فيها أجسادهم، (حتى زرتم المقابر).',
        synonyms: ['حفر القبور']
    },
    'هُمَزَة': {
        meaning: 'الذي يغتاب الناس ويذكرهم بالسوء ويطعن فيهم في غيبتهم، (ويل لكل همزة لمزة).',
        synonyms: ['مغتاب كثير الغيبة']
    },
    'لُّمَزَة': {
        meaning: 'الذي يعيب الناس ويستهزئ بهم ويشير إليهم بالسوء في وجوههم، (ويل لكل همزة لمزة).',
        synonyms: ['كثير العيب والاستهزاء']
    },
    'مُوقَدَة': {
        meaning: 'المشتعلة تأججاً ولهيباً بأمر الله وقدره (نار الله الموقدة)، (نار الله الموقدة).',
        synonyms: ['مشتعلة بشدة']
    },
    'مُّمَدَّدَة': {
        meaning: 'المطولة والممتدة في عمد وأعمدة طويلة ومغلقة (عذاب أبدي)، (في عمد ممددة).',
        synonyms: ['مطولة ممتدة']
    },
`;

const newContent = content.substring(0, lastIndex) + nextWords + content.substring(lastIndex);
fs.writeFileSync('src/lib/lexicon-data.js', newContent);
console.log('Successfully added the FINAL Batch 256 words.');
