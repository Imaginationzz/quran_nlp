import { NextResponse } from 'next/server';
import { getQuranData } from '@/lib/data-loader';
import { fromBuckwalter, cleanArabic } from '@/lib/arabic-utils';

export async function GET(request, { params }) {
    try {
        const { sura } = await params;
        const data = await getQuranData();
        const surahData = data.quran[sura];

        if (!surahData) {
            return NextResponse.json({ error: 'Surah not found' }, { status: 404 });
        }

        const verses = {};
        Object.entries(surahData).forEach(([aya, words]) => {
            const reconstructed = Object.values(words)
                .map(w => cleanArabic(fromBuckwalter(w.segments.map(s => s.form).join(''))))
                .join(' ');
            verses[aya] = reconstructed;
        });

        return NextResponse.json({ sura, verses });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to load surah data' }, { status: 500 });
    }
}
