import { NextResponse } from 'next/server';
import { fromBuckwalter, translateMorph, stripDiacritics, cleanArabic } from '@/lib/arabic-utils';
import { getQuranData } from '@/lib/data-loader';
import { CONCEPTS } from '@/lib/concepts-data';
import { STATIC_LEXICON } from '@/lib/lexicon-data';

export async function GET(request, { params }) {
    try {
        const { sura, aya } = await params;
        const data = await getQuranData();

        const ayahData = data.quran[sura]?.[aya];

        if (!ayahData) {
            return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
        }

        // Fetch translations and Tafsir from Quran.com API
        let meanings = [];
        let verseTafsir = '';
        try {
            const wordRes = await fetch(`https://api.quran.com/api/v4/verses/by_key/${sura}:${aya}?words=true`);
            const wordData = await wordRes.json();
            meanings = wordData.verse?.words || [];

            const tafsirRes = await fetch(`https://api.quran.com/api/v3/chapters/${sura}/verses/${aya}/tafsirs/16`);
            const tafsirData = await tafsirRes.json();
            verseTafsir = tafsirData.tafsir?.text || '';
        } catch (e) {
            console.error('External API Fetch failed:', e);
        }

        const localizedData = {};
        Object.entries(ayahData).forEach(([wordId, word]) => {
            const localizedSegments = word.segments.map(s => {
                const localizedFeatures = {};
                Object.entries(s.features).forEach(([fk, fv]) => {
                    const translatedKey = translateMorph(fk, 'feature');
                    let translatedValue = fv;

                    if (fk === 'LEM' || fk === 'ROOT') {
                        translatedValue = fromBuckwalter(fv, fk === 'ROOT');
                    } else if (typeof fv === 'string') {
                        translatedValue = translateMorph(fv, fk === 'POS' ? 'pos' : 'feature');
                    } else if (typeof fv === 'boolean') {
                        translatedValue = '';
                    }

                    localizedFeatures[translatedKey] = translatedValue;
                });

                return {
                    ...s,
                    form: cleanArabic(fromBuckwalter(s.form)),
                    tag: translateMorph(s.tag, 'pos'),
                    features: localizedFeatures
                };
            });

            const wordIdx = parseInt(wordId);
            const matchingWord = meanings.find(w => w.position === wordIdx);
            const wordMeaning = matchingWord?.translation?.text || '';

            const stemSegment = localizedSegments.find(s => s.features['الكلمة الأصلية'] || s.features['الجذر'] || s.tag === 'اسم' || s.tag === 'فعل');
            const rawMeaningAr = stemSegment ? stemSegment.features['الكلمة الأصلية'] || stemSegment.features['الجذر'] || stemSegment.form : '';
            const meaningAr = cleanArabic(rawMeaningAr);
            const root = cleanArabic(stemSegment?.features['الجذر'] || '');

            // Find synonyms
            let synonyms = [];
            let arabicDescription = '';

            const cleanRootStr = stripDiacritics(root);
            const cleanMeaningArStr = stripDiacritics(meaningAr);

            // 1. Check Static Lexicon (Resilient Lookup)
            const lexiconEntry = STATIC_LEXICON[meaningAr] ||
                STATIC_LEXICON[cleanMeaningArStr] ||
                STATIC_LEXICON[cleanRootStr] ||
                STATIC_LEXICON[root];

            if (lexiconEntry) {
                arabicDescription = lexiconEntry.meaning;
                synonyms = lexiconEntry.synonyms;
            } else {
                // 2. Cross-reference with CONCEPTS (Fuzzy match)
                if (cleanRootStr || cleanMeaningArStr) {
                    const matchingConcept = CONCEPTS.find(c => {
                        const conceptName = stripDiacritics(c.nameAr);
                        const conceptId = stripDiacritics(c.id);

                        return (cleanRootStr && (conceptName === cleanRootStr || conceptName.startsWith(cleanRootStr) || conceptId === cleanRootStr)) ||
                            (cleanMeaningArStr && conceptName === cleanMeaningArStr);
                    });

                    if (matchingConcept) {
                        arabicDescription = matchingConcept.descriptionAr;
                        synonyms = matchingConcept.similarWords.map(sw => sw.ar);
                    }
                }
            }

            // Lexicon entry: Meaning & Synonyms in Arabic
            let lexiconAr = '';
            if (stemSegment) {
                const parts = [];
                const finalMeaning = arabicDescription || `يتناول هذا اللفظ معنى بلاغياً عميقاً يتعلق بـ (${meaningAr}) في سياقه القرآني الفريد.`;
                parts.push(`المعنى: ${finalMeaning}`);

                if (synonyms.length > 0) {
                    parts.push(`المرادفات: ${synonyms.join('، ')}`);
                } else if (root && root !== meaningAr) {
                    parts.push(`الأصل اللغوي: ${root}`);
                }
                lexiconAr = parts.join('\n');
            } else {
                lexiconAr = `أداة بناء لغوي تربط المعاني في النظم القرآني.`;
            }

            const explanationParts = localizedSegments.map(s => `${s.tag} (${s.form})`);
            const explanation = `تتكون من: ${explanationParts.join(' + ')}`;

            localizedData[wordId] = {
                ...word,
                segments: localizedSegments,
                explanation: explanation,
                meaning: wordMeaning,
                meaningAr: meaningAr,
                lexiconAr: lexiconAr
            };
        });

        return NextResponse.json({
            words: localizedData,
            tafsir: verseTafsir
        });
    } catch (error) {
        console.error('Quran API Error:', error);
        return NextResponse.json({ error: 'Failed', message: error.message, stack: error.stack }, { status: 500 });
    }
}
