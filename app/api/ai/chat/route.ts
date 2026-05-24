import { NextRequest } from 'next/server';
import { streamChat, getProviderInfo, type ChatMessage } from '@/lib/ai/provider';

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const { name, model } = getProviderInfo();

    const systemPrompt = `You are Moku, an AI research copilot built for academic scientists. You are powered by ${name} (${model}).

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
    const isKeyMissing = message.includes('not configured');
    return new Response(
      JSON.stringify({
        error: isKeyMissing
          ? 'AI API key not configured. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to .env.local'
          : message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
