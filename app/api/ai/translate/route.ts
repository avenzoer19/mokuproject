import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang, targetLang }: {
      text: string;
      sourceLang: string;
      targetLang: string;
    } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 5000) {
      return NextResponse.json({ error: 'Text exceeds 5,000 word limit per request' }, { status: 400 });
    }

    const prompt = `You are a professional academic translator. Translate the following ${sourceLang} text into ${targetLang} with precision and clarity. Preserve academic terminology, maintain the formal register, and keep all formatting, numbers, units, and citations (e.g. [1], [2]) exactly as written. Output ONLY the translated text — no preamble, no explanation, no markdown.

SOURCE TEXT (${sourceLang}):
${text}

TRANSLATION (${targetLang}):`;

    const translated = await complete(prompt, 4096);

    const translatedWordCount = translated.trim().split(/\s+/).length;

    return NextResponse.json({
      translated: translated.trim(),
      wordCount,
      translatedWordCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
