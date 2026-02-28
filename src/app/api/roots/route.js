import { NextResponse } from 'next/server';
import { fromBuckwalter } from '@/lib/arabic-utils';
import { getQuranData } from '@/lib/data-loader';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const suraFilter = searchParams.get('sura');
        const suraNum = suraFilter ? parseInt(suraFilter) : null;

        const data = await getQuranData();

        const stats = Object.entries(data.roots)
            .map(([root, occurrences]) => {
                // If sura is specified, only count occurrences in that sura
                const filteredOccurrences = suraNum
                    ? occurrences.filter(occ => occ.sura === suraNum)
                    : occurrences;

                if (filteredOccurrences.length === 0) return null;

                return {
                    root: fromBuckwalter(root, true),
                    count: filteredOccurrences.length,
                    samples: filteredOccurrences.slice(0, 3)
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Roots API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
