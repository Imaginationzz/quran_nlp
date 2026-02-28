import { NextResponse } from 'next/server';
import { fromBuckwalter, SURAH_NAMES } from '@/lib/arabic-utils';
import { getQuranData } from '@/lib/data-loader';

export async function GET() {
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
            const data = await getQuranData();

            // 1. Pick a random Ayah
            const suras = Object.keys(data.quran);
            const randomSura = suras[Math.floor(Math.random() * suras.length)];
            const ayas = Object.keys(data.quran[randomSura]);
            const randomAya = ayas[Math.floor(Math.random() * ayas.length)];

            // 2. Fetch Ayah text and Tafsir from Quran.com
            const verseRes = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${randomSura}:${randomAya}`, { next: { revalidate: 3600 } });
            if (!verseRes.ok) continue;

            const verseData = await verseRes.json();
            const ayahText = verseData.verses?.[0]?.text_uthmani || "";
            if (!ayahText) continue;

            const tafsirRes = await fetch(`https://api.quran.com/api/v3/chapters/${randomSura}/verses/${randomAya}/tafsirs/16`, { next: { revalidate: 3600 } });
            if (!tafsirRes.ok) continue;

            const tafsirData = await tafsirRes.json();
            const correctExplanation = (tafsirData.tafsir?.text || "").replace(/<[^>]*>/g, '').trim();

            if (!correctExplanation || correctExplanation.length < 50) continue;

            // 3. Fetch 3 distractors (other random Tafsirs)
            const distractors = [];
            let dAttempts = 0;
            while (distractors.length < 3 && dAttempts < 10) {
                dAttempts++;
                const s = suras[Math.floor(Math.random() * suras.length)];
                const aKeys = Object.keys(data.quran[s]);
                const a = aKeys[Math.floor(Math.random() * aKeys.length)];

                if (s === randomSura && a === randomAya) continue;

                try {
                    const dRes = await fetch(`https://api.quran.com/api/v3/chapters/${s}/verses/${a}/tafsirs/16`, { next: { revalidate: 3600 } });
                    if (!dRes.ok) continue;
                    const dData = await dRes.json();
                    const dText = (dData.tafsir?.text || "").replace(/<[^>]*>/g, '').trim();

                    if (dText && dText.length > 80 && !distractors.includes(dText)) {
                        distractors.push(dText.substring(0, 220) + (dText.length > 220 ? "..." : ""));
                    }
                } catch (e) {
                    console.error("Distractor fetch failed", e);
                }
            }

            if (distractors.length < 3) continue;

            const shortCorrect = correctExplanation.substring(0, 220) + (correctExplanation.length > 220 ? "..." : "");

            return NextResponse.json({
                ayah: ayahText,
                location: `سورة ${SURAH_NAMES[randomSura]}، آية ${randomAya}`,
                correctExplanation: shortCorrect,
                options: [shortCorrect, ...distractors].sort(() => Math.random() - 0.5)
            });

        } catch (error) {
            console.error(`Quiz API Attempt ${attempts} Error:`, error);
            if (attempts >= MAX_ATTEMPTS) {
                return NextResponse.json({ error: error.message || 'Failed after multiple attempts' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ error: 'Could not generate a valid challenge' }, { status: 500 });
}
