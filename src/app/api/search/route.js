import { NextResponse } from 'next/server';
import { toBuckwalter, fromBuckwalter, SURAH_NAMES } from '@/lib/arabic-utils';
import { getQuranData } from '@/lib/data-loader';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q');
    const type = searchParams.get('type') || 'keyword';

    if (!rawQuery) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const queryRaw = rawQuery.trim();
    const queryNormalized = toBuckwalter(queryRaw, true);
    const queryExact = toBuckwalter(queryRaw, false);

    try {
        const data = await getQuranData();
        let results = [];
        const limit = 50;

        // Helper to reconstruct verse and filter junk characters
        const reconstructVerse = (words) => {
            return Object.values(words)
                .map(w => w.segments.map(s => fromBuckwalter(s.form)).join(''))
                .join(' ')
                .replace(/[@#_]/g, '') // Remove pause markers and junk (#, _)
                .replace(/\s+/g, ' ')  // Normalize spaces
                .trim();
        };

        if (type === 'root' || type === 'semantic') {
            const searchVal = queryNormalized;
            outer: for (const [sura, ayas] of Object.entries(data.quran)) {
                for (const [aya, words] of Object.entries(ayas)) {
                    const fullVerse = reconstructVerse(words);

                    for (const [wordIdx, word] of Object.entries(words)) {
                        const matches = word.segments.some(s =>
                            (s.features?.ROOT && s.features.ROOT === searchVal) ||
                            (s.features?.LEM && toBuckwalter(s.features.LEM, true).includes(searchVal))
                        );

                        if (matches) {
                            results.push({
                                location: `${sura}:${aya}`,
                                word: fromBuckwalter(word.segments.map((s) => s.form).join('')),
                                fullVerse: fullVerse,
                                context: `سورة ${SURAH_NAMES[sura]}، آية ${aya}`,
                                lemma: fromBuckwalter(word.segments.find(s => s.features?.LEM)?.features.LEM || '', false),
                                root: fromBuckwalter(word.segments.find(s => s.features?.ROOT)?.features.ROOT || '', true),
                                pos: word.segments.find(s => s.features?.LEM || s.features?.ROOT)?.tag || ''
                            });
                            if (results.length >= limit) break outer;
                        }
                    }
                }
            }

            if (type === 'root' && results.length === 0) {
                const occurrences = data.roots[queryNormalized];
                if (occurrences) {
                    results = occurrences.map((loc) => {
                        try {
                            const words = data.quran[loc.sura]?.[loc.aya];
                            const word = words?.[loc.word];
                            if (!word) return null;

                            const fullVerse = reconstructVerse(words);

                            return {
                                location: `${loc.sura}:${loc.aya}`,
                                word: fromBuckwalter(word.segments.map((s) => s.form).join('')),
                                fullVerse: fullVerse,
                                context: `سورة ${SURAH_NAMES[loc.sura]}، آية ${loc.aya}`,
                                lemma: fromBuckwalter(word.segments.find(s => s.features?.LEM)?.features.LEM || '', false),
                                root: fromBuckwalter(word.segments.find(s => s.features?.ROOT)?.features.ROOT || '', true),
                                pos: word.segments.find(s => s.features?.LEM || s.features?.ROOT)?.tag || ''
                            };
                        } catch (e) { return null; }
                    }).filter(r => r !== null).slice(0, limit);
                }
            }
        } else {
            outer: for (const [sura, ayas] of Object.entries(data.quran)) {
                for (const [aya, words] of Object.entries(ayas)) {
                    const fullVerse = reconstructVerse(words);

                    for (const word of Object.values(words)) {
                        const form = word.segments.map((s) => s.form).join('');
                        const formNormalized = toBuckwalter(fromBuckwalter(form), true);

                        if (form.includes(queryExact) || formNormalized.includes(queryNormalized)) {
                            results.push({
                                location: `${sura}:${aya}`,
                                word: fromBuckwalter(form),
                                fullVerse: fullVerse,
                                context: `سورة ${SURAH_NAMES[sura]}، آية ${aya}`,
                                lemma: fromBuckwalter(word.segments.find(s => s.features?.LEM)?.features.LEM || '', false),
                                root: fromBuckwalter(word.segments.find(s => s.features?.ROOT)?.features.ROOT || '', true),
                                pos: word.segments.find(s => s.features?.LEM || s.features?.ROOT)?.tag || ''
                            });
                            if (results.length >= limit) break outer;
                        }
                    }
                }
            }
        }

        // Enrich top 20 results
        const enrichedResults = await Promise.all(results.slice(0, 20).map(async (res) => {
            try {
                const [sura, aya] = res.location.split(':');
                const [transRes, tafsirRes] = await Promise.all([
                    fetch(`https://api.quran.com/api/v4/verses/by_key/${sura}:${aya}?translations=131`),
                    fetch(`https://api.quran.com/api/v3/chapters/${sura}/verses/${aya}/tafsirs/16`)
                ]);

                const transData = await transRes.json();
                const tafsirData = await tafsirRes.json();

                const rawTafsir = tafsirData.tafsir?.text || '';
                const cleanTafsir = rawTafsir.replace(/<[^>]*>/g, '').trim();

                // Provide more detailed summary (up to 600 chars)
                let summary = cleanTafsir;
                if (summary.length > 600) {
                    summary = summary.substring(0, 600).split(' ').slice(0, -1).join(' ') + '...';
                }

                return {
                    ...res,
                    translationEn: transData.verse?.translations?.[0]?.text?.replace(/<[^>]*>/g, '') || '',
                    summaryAr: summary
                };
            } catch (e) {
                console.error(`Enrichment failed for ${res.location}:`, e);
                return res;
            }
        }));

        const finalResults = [...enrichedResults, ...results.slice(20)];
        return NextResponse.json({ results: finalResults });

    } catch (error) {
        console.error('Search API Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
