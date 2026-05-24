import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/ai/provider';

interface ScreeningCriteria { include: string[]; exclude: string[]; }
interface PaperToScreen {
  title: string; authors: string; year: number;
  journal: string; abstract: string;
}

export async function POST(req: NextRequest) {
  try {
    const { paper, criteria }: { paper: PaperToScreen; criteria: ScreeningCriteria } = await req.json();

    const prompt = `You are a systematic review screening assistant. Evaluate this paper against the given inclusion/exclusion criteria and provide a structured JSON assessment. Do not include any explanation outside the JSON.

PAPER:
Title: ${paper.title}
Authors: ${paper.authors}
Year: ${paper.year}
Journal: ${paper.journal}
Abstract: ${paper.abstract}

INCLUSION CRITERIA:
${criteria.include.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'None specified'}

EXCLUSION CRITERIA:
${criteria.exclude.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'None specified'}

Respond with ONLY this JSON (no markdown, no extra text):
{"decision":"include"|"exclude"|"undecided","confidence":<0-100>,"reasoning":"<1-2 sentences>","met_include":[<criteria numbers>],"met_exclude":[<criteria numbers>]}`;

    const raw = await complete(prompt, 350);

    // Extract JSON even if model wraps in code block
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
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
