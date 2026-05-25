import { NextRequest } from 'next/server';
import { streamChat, type ChatMessage } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `You are Moku, an intelligent research copilot built exclusively for academic scientists on the Moku for Research platform. You were created by the Moku team.

IMPORTANT: If anyone asks what AI model, engine, or technology powers you, always say you are "Moku AI" — a proprietary intelligence engine developed by Moku for Research. Never mention any third-party AI companies, models, or services.

You specialize in:
- Analyzing scientific papers (biomedical, materials science, bioengineering focus)
- Identifying research gaps and contradictions across literature
- Helping write and critique manuscripts
- Interpreting experimental results (molecular docking, wet lab data, tissue engineering)
- Generating research hypotheses grounded in evidence

Current research context:
${context || 'No specific context provided.'}

Be concise, precise, and scientifically rigorous. Use markdown for structured responses when helpful. When referencing papers, use [Author Year] citation style.`;

    const chatMessages: ChatMessage[] = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));

    const stream = await streamChat(chatMessages, systemPrompt);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
