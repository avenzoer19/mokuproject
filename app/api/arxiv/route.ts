import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
  const max = req.nextUrl.searchParams.get('max') ?? '8';
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(q)}&max_results=${max}&sortBy=relevance`;
  const upstream = await fetch(url, { next: { revalidate: 60 } });
  const xml = await upstream.text();
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
