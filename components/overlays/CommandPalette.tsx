'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Library, TestTube2, FlaskConical, FileText, Brain, BookOpen, Sun, Keyboard } from 'lucide-react';
import { useOverlay, useTheme } from '@/components/providers/AppProviders';

interface Command {
  id: string;
  title: string;
  icon: React.ReactNode;
  keys: string[];
  action?: () => void;
  section?: 'recent' | 'suggested';
}

export default function CommandPalette() {
  const router = useRouter();
  const { cmdPaletteOpen, closeCmdPalette, openShortcutMap } = useOverlay();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'nav-library',  title: 'Navigate → Library',          icon: <Library size={15} />,    keys: ['G', 'L'],        action: () => { router.push('/dashboard/library');  closeCmdPalette(); } },
    { id: 'nav-wetlab',   title: 'Navigate → Wet Lab',          icon: <TestTube2 size={15} />,  keys: ['G', 'W'],        action: () => { router.push('/dashboard/wet-lab');  closeCmdPalette(); } },
    { id: 'nav-drylab',   title: 'Navigate → Dry Lab',          icon: <FlaskConical size={15} />, keys: ['G', 'D'],      action: () => { router.push('/dashboard/dry-lab');  closeCmdPalette(); } },
    { id: 'nav-studio',   title: 'Navigate → Studio',           icon: <FileText size={15} />,   keys: ['G', 'S'],        action: () => { router.push('/dashboard/studio');   closeCmdPalette(); } },
    { id: 'new-protocol', title: 'New Experimental Protocol',   icon: <FlaskConical size={15} />, keys: ['⌘', 'N'],     action: () => closeCmdPalette() },
    { id: 'new-log',      title: 'New Wet Lab Log',             icon: <TestTube2 size={15} />,  keys: ['⌘', '⇧', 'L'],  action: () => closeCmdPalette() },
    { id: 'ai-critic',    title: 'AI Critic on current context', icon: <Brain size={15} />,     keys: ['⌘', '⇧', 'C'],  action: () => closeCmdPalette() },
    { id: 'export-bib',   title: 'Export Bibliography',         icon: <BookOpen size={15} />,   keys: ['⌘', 'E'],        action: () => closeCmdPalette() },
    { id: 'toggle-theme', title: 'Toggle Dark / Light Mode',    icon: <Sun size={15} />,        keys: ['⌘', '⇧', 'D'],  action: () => { toggleTheme(); closeCmdPalette(); } },
    { id: 'show-keys',    title: 'View Keyboard Shortcuts',     icon: <Keyboard size={15} />,   keys: ['?'],             action: () => { closeCmdPalette(); openShortcutMap(); } },
  ];

  const filtered = query
    ? commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    if (cmdPaletteOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [cmdPaletteOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!cmdPaletteOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); filtered[activeIdx]?.action?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [cmdPaletteOpen, filtered, activeIdx]);

  if (!cmdPaletteOpen) return null;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={closeCmdPalette}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 150,
        }}
      />

      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(640px, 92vw)',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow)',
          zIndex: 151,
          overflow: 'hidden',
          animation: 'fade-in 0.15s ease',
        }}
      >
        {/* Search row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr auto',
          alignItems: 'center',
          borderBottom: '1px solid var(--line)',
          padding: '0 16px 0 0',
        }}>
          <div style={{ display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
            <Search size={17} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Search commands…"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '15px',
              fontFamily: 'var(--font-geist-sans)',
              fontWeight: 300,
              padding: '16px 0',
            }}
          />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-4)',
            background: 'var(--kbd-bg)',
            padding: '3px 7px',
            borderRadius: '5px',
            fontFamily: 'var(--font-geist-mono)',
          }}>Esc</span>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '14px' }}>
              No commands found
            </div>
          )}
          {filtered.map((cmd, idx) => (
            <div
              key={cmd.id}
              onClick={cmd.action}
              onMouseEnter={() => setActiveIdx(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                background: idx === activeIdx ? 'var(--sidebar-active)' : 'transparent',
                color: idx === activeIdx ? 'var(--teal)' : 'var(--text-2)',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ color: idx === activeIdx ? 'var(--teal)' : 'var(--text-3)', flexShrink: 0 }}>
                {cmd.icon}
              </span>
              <span style={{ flex: 1, fontSize: '14px' }}>{cmd.title}</span>
              <span style={{ display: 'flex', gap: '4px' }}>
                {cmd.keys.map((k, ki) => (
                  <kbd key={ki} style={{
                    fontSize: '11px',
                    background: 'var(--kbd-bg)',
                    color: 'var(--text-3)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-geist-mono)',
                  }}>{k}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '10px 16px',
          display: 'flex',
          gap: '16px',
          color: 'var(--text-4)',
          fontSize: '12px',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </>
  );
}
