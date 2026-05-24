/**
 * Moku AI Provider abstraction
 * Supports both Google Gemini and Anthropic Claude.
 * Set AI_PROVIDER=gemini (default) or AI_PROVIDER=claude in .env.local
 * Set the matching key: GEMINI_API_KEY or ANTHROPIC_API_KEY
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'gemini' | 'claude';

function getProvider(): AIProvider {
  const p = process.env.AI_PROVIDER?.toLowerCase();
  if (p === 'claude') return 'claude';
  return 'gemini'; // default
}

// ── Non-streaming completion ──────────────────────────────────────────────────

export async function complete(prompt: string, maxTokens = 800): Promise<string> {
  const provider = getProvider();

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    });
    return result.response.text();
  }

  // Claude
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
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
  const provider = getProvider();
  const encoder = new TextEncoder();

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
    const lastUserMsg = messages[messages.length - 1].text;

    const chat = model.startChat({
      history,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
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

  // Claude streaming
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const client = new Anthropic({ apiKey });

  const anthropicMessages = messages.map(m => ({
    role: m.role,
    content: m.text,
  }));

  const stream = await client.messages.stream({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
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

// ── Provider info (for UI badges) ─────────────────────────────────────────────

export function getProviderInfo(): { name: string; model: string } {
  const p = getProvider();
  if (p === 'gemini') return { name: 'Gemini', model: 'gemini-2.0-flash' };
  return { name: 'Claude', model: 'claude-opus-4-5' };
}
