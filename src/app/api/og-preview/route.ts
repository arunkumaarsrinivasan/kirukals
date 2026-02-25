import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'url param required' }, { status: 400 });
    }

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'KirukalBot/1.0 (diary link preview)' },
            signal: AbortSignal.timeout(5000),
        });
        const html = await res.text();

        const get = (property: string) => {
            const match = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
                ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${property}["']`, 'i'));
            return match?.[1] ?? null;
        };

        const title = get('og:title') ?? get('twitter:title')
            ?? html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null;
        const description = get('og:description') ?? get('twitter:description') ?? get('description') ?? null;
        const image = get('og:image') ?? get('twitter:image') ?? null;

        return NextResponse.json({ title, description, image, url });
    } catch {
        return NextResponse.json({ title: url, description: null, image: null, url });
    }
}
