async function scanFullRange() {
    const surahs = [1, 2, 3, 4, 5];
    const genericLemmas = new Set();

    for (const s of surahs) {
        const infoRes = await fetch(`https://api.quran.com/api/v4/chapters/${s}`);
        const info = await infoRes.json();
        const verseCount = info.chapter.verses_count;

        const promises = [];
        for (let a = 1; a <= verseCount; a++) {
            promises.push(fetch(`http://localhost:3000/api/quran/${s}/${a}`).then(r => r.json()).catch(() => null));
        }

        const chunks = await Promise.all(promises);
        chunks.forEach(data => {
            if (!data) return;
            Object.values(data.words).forEach(w => {
                if (w.lexiconAr?.includes('يتناول هذا اللفظ معنى بلاغياً عميقاً')) {
                    genericLemmas.add(w.meaningAr);
                }
            });
        });
    }

    const sorted = Array.from(genericLemmas).sort();
    const fs = require('fs');
    fs.writeFileSync('generic_lemmas_1_5.json', JSON.stringify(sorted, null, 2));
    console.log(`Saved ${sorted.length} unique generic lemmas to generic_lemmas_1_5.json`);
}

scanFullRange();
