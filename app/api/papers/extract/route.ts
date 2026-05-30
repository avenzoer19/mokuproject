import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const PROMPT = `You are an academic bibliographic metadata extractor. Read this PDF and extract the paper metadata.

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "The complete paper title exactly as printed",
  "authors": "Lastname A, Lastname B, Lastname C (all authors)",
  "year": 2024,
  "journal": "Full journal or conference name",
  "doi": "10.1234/identifier",
  "abstract": "Full abstract text verbatim"
}

Rules:
- title: exact title as printed, never truncate
- authors: all authors, "Lastname Initial" format, comma-separated
- year: integer publication year (not submission/preprint date), null if not found
- journal: full journal name (e.g. "Biomaterials" not "Biomater."), null if not found
- doi: only the identifier string (e.g. 10.1039/d4bm00021a), NOT a URL, null if not found
- abstract: complete abstract text including all sentences, null if not found

Output ONLY the JSON object. No markdown fences, no explanation, no extra text.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const file = form.get('pdf') as File | null;
  if (!file || file.type !== 'application/pdf')
    return NextResponse.json({ error: 'A PDF file is required' }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: `PDF is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 10 MB.` },
      { status: 413 },
    );

  const bytes  = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'application/pdf', data: base64 } },
        { text: PROMPT },
      ],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
      temperature: 0.05,
    },
  } as Parameters<typeof model.generateContent>[0]);

  let meta: Record<string, unknown>;
  try { meta = JSON.parse(result.response.text()); }
  catch { return NextResponse.json({ error: 'AI returned invalid JSON — try again' }, { status: 502 }); }

  return NextResponse.json({
    title:    typeof meta.title    === 'string' ? meta.title.trim()    : null,
    authors:  typeof meta.authors  === 'string' ? meta.authors.trim()  : null,
    year:     typeof meta.year     === 'number' ? meta.year            : null,
    journal:  typeof meta.journal  === 'string' ? meta.journal.trim()  : null,
    doi:      typeof meta.doi      === 'string' ? meta.doi.trim()      : null,
    abstract: typeof meta.abstract === 'string' ? meta.abstract.trim() : null,
  });
}
