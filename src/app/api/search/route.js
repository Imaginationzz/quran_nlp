import { NextResponse } from 'next/server';
import { toBuckwalter, fromBuckwalter, SURAH_NAMES } from '@/lib/arabic-utils';
import { getQuranData } from '@/lib/data-loader';
import { CONCEPTS } from '@/lib/concepts-data';

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

        // 1. Semantic/Concept Search Pre-processing
        let matchedConcepts = [];
        if (type === 'semantic') {
            const qLower = queryRaw.toLowerCase();
            matchedConcepts = CONCEPTS.filter(c =>
                c.nameEn.toLowerCase().includes(qLower) ||
                c.nameAr.includes(queryRaw) ||
                c.similarWords.some(sw => sw.en.toLowerCase().includes(qLower) || sw.ar.includes(queryRaw))
            );

            // Add key verses from concepts as high-priority results
            for (const concept of matchedConcepts) {
                for (const kv of concept.keyVerses) {
                    const [sura, aya] = kv.key.split(':');
                    const words = data.quran[sura]?.[aya];
                    if (words) {
                        results.push({
                            location: kv.key,
                            word: concept.nameAr,
                            fullVerse: reconstructVerse(words),
                            context: `سورة ${SURAH_NAMES[sura]}، آية ${aya} (مفهوم: ${concept.nameAr})`,
                            isConceptMatch: true,
                            conceptId: concept.id
                        });
                    }
                }
            }
        }

        // 2. Main Search Logic
        if (type === 'root' || type === 'semantic') {
            // For semantic, also search for any Arabic terms from matched concepts
            const searchTerms = [queryNormalized];
            if (type === 'semantic') {
                matchedConcepts.forEach(c => {
                    searchTerms.push(toBuckwalter(c.nameAr, true));
                    c.similarWords.forEach(sw => searchTerms.push(toBuckwalter(sw.ar, true)));
                });
            }

            outer: for (const [sura, ayas] of Object.entries(data.quran)) {
                for (const [aya, words] of Object.entries(ayas)) {
                    // Skip if already added via concept key verses
                    if (results.some(r => r.location === `${sura}:${aya}`)) continue;

                    const fullVerse = reconstructVerse(words);

                    for (const [wordIdx, word] of Object.entries(words)) {
                        const matches = word.segments.some(s =>
                            searchTerms.some(st =>
                                (s.features?.ROOT && s.features.ROOT === st) ||
                                (s.features?.LEM && toBuckwalter(s.features.LEM, true).includes(st))
                            )
                        );

                        if (matches) {
                            results.push({
                                location: `${sura}:${aya}`,
                                wordIdx: wordIdx,
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
        } else {
            // Keyword search
            outer: for (const [sura, ayas] of Object.entries(data.quran)) {
                for (const [aya, words] of Object.entries(ayas)) {
                    const fullVerse = reconstructVerse(words);

                    for (const [wordIdx, word] of Object.entries(words)) {
                        const form = word.segments.map((s) => s.form).join('');
                        const formNormalized = toBuckwalter(fromBuckwalter(form), true);

                        if (form.includes(queryExact) || formNormalized.includes(queryNormalized)) {
                            results.push({
                                location: `${sura}:${aya}`,
                                wordIdx: wordIdx,
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

        // Enrich top 20 results with translations and tafsir
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
