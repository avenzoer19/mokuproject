import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/ai/provider';

interface PaperNode { id: string; title: string; tags: string[]; year: number; }

export async function POST(req: NextRequest) {
  try {
    const { papers, field }: { papers: PaperNode[]; field?: string } = await req.json();

    const paperList = papers
      .map(p => `- [${p.id}] "${p.title}" (${p.year})${p.tags.length ? ` [${p.tags.join(', ')}]` : ''}`)
      .join('\n');

    const prompt = `You are a research gap analyst. Given a set of papers, identify the 3 most significant knowledge gaps or underexplored research directions. Focus on gaps that are specific, actionable, and well-grounded in what is missing from the provided papers. Do not include any text outside the JSON.

Research field: ${field || 'Biomedical Engineering / Biomaterials / Tissue Engineering'}

Papers in library:
${paperList}

Respond with ONLY this JSON (no markdown, no extra text):
{"gaps":[{"id":"gap-1","title":"<max 8 words>","description":"<2 sentences: what is missing and why it matters>","confidence":<60-98>,"relatedPaperIds":["p1","p2"],"suggestedApproach":"<1 sentence>"},{"id":"gap-2",...},{"id":"gap-3",...}]}`;

    const raw = await complete(prompt, 900);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI returned malformed response' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
