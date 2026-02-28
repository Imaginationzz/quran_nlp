import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { text1, text2 } = await request.json();

        const response = await fetch('http://localhost:8001/similarity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text1, text2 }),
        });

        if (!response.ok) {
            throw new Error('NLP Service Error');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Similarity API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
