import { NextResponse } from 'next/server';
import { toBuckwalter, fromBuckwalter, cleanArabic, SURAH_NAMES } from '@/lib/arabic-utils';
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

    // 1. Collision for root 's k n' (س ك ن)
    // If the query is related to Marriage (الزواج / marriage):
    // The only spouse/couple-related 'skn' verses are 30:21, 7:189, 2:35, 7:19.
    // Rest of 'skn' verses are about night rest, houses, general tranquility, or poverty.
    const isMarriageQuery = query.includes('زواج') || queryLower.includes('marriage');
    if (isMarriageQuery && rootVal === 'skn') {
        const allowedLocations = ['30:21', '7:189', '2:35', '7:19'];
        if (!allowedLocations.includes(location)) {
            return false;
        }
    }

    // 2. Collision for root 'n f q' (ن ف ق)
    // IMPORTANT: Must distinguish الانفاق (spending) vs النفاق (hypocrisy).
    // Use exact word matching to avoid substring collision (الانفاق contains نفاق).
    const isSpendingQuery = query === 'الانفاق' || query === 'إنفاق' || queryLower === 'spending' || queryLower.includes('charity');
    const isHypocrisyQuery = query === 'النفاق' || queryLower === 'hypocrisy';

    if (rootVal === 'nfq') {
        if (isSpendingQuery) {
            // Exclude hypocrisy-related lemmas from spending results
            if (lemVal === 'naAfaqu' || lemVal === 'muna`fiquwn' || lemVal === 'muna`fiqa`t' || lemVal === 'nifaAq') {
                return false;
            }
        }
        if (isHypocrisyQuery) {
            // Exclude spending-related lemmas from hypocrisy results
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
    // If the query is related to Wisdom (حكمة / wisdom):
    // Exclude lemmas: fiSaAl (weaning), faSiylat (family), faSala (depart/set out)
    const isWisdomQuery = query.includes('حكمة') || queryLower.includes('wisdom');
    if (isWisdomQuery && rootVal === 'fSl') {
        if (lemVal === 'fiSaAl' || lemVal === 'faSiylat' || lemVal === 'faSala') {
            return false;
        }
    }

    // 4. Collision for root 'jwd' (ج و د)
    // Root jwd covers both 'generosity/giving' AND 'jiyaAd' (racehorses, Surah Sad 38:31).
    // When query is Spending / الانفاق, exclude the horse-related lemma.
    if (isSpendingQuery && rootVal === 'jwd') {
        if (lemVal === 'jiyaAd') {
            return false;
        }
    }
    // 5. Collision for root 'nSr' (ن ص ر)
    // Root nSr covers 'victory/support' AND 'naSoraAniy~' (Christians/Nazarenes).
    // When query is Success / فلاح, exclude the Christians lemma.
    const isSuccessQuery = query.includes('فلاح') || queryLower.includes('success');
    if (isSuccessQuery && rootVal === 'nSr') {
        if (lemVal === 'naSoraAniy~') {
            return false;
        }
    }
    // 6. Collision for root 'Edl' (ع د ل)
    // Root Edl covers 'justice/equity' AND 'ransom/compensation' (Day of Judgment).
    // When query is Politics / السياسة, exclude Day-of-Judgment ransom verses.
    const isPoliticsQuery = query.includes('السياسة') || queryLower.includes('politic');
    if (isPoliticsQuery && rootVal === 'Edl') {
        const ransomVerses = ['2:48', '2:123', '6:70'];
        if (ransomVerses.includes(location)) {
            return false;
        }
    }

    // 7. Collision for root 'qrA' (ق ر أ), 'nwr' (ن و ر), '*kr' (ذ ك ر), and 'ktb' (ك ت ب)
    // When query is Quran / قرآن, we must exclude:
    // - menstruation periods (lemma quruw^' / قروء) from root qrA
    // - fire / Hellfire (lemma naAr) from root nwr (since SimilarWord is نور / Light)
    // - male/masculine (lemma *akar) and generic verbs of remembering (lemmas *akara, ta*ak~ara) from root *kr (since SimilarWord is ذكر / Reminder)
    // - writing, prescribing, scribes (lemmas kataba, kaAtib, kaAtibu, makotuwb, {kotataba) from root ktb (since SimilarWord is كتاب / Book)
    const isQuranQuery = query.includes('قرآن') || queryLower.includes('quran');
    if (isQuranQuery) {
        // Exclude menstruation period from root qrA
        if (rootVal === 'qrA' && lemVal === 'quruw^\'') {
            return false;
        }
        // Exclude fire / Hellfire / physical light from root nwr
        if (rootVal === 'nwr') {
            if (lemVal === 'naAr') {
                return false;
            }
            // Exclude physical daylight/moonlight/creation of light verses
            const physicalLightVerses = ['6:1', '10:5', '13:16', '25:61', '35:20', '71:16'];
            if (physicalLightVerses.includes(location)) {
                return false;
            }
        }
        // Exclude male gender, human memory, and generic dhikr of Allah from root *kr
        if (rootVal === '*kr') {
            if (lemVal === '*akar' || lemVal === '*akara' || lemVal === 'ta*ak~ara') {
                return false;
            }
            // Exclude general remembrance, human recalling, and witness reminding locations
            const genericDhikrOrMemoryVerses = [
                '2:198', '2:200', '2:203', '2:231', '2:239', '2:282',
                '3:103', '3:135', '5:91', '10:71', '12:42', '12:45'
            ];
            if (genericDhikrOrMemoryVerses.includes(location)) {
                return false;
            }
            // Exclude verses about historical nations forgetting their reminders
            const historicalReminders = ['5:13', '5:14', '6:44', '7:165'];
            if (historicalReminders.includes(location)) {
                return false;
            }
        }
        // Exclude writing/scribing contract verbs from root ktb
        if (rootVal === 'ktb') {
            const writingLemmas = ['kataba', 'kaAtib', 'kaAtibu', 'makotuwb', '{kotataba'];
            if (writingLemmas.includes(lemVal)) {
                return false;
            }
        }
    }

    return true;
}


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
            // Match concepts strictly by primary Arabic or English name to avoid concept bleed
            matchedConcepts = CONCEPTS.filter(c =>
                c.nameEn.toLowerCase().includes(qLower) ||
                c.nameAr.includes(queryRaw)
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
            // For semantic, build searchTerms from similar words AND roots extracted from key verses
            const searchTerms = new Set([queryNormalized]);
            if (type === 'semantic') {
                matchedConcepts.forEach(c => {
                    // Add similar word Buckwalter forms (these match short roots like jwd, b*l directly)
                    c.similarWords.forEach(sw => searchTerms.add(toBuckwalter(sw.ar, true)));

                    // Extract actual ROOT values from words in key verses that match similar words
                    // This finds the real 3-letter root (e.g. nfq for الانفاق key verse 2:261)
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
                                    // Include root if: it matches a similar word, OR
                                    // its consonants are a subset/superset of the concept name consonants
                                    // (e.g. nfq ⊂ AnfAq for الانفاق)
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
                            break; // One match per verse — stop scanning remaining words
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
                                word: cleanArabic(fromBuckwalter(form)),
                                fullVerse: fullVerse,
                                context: `سورة ${SURAH_NAMES[sura]}، آية ${aya}`,
                                lemma: cleanArabic(word.segments.find(s => s.features?.LEM) ? fromBuckwalter(word.segments.find(s => s.features?.LEM).features.LEM, false) : ''),
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

        const finalResults = [...enrichedResults, ...results.slice(20)];
        return NextResponse.json({ results: finalResults });

    } catch (error) {
        console.error('Search API Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
