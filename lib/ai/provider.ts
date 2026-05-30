/**
 * Moku Intelligence Engine — internal AI inference layer.
 * Implementation details are intentionally abstracted.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

type InferenceBackend = 'gemini' | 'claude';

function getBackend(): InferenceBackend {
  const p = process.env.AI_PROVIDER?.toLowerCase();
  if (p === 'claude') return 'claude';
  return 'gemini';
}

// ── Non-streaming completion (for structured JSON responses) ──────────────────

export async function complete(prompt: string, maxTokens = 1024): Promise<string> {
  const provider = getBackend();

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Moku Intelligence Engine not configured. Contact your workspace admin.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model: GenerativeModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1,
        // Disable thinking for structured JSON — faster, no budget bleed
        thinkingConfig: { thinkingBudget: 0 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    } as Parameters<typeof model.generateContent>[0]);
    return result.response.text();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Moku Intelligence Engine not configured. Contact your workspace admin.');
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return (msg.content[0] as { type: string; text: string }).text;
}

// ── Streaming for Copilot chat ────────────────────────────────────────────────

export interface ChatMessage { role: 'user' | 'assistant'; text: string; }

/**
 * Returns a ReadableStream of SSE events: `data: {"text":"..."}` lines, ending with `data: [DONE]`
 */
export async function streamChat(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const provider = getBackend();
  const encoder = new TextEncoder();

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Moku Intelligence Engine not configured. Contact your workspace admin.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }],
    }));
    // Gemini requires history to start with 'user' — drop any leading model turns (e.g. greeting messages)
    while (history.length > 0 && history[0].role === 'model') history.shift();
    const lastUserMsg = messages[messages.length - 1].text;

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    const streamResult = await chat.sendMessageStream(lastUserMsg);

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Moku Intelligence Engine not configured. Contact your workspace admin.');
  const client = new Anthropic({ apiKey });

  const anthropicMessages = messages.map(m => ({
    role: m.role,
    content: m.text,
  }));

  const stream = await client.messages.stream({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ── Branding info (shown in UI — never expose underlying provider) ─────────────

export function getProviderInfo(): { name: string; model: string } {
  return { name: 'Moku AI', model: 'Intelligence Engine v1' };
}
