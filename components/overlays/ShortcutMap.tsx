'use client';

import { X } from 'lucide-react';
import { useOverlay } from '@/components/providers/AppProviders';

interface ShortcutEntry {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  entries: ShortcutEntry[];
}

const groups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    entries: [
      { keys: ['G', 'H'], label: 'Home / Dashboard' },
      { keys: ['G', 'L'], label: 'Library' },
      { keys: ['G', 'W'], label: 'Wet Lab' },
      { keys: ['G', 'D'], label: 'Dry Lab' },
      { keys: ['G', 'S'], label: 'Studio' },
      { keys: ['⌘', '['], label: 'Back' },
      { keys: ['⌘', ']'], label: 'Forward' },
      { keys: ['['],       label: 'Toggle sidebar' },
    ],
  },
  {
    title: 'Actions',
    entries: [
      { keys: ['⌘', 'N'],       label: 'New protocol / document' },
      { keys: ['⌘', 'S'],       label: 'Save' },
      { keys: ['⌘', 'E'],       label: 'Export bibliography' },
      { keys: ['⌘', 'K'],       label: 'Search / Command palette' },
      { keys: ['⌘', '⇧', 'L'], label: 'New wet lab log' },
      { keys: ['⌘', '⇧', 'C'], label: 'AI critic on context' },
      { keys: ['⌘', 'Z'],       label: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], label: 'Redo' },
      { keys: ['⌘', '/'],       label: 'Toggle comment' },
    ],
  },
  {
    title: 'AI',
    entries: [
      { keys: ['⌘', 'J'],       label: 'Toggle AI Copilot' },
      { keys: ['⌘', '⇧', 'A'], label: 'Ask AI' },
      { keys: ['⌘', '⇧', 'E'], label: 'Extract from paper' },
      { keys: ['⌘', '⇧', 'R'], label: 'Reviewer simulation' },
      { keys: ['⌘', '⇧', 'M'], label: 'Methodology analysis' },
      { keys: ['⌘', '⇧', 'S'], label: 'Statistical summary' },
      { keys: ['⌘', '⇧', 'X'], label: 'Cross-reference check' },
    ],
  },
  {
    title: 'System',
    entries: [
      { keys: ['⌘', '⇧', 'D'], label: 'Toggle dark / light mode' },
      { keys: ['⌘', ','],       label: 'Settings' },
      { keys: ['?'],             label: 'This shortcut map' },
      { keys: ['Esc'],           label: 'Close overlay' },
      { keys: ['⌘', 'P'],       label: 'Print / Export PDF' },
      { keys: ['⌘', '⇧', 'P'], label: 'Preview' },
      { keys: ['F11'],           label: 'Fullscreen' },
    ],
  },
];

export default function ShortcutMap() {
  const { shortcutMapOpen, closeShortcutMap } = useOverlay();

  if (!shortcutMapOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        overflowY: 'auto',
        animation: 'fade-in 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 1,
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
            Keyboard Shortcuts
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Press <kbd style={{ background: 'var(--kbd-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>?</kbd> anytime to view this map
          </div>
        </div>
        <button
          onClick={closeShortcutMap}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text-3)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Groups grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        padding: '32px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        {groups.map(group => (
          <div
            key={group.title}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--line)',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--teal)',
            }}>
              {group.title}
            </div>
            <div style={{ padding: '8px' }}>
              {group.entries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-2)', flex: 1 }}>
                    {entry.label}
                  </span>
                  <span style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                    {entry.keys.map((k, ki) => (
                      <kbd key={ki} style={{
                        fontSize: '11px',
                        background: 'var(--kbd-bg)',
                        color: 'var(--text-2)',
                        padding: '3px 7px',
                        borderRadius: '5px',
                        fontFamily: 'var(--font-geist-mono)',
                        border: '1px solid var(--line)',
                        minWidth: '24px',
                        textAlign: 'center',
                      }}>{k}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '24px',
        color: 'var(--text-4)',
        fontSize: '12px',
      }}>
        Press <kbd style={{ background: 'var(--kbd-bg)', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd> to close
      </div>
    </div>
  );
}
