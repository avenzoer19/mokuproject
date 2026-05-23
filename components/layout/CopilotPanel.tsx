'use client';

import { useState } from 'react';
import { X, Send, Sparkles, MessageSquare, FileText, Clock } from 'lucide-react';
import { useCopilot } from '@/components/providers/AppProviders';

const tabs = [
  { id: 'chat',    icon: <MessageSquare size={14} />, label: 'Chat' },
  { id: 'context', icon: <FileText size={14} />,      label: 'Context' },
  { id: 'history', icon: <Clock size={14} />,          label: 'History' },
];

const suggestions = [
  'Summarize the selected paper',
  'Find contradictions across papers',
  'Generate hypotheses from data',
  'Write a methods section draft',
];

export default function CopilotPanel() {
  const { copilotOpen, setCopilotOpen } = useCopilot();
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi Aisha! I\'m your research copilot. I can help you analyze papers, generate hypotheses, critique your manuscript, or assist with experimental design. What are you working on?' },
  ]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text: input },
      { role: 'ai', text: 'I\'m analyzing your request across your library and current context…' },
    ]);
    setInput('');
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
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-3)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--line)',
        padding: '0 8px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--teal)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--teal)' : 'var(--text-3)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
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
        {activeTab === 'chat' && messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '10px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            {msg.role === 'ai' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--teal-soft)',
                border: '1px solid var(--ring)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={13} style={{ color: 'var(--teal)' }} />
              </div>
            )}
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? 'var(--teal)' : 'var(--surface-2)',
              color: msg.role === 'user' ? '#0F1117' : 'var(--text-2)',
              padding: '10px 13px',
              borderRadius: msg.role === 'user' ? '13px 13px 3px 13px' : '13px 13px 13px 3px',
              fontSize: '13.5px',
              lineHeight: 1.55,
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {activeTab === 'chat' && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '8px' }}>Suggestions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 12px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: '9px',
                    color: 'var(--text-2)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
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

        {activeTab === 'context' && (
          <div style={{ color: 'var(--text-3)', fontSize: '13.5px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>Active context</div>
            <div style={{ background: 'var(--surface-2)', borderRadius: '9px', padding: '12px' }}>
              <div style={{ marginBottom: '6px' }}>📄 Current page: Library</div>
              <div style={{ marginBottom: '6px' }}>📚 Selected papers: 0</div>
              <div>🔬 Active experiment: None</div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ color: 'var(--text-3)', fontSize: '13.5px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: '12px' }}>Recent sessions</div>
            {['Protein docking analysis', 'SDS-PAGE troubleshooting', 'Literature review synthesis'].map((s, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                background: 'var(--surface-2)',
                borderRadius: '9px',
                marginBottom: '6px',
                fontSize: '13px',
                cursor: 'pointer',
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
          padding: '12px 16px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your research…"
            rows={2}
            style={{
              flex: 1,
              background: 'var(--search-bg)',
              border: '1px solid var(--line)',
              borderRadius: '10px',
              padding: '10px 12px',
              color: 'var(--text)',
              fontSize: '13.5px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'var(--font-geist-sans)',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: input.trim() ? 'var(--teal)' : 'var(--surface-3)',
              border: 'none',
              color: input.trim() ? '#0F1117' : 'var(--text-4)',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
