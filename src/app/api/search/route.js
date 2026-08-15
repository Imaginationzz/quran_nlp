import { NextResponse } from 'next/server';
import { toBuckwalter, fromBuckwalter, cleanArabic, normalizeArabic, SURAH_NAMES } from '@/lib/arabic-utils';
import { getQuranData } from '@/lib/data-loader';
import { CONCEPTS } from '@/lib/concepts-data';

function validateSemanticMatch(word, queryRaw, location) {
    const query = queryRaw.trim();
    const queryLower = query.toLowerCase();
    const segments = word.segments || [];
    const rootSeg = segments.find(s => s.features?.ROOT);
    const lemSeg = segments.find(s => s.features?.LEM);
    
    const rootVal = rootSeg ? rootSeg.features.ROOT : '';
    const lemVal = lemSeg ? lemSeg.features.LEM : '';

    // 1. Collision for root 's k n' (س ك ن) and 'z w j' (ز و ج)
    const isMarriageQuery = query.includes('زواج') || queryLower.includes('marriage');
    if (isMarriageQuery && rootVal === 'skn') {
        const allowedLocations = ['30:21', '7:189', '2:35', '7:19'];
        if (!allowedLocations.includes(location)) {
            return false;
        }
    }
    // When query is Marriage / الزواج, exclude root 'z w j' (ز و ج) verses where 'azwaj' or 'zawjayn' means pairs/species of animals, plants, fruits, or categories
    if (isMarriageQuery && rootVal === 'zwj') {
        const nonMarriageZwjLocations = [
            '6:143',  // ثمانية أزواج من الضأن اثنين ومن المعز اثنين (cattle pairs)
            '39:6',   // وأنزل لكم من الأنعام ثمانية أزواج (cattle pairs)
            '11:40',  // احمل فيها من كل زوجين اثنين (Noah's ark animal pairs)
            '23:27',  // فاسلك فيها من كل زوجين اثنين (Noah's ark animal pairs)
            '13:3',   // ومن كل الثمرات جعل فيها زوجين اثنين (fruit pairs)
            '55:52',  // فيهما من كل فاكهة زوجان (fruit pairs in Paradise)
            '20:53',  // فأخرجنا به أزواجا من نبات شتى (diverse plant species)
            '22:5',   // وأنبتت من كل زوج بهيج (kinds of vegetation)
            '26:7',   // كم أنبتنا فيها من كل زوج كريم (kinds of vegetation)
            '31:10',  // فأنبتنا فيها من كل زوج كريم (kinds of vegetation)
            '50:7',   // وأنبتنا فيها من كل زوج بهيج (kinds of vegetation)
            '15:88',  // ما متعنا به أزواجا منهم (categories of disbelievers)
            '20:131', // ما متعنا به أزواجا منهم (categories of disbelievers)
            '37:22',  // احشروا الذين ظلموا وأزواجهم (peers/counterparts in wrongdoing)
            '38:58',  // وآخر من شكله أزواج (types of punishment)
            '51:49',  // ومن كل شيء خلقنا زوجين (cosmic duality/pairs)
            '56:7',   // وكنتم أزواجا ثلاثة (three categories of people on Judgment Day)
            '81:7',   // وإذا النفوس زوجت (pairing of souls with deeds)
            '36:36',  // خلق الأزواج كلها مما تنبت الأرض (botanical and cosmic pairs)
            '43:12',  // خلق الأزواج كلها (all pairs of creation)
        ];
        if (nonMarriageZwjLocations.includes(location)) {
            return false;
        }
    }

    // 2. Collision for root 'n f q' (ن ف ق)
    const isSpendingQuery = query === 'الانفاق' || query === 'إنفاق' || queryLower === 'spending' || queryLower.includes('charity');
    const isHypocrisyQuery = query === 'النفاق' || queryLower === 'hypocrisy';

    if (rootVal === 'nfq') {
        if (isSpendingQuery) {
            if (lemVal === 'naAfaqu' || lemVal === 'muna`fiquwn' || lemVal === 'muna`fiqa`t' || lemVal === 'nifaAq') {
                return false;
            }
        }
        if (isHypocrisyQuery) {
            if (
                lemVal === '>anfaqa' ||
                lemVal === '<infaAq' ||
                lemVal === 'munfiqiyn' ||
                lemVal.startsWith('nafaq')
            ) {
                return false;
            }
        }
    }

    // 3. Collision for root 'fSl' (ف ص ل)
    const isWisdomQuery = query.includes('حكمة') || queryLower.includes('wisdom');
    if (isWisdomQuery && rootVal === 'fSl') {
        if (lemVal === 'fiSaAl' || lemVal === 'faSiylat' || lemVal === 'faSala') {
            return false;
        }
    }

    // 4. Collision for root 'jwd' (ج و د)
    if (isSpendingQuery && rootVal === 'jwd') {
        if (lemVal === 'jiyaAd') {
            return false;
        }
    }
    // 5. Collision for root 'nSr' (ن ص ر)
    const isSuccessQuery = query.includes('فلاح') || queryLower.includes('success');
    if (isSuccessQuery && rootVal === 'nSr') {
        if (lemVal === 'naSoraAniy~') {
            return false;
        }
    }
    // 6. Collision for root 'Edl' (ع د ل)
    const isPoliticsQuery = query.includes('السياسة') || queryLower.includes('politic');
    if (isPoliticsQuery && rootVal === 'Edl') {
        const ransomVerses = ['2:48', '2:123', '6:70'];
        if (ransomVerses.includes(location)) {
            return false;
        }
    }

    // 7. Collision for root 'qrA' (ق ر أ), 'nwr' (ن و ر), '*kr' (ذ ك ر), and 'ktb' (ك ت ب)
    const isQuranQuery = query.includes('قرآن') || queryLower.includes('quran');
    if (isQuranQuery) {
        if (rootVal === 'qrA' && lemVal === 'quruw^\'') {
            return false;
        }
        if (rootVal === 'nwr') {
            if (lemVal === 'naAr') {
                return false;
            }
            const physicalLightVerses = ['6:1', '10:5', '13:16', '25:61', '35:20', '71:16'];
            if (physicalLightVerses.includes(location)) {
                return false;
            }
        }
        if (rootVal === '*kr') {
            if (lemVal === '*akar' || lemVal === '*akara' || lemVal === 'ta*ak~ara') {
                return false;
            }
            const genericDhikrOrMemoryVerses = [
                '2:198', '2:200', '2:203', '2:231', '2:239', '2:282',
                '3:103', '3:135', '5:91', '10:71', '12:42', '12:45'
            ];
            if (genericDhikrOrMemoryVerses.includes(location)) {
                return false;
            }
            const historicalReminders = ['5:13', '5:14', '6:44', '7:165'];
            if (historicalReminders.includes(location)) {
                return false;
            }
        }
        if (rootVal === 'ktb') {
            const writingLemmas = ['kataba', 'kaAtib', 'kaAtibu', 'makotuwb', '{kotataba'];
            if (writingLemmas.includes(lemVal)) {
                return false;
            }
        }
    }

    // 8. Collision for root 'qSS' (ق ص ص)
    const isStoriesQuery = query.includes('القصص') || queryLower.includes('stori') || queryLower.includes('narrative');
    const isQisasQuery = query.includes('القصاص') || queryLower.includes('qisas') || queryLower.includes('retribut');

    if (rootVal === 'qSS') {
        if (isStoriesQuery && lemVal === 'qiSaAS') {
            return false;
        }
        if (isQisasQuery && (lemVal === 'qaSaS' || lemVal === 'qaS~a')) {
            return false;
        }
    }

    return true;
}


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q');
    const type = searchParams.get('type') || 'keyword';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 1000;
    const shouldEnrich = searchParams.get('enrich') === 'true';

    if (!rawQuery) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const queryRaw = rawQuery.trim();
    const queryNormalized = toBuckwalter(queryRaw, true);
    const queryExact = toBuckwalter(queryRaw, false);
    const queryNormAr = normalizeArabic(queryRaw);

    try {
        const data = await getQuranData();
        let results = [];

        // Helper to reconstruct verse and filter junk characters
        const reconstructVerse = (words) => {
            return cleanArabic(
                Object.values(words)
                    .map(w => w.segments.map(s => fromBuckwalter(s.form)).join(''))
                    .join(' ')
            )
            .replace(/\s+/g, ' ')  // Normalize spaces
            .trim();
        };

        // 1. Semantic/Concept Search Pre-processing
        let matchedConcepts = [];
        if (type === 'semantic') {
            const qLower = queryRaw.toLowerCase();
            const qNorm = normalizeArabic(queryRaw);
            const qWithoutAl = (qNorm.startsWith('ال') && qNorm.length > 3) ? qNorm.slice(2) : qNorm;

            // Match concepts strictly by primary Arabic or English name to avoid concept bleed
            matchedConcepts = CONCEPTS.filter(c => {
                const cNorm = normalizeArabic(c.nameAr);
                const cWithoutAl = (cNorm.startsWith('ال') && cNorm.length > 3) ? cNorm.slice(2) : cNorm;
                return (
                    c.nameEn.toLowerCase().includes(qLower) ||
                    cNorm.includes(qNorm) ||
                    cWithoutAl.includes(qWithoutAl) ||
                    (qWithoutAl && cNorm.includes(qWithoutAl)) ||
                    (qNorm && cWithoutAl.includes(qNorm))
                );
            });

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
            // For semantic, build searchTerms from similar words AND roots extracted from key verses
            const searchTerms = new Set([queryNormalized]);
            if (type === 'semantic') {
                matchedConcepts.forEach(c => {
                    c.similarWords.forEach(sw => searchTerms.add(toBuckwalter(sw.ar, true)));

                    const nameBw = toBuckwalter(c.nameAr, true);
                    const swBwForms = c.similarWords.map(sw => toBuckwalter(sw.ar, true));
                    for (const kv of c.keyVerses) {
                        const [kvSura, kvAya] = kv.key.split(':');
                        const kvWords = data.quran[kvSura]?.[kvAya];
                        if (kvWords) {
                            for (const w of Object.values(kvWords)) {
                                for (const seg of w.segments) {
                                    if (!seg.features?.ROOT || !seg.features?.LEM) continue;
                                    const root = seg.features.ROOT;
                                    const lemBw = toBuckwalter(seg.features.LEM, true);
                                    const nameConsonants = nameBw.replace(/[AaIiUuoF~`]/g, '');
                                    const rootConsonants = root.replace(/[AaIiUuoF~`]/g, '');
                                    if (
                                        swBwForms.some(sw => lemBw.includes(sw) || sw.includes(lemBw)) ||
                                        nameConsonants.includes(rootConsonants)
                                    ) {
                                        searchTerms.add(root);
                                    }
                                }
                            }
                        }
                    }
                });
            }

            const searchTermsArr = [...searchTerms];

            outer: for (const [sura, ayas] of Object.entries(data.quran)) {
                for (const [aya, words] of Object.entries(ayas)) {
                    // Skip if already added via concept key verses
                    if (results.some(r => r.location === `${sura}:${aya}`)) continue;

                    const fullVerse = reconstructVerse(words);

                    for (const [wordIdx, word] of Object.entries(words)) {
                        const matches = word.segments.some(s =>
                            searchTermsArr.some(st =>
                                (s.features?.ROOT && s.features.ROOT === st) ||
                                (s.features?.LEM && toBuckwalter(s.features.LEM, true).includes(st))
                            )
                        );

                        if (matches) {
                            if (type === 'semantic' && !validateSemanticMatch(word, queryRaw, `${sura}:${aya}`)) {
                                continue;
                            }
                            results.push({
                                location: `${sura}:${aya}`,
                                wordIdx: wordIdx,
                                word: cleanArabic(fromBuckwalter(word.segments.map((s) => s.form).join(''))),
                                fullVerse: fullVerse,
                                context: `سورة ${SURAH_NAMES[sura]}، آية ${aya}`,
                                lemma: cleanArabic(fromBuckwalter(word.segments.find(s => s.features?.LEM)?.features.LEM || '', false)),
                                root: fromBuckwalter(word.segments.find(s => s.features?.ROOT)?.features.ROOT || '', true),
                                pos: word.segments.find(s => s.features?.LEM || s.features?.ROOT)?.tag || ''
                            });
                            if (results.length >= limit) break outer;
                            break; // One match per verse
                        }
                    }
                }
            }
        } else {
            // Keyword & full text / morphology search with Arabic normalization
            const queryWithoutAl = (queryNormAr.startsWith('ال') && queryNormAr.length > 3)
                ? queryNormAr.slice(2)
                : null;

            outer: for (const [sura, ayas] of Object.entries(data.quran)) {
                for (const [aya, words] of Object.entries(ayas)) {
                    const fullVerse = reconstructVerse(words);

                    for (const [wordIdx, word] of Object.entries(words)) {
                        const form = word.segments.map((s) => s.form).join('');
                        const formAr = cleanArabic(fromBuckwalter(form));
                        const formNormAr = normalizeArabic(formAr);
                        const formBwNorm = toBuckwalter(formAr, true);

                        const lemRaw = word.segments.find(s => s.features?.LEM)?.features.LEM || '';
                        const lemAr = cleanArabic(fromBuckwalter(lemRaw, false));
                        const lemNormAr = normalizeArabic(lemAr);

                        const rootRaw = word.segments.find(s => s.features?.ROOT)?.features.ROOT || '';
                        const rootAr = fromBuckwalter(rootRaw, true);
                        const rootNormAr = normalizeArabic(rootAr);

                        const isMatch =
                            form.includes(queryExact) ||
                            formBwNorm.includes(queryNormalized) ||
                            (queryNormAr && (
                                formNormAr.includes(queryNormAr) ||
                                lemNormAr.includes(queryNormAr) ||
                                (queryWithoutAl && formNormAr.includes(queryWithoutAl)) ||
                                (queryWithoutAl && lemNormAr.includes(queryWithoutAl)) ||
                                rootNormAr === queryNormAr ||
                                (queryWithoutAl && rootNormAr === queryWithoutAl) ||
                                (queryNormAr.length > 2 && rootNormAr.includes(queryNormAr))
                            ));

                        if (isMatch) {
                            results.push({
                                location: `${sura}:${aya}`,
                                wordIdx: wordIdx,
                                word: formAr,
                                fullVerse: fullVerse,
                                context: `سورة ${SURAH_NAMES[sura]}، آية ${aya}`,
                                lemma: lemAr,
                                root: rootAr,
                                pos: word.segments.find(s => s.features?.LEM || s.features?.ROOT)?.tag || ''
                            });
                            if (results.length >= limit) break outer;
                            break; // One match per verse
                        }
                    }
                }
            }
        }

        // Enrich results only if specifically requested
        if (shouldEnrich && results.length > 0) {
            const enrichCount = Math.min(results.length, 20);
            const enrichedResults = await Promise.all(results.slice(0, enrichCount).map(async (res) => {
                try {
                    const [sura, aya] = res.location.split(':');
                    const [transRes, tafsirRes] = await Promise.all([
                        fetch(`https://api.quran.com/api/v4/verses/by_key/${sura}:${aya}?translations=20`),
                        fetch(`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${sura}:${aya}`)
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

            return NextResponse.json({
                total: results.length,
                results: [...enrichedResults, ...results.slice(enrichCount)]
            });
        }

        return NextResponse.json({
            total: results.length,
            results: results
        });

    } catch (error) {
        console.error('Search API Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

