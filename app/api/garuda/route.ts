import { NextRequest, NextResponse } from 'next/server';

export interface GarudaResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publisher: string;
  abstract: string;
  doi: string | null;
  year: number | null;
  detailUrl: string;
  downloadUrl: string | null;
}

/* Decode common HTML entities */
function ent(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
}

function parseGaruda(html: string, max: number): GarudaResult[] {
  const results: GarudaResult[] = [];

  // Articles are wrapped in <div class="article-item"> — split on that
  const sections = html.split('<div class="article-item">');
  sections.shift(); // drop everything before the first article

  for (const sec of sections) {
    if (results.length >= max) break;

    // ID + title — text is inside <xmp> within the title-article link
    const tm = sec.match(/class="title-article"\s+href="\/documents\/detail\/(\d+)">\s*<xmp>([\s\S]*?)<\/xmp>/);
    if (!tm) continue;
    const id = tm[1];
    const title = ent(tm[2]);
    if (!title || title.length < 3) continue;

    // Authors — each in a separate author-article link with <xmp>
    const authors: string[] = [];
    const ap = /class="author-article"[^>]*>\s*<xmp>([\s\S]*?)<\/xmp>/g;
    let am: RegExpExecArray | null;
    while ((am = ap.exec(sec)) !== null) {
      const a = ent(am[1]);
      if (a) authors.push(a);
    }

    // Journal — first subtitle-article <xmp>
    const jm = sec.match(/class="subtitle-article">\s*([\s\S]*?)<\/xmp>/);
    const rawJournal = jm ? ent(jm[1]) : '';
    // Strip "Vol X No Y (YEAR)..." suffix to get clean journal name
    const journal = rawJournal.replace(/\s+Vol\.?\s+.*/i, '').trim();

    // Year — from "(YYYY)" anywhere in journal string, fallback bare 4-digit year
    const yyM = rawJournal.match(/\((\d{4})\)/) ?? rawJournal.match(/\b((?:19|20)\d{2})\b/);
    const year = yyM ? parseInt(yyM[1]) : null;

    // Publisher — after "Publisher : </i><xmp class="subtitle-article">"
    const pm = sec.match(/Publisher\s*:\s*<\/i>\s*<xmp[^>]*>\s*([\s\S]*?)<\/xmp>/i);
    const publisher = pm ? ent(pm[1]) : '';

    // Abstract — inside <xmp class="abstract-article">
    const abm = sec.match(/class="abstract-article">\s*([\s\S]*?)<\/xmp>/);
    const abstract = abm ? ent(abm[1]) : '';

    // DOI
    const dm = sec.match(/href="https?:\/\/doi\.org\/([^"]+)"/);
    const doi = dm ? dm[1].replace(/\/$/, '') : null;

    // Download Original link — href on the <a> that wraps the download icon
    const dlm = sec.match(/<a[^>]+href="([^"]+)"[^>]*>\s*<i class="download icon"><\/i>\s*Download Original/);
    // Fallback: Garuda full PDF
    const fullPdfM = sec.match(/href="(http:\/\/download\.garuda[^"]+)"/);
    const downloadUrl = dlm ? dlm[1] : (fullPdfM ? fullPdfM[1] : null);

    results.push({
      id, title, authors, journal, publisher,
      abstract: abstract.slice(0, 900),
      doi, year,
      detailUrl: `https://garuda.kemdiktisaintek.go.id/documents/detail/${id}`,
      downloadUrl,
    });
  }

  return results;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
  const max = Math.min(parseInt(req.nextUrl.searchParams.get('max') ?? '8'), 20);

  try {
    const url = `https://garuda.kemdiktisaintek.go.id/documents?q=${encodeURIComponent(q)}&page=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Moku-Research/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id,en;q=0.9',
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) throw new Error(`Garuda returned HTTP ${res.status}`);
    const html = await res.text();

    // Try to extract total document count from page text
    const totalMatch = html.match(/(\d[\d.,]*)\s*(?:dokumen|document)/i);
    const total = totalMatch ? parseInt(totalMatch[1].replace(/[.,]/g, '')) : 0;

    const results = parseGaruda(html, max);
    return NextResponse.json({ query: q, total, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Garuda search failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
