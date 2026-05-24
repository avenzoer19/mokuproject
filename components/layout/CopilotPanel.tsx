'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquare, FileText, Clock, Loader2 } from 'lucide-react';
import { useCopilot } from '@/components/providers/AppProviders';
import { usePathname } from 'next/navigation';

const tabs = [
  { id: 'chat',    icon: <MessageSquare size={14} />, label: 'Chat' },
  { id: 'context', icon: <FileText size={14} />,      label: 'Context' },
  { id: 'history', icon: <Clock size={14} />,          label: 'History' },
];

const suggestions = [
  'Summarize the selected paper',
  'Find contradictions across papers',
  'Generate hypotheses from my data',
  'Write a methods section draft',
];

interface Message {
  role: 'user' | 'ai';
  text: string;
  streaming?: boolean;
}

export default function CopilotPanel() {
  const { copilotOpen, setCopilotOpen } = useCopilot();
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<{ name: string; model: string } | null>(null);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/ai/provider').then(r => r.json()).then(setProvider).catch(() => null);
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! I'm your Moku research copilot. I can analyze papers, generate hypotheses, critique manuscripts, or help with experimental design. What are you working on?" },
  ]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getContext = () => {
    const page = pathname?.split('/').pop() || 'dashboard';
    return `Current page: ${page}. Research focus: PCL/PVP composite scaffolds for wound regeneration.`;
  };

  const send = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', text: userText };
    const aiMsg: Message = { role: 'ai', text: '', streaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);

    try {
      const history = messages
        .filter(m => !m.streaming)
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', text: userText }],
          context: getContext(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'ai',
            text: (err.error as string)?.toLowerCase().includes('configured')
              ? 'AI key not configured. Add GEMINI_API_KEY to .env.local (or ANTHROPIC_API_KEY if using Claude), then restart the dev server.'
              : `Error: ${err.error}`,
          };
          return updated;
        });
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'ai', text: fullText, streaming: true };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      // Mark streaming complete
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', text: fullText || '…' };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', text: 'Connection error. Check your network and try again.' };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`copilot-panel ${copilotOpen ? 'open' : ''}`}
      style={{
        position: 'fixed',
        right: 0,
        top: '56px',
        width: '380px',
        height: 'calc(100vh - 56px)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--line)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        transform: copilotOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.2,0.7,0.2,1)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>AI Copilot</span>
          {provider && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-geist-mono)',
              letterSpacing: '0.1em',
              color: 'var(--teal)',
              background: 'var(--teal-soft)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>{provider.name}</span>
          )}
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          style={{
            width: '28px', height: '28px', borderRadius: '7px',
            border: 'none', background: 'transparent',
            color: 'var(--text-3)', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 8px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              padding: '10px 0', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--teal)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--teal)' : 'var(--text-3)',
              fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'chat' && (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: '10px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {msg.role === 'ai' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'var(--teal-soft)', border: '1px solid var(--ring)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    {msg.streaming && !msg.text
                      ? <Loader2 size={12} style={{ color: 'var(--teal)', animation: 'spin 1s linear infinite' }} />
                      : <Sparkles size={13} style={{ color: 'var(--teal)' }} />
                    }
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  background: msg.role === 'user' ? 'var(--teal)' : 'var(--surface-2)',
                  color: msg.role === 'user' ? '#0F1117' : 'var(--text-2)',
                  padding: '10px 13px',
                  borderRadius: msg.role === 'user' ? '13px 13px 3px 13px' : '13px 13px 13px 3px',
                  fontSize: '13.5px', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text || (msg.streaming ? (
                    <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-3)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-3)', animation: 'pulse 1.2s ease-in-out 0.2s infinite' }} />
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-3)', animation: 'pulse 1.2s ease-in-out 0.4s infinite' }} />
                    </span>
                  ) : '')}
                  {msg.streaming && msg.text && (
                    <span style={{
                      display: 'inline-block', width: '2px', height: '13px',
                      background: 'var(--teal)', marginLeft: '2px', verticalAlign: 'text-bottom',
                      animation: 'blink 1s step-end infinite',
                    }} />
                  )}
                </div>
              </div>
            ))}

            {/* Suggestions (only when no user messages yet) */}
            {messages.length <= 1 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '8px' }}>Suggestions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      style={{
                        textAlign: 'left', padding: '9px 12px',
                        background: 'var(--surface-2)', border: '1px solid var(--line)',
                        borderRadius: '9px', color: 'var(--text-2)',
                        fontSize: '13px', cursor: 'pointer', transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}

        {activeTab === 'context' && (
          <div style={{ color: 'var(--text-3)', fontSize: '13.5px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>Active context</div>
            <div style={{ background: 'var(--surface-2)', borderRadius: '9px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>📄 Current page: <span style={{ color: 'var(--text)' }}>{pathname?.split('/').pop() || 'dashboard'}</span></div>
              <div>📚 Library papers: <span style={{ color: 'var(--text)' }}>7 papers (PCL/PVP scaffolds)</span></div>
              <div>🔬 Research focus: <span style={{ color: 'var(--text)' }}>Wound regeneration scaffolds</span></div>
              <div>🤖 Model: <span style={{ color: 'var(--teal)' }}>{provider ? `${provider.name} · ${provider.model}` : '—'}</span></div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-4)', lineHeight: 1.6 }}>
              Context is automatically sent with every message. Connect your library and experiments to give Claude more to work with.
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ color: 'var(--text-3)', fontSize: '13.5px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: '12px' }}>Recent sessions</div>
            {['Protein docking analysis', 'SDS-PAGE troubleshooting', 'Literature review synthesis'].map((s, i) => (
              <div key={i} style={{
                padding: '10px 12px', background: 'var(--surface-2)',
                borderRadius: '9px', marginBottom: '6px',
                fontSize: '13px', cursor: 'pointer',
              }}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      {activeTab === 'chat' && (
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--line)',
          display: 'flex', gap: '8px', alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your research…"
            rows={2}
            disabled={loading}
            style={{
              flex: 1, background: 'var(--search-bg)',
              border: '1px solid var(--line)', borderRadius: '10px',
              padding: '10px 12px', color: 'var(--text)',
              fontSize: '13.5px', resize: 'none', outline: 'none',
              fontFamily: 'var(--font-geist-sans)', lineHeight: 1.5,
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: input.trim() && !loading ? 'var(--teal)' : 'var(--surface-3)',
              border: 'none',
              color: input.trim() && !loading ? '#0F1117' : 'var(--text-4)',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'grid', placeItems: 'center', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {loading
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={15} />
            }
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
