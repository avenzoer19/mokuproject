'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, Bell, Sparkles, Plus, ChevronRight,
  User, Settings, LogOut, Sun, Moon,
} from 'lucide-react';
import { useOverlay, useCopilot, useTheme, useSignOut } from '@/components/providers/AppProviders';
import { useUser } from '@/lib/hooks/useUser';

const breadcrumbs: Record<string, string[]> = {
  '/dashboard':         ['Dashboard'],
  '/dashboard/library': ['Dashboard', 'Library'],
  '/dashboard/dry-lab': ['Dashboard', 'Dry Lab'],
  '/dashboard/wet-lab': ['Dashboard', 'Wet Lab'],
  '/dashboard/studio':  ['Dashboard', 'Studio'],
};

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { openCmdPalette } = useOverlay();
  const { toggleCopilot, copilotOpen } = useCopilot();
  const { theme, toggleTheme } = useTheme();
  const { openSignOutModal } = useSignOut();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useUser();
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Researcher';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const crumbs = breadcrumbs[pathname] ?? ['Dashboard'];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header style={{
      gridColumn: '2',
      gridRow: '1',
      display: 'grid',
      gridTemplateColumns: 'minmax(180px,1fr) minmax(260px,520px) minmax(180px,1fr)',
      alignItems: 'center',
      height: '56px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--bg-2)',
      padding: '0 20px',
      gap: '16px',
      position: 'relative',
      zIndex: 4,
    }}>
      {/* Left — Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <ChevronRight size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />}
            <span style={{
              fontSize: '13.5px',
              color: i === crumbs.length - 1 ? 'var(--text)' : 'var(--text-3)',
              fontWeight: i === crumbs.length - 1 ? 500 : 300,
              whiteSpace: 'nowrap',
            }}>
              {c}
            </span>
          </span>
        ))}
      </div>

      {/* Center — Search */}
      <button
        onClick={openCmdPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: '36px',
          background: 'var(--search-bg)',
          border: '1px solid var(--line)',
          borderRadius: '9px',
          padding: '0 12px',
          cursor: 'pointer',
          color: 'var(--text-3)',
          width: '100%',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-4)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
      >
        <Search size={14} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: '13.5px', fontWeight: 300 }}>
          Search papers, protocols, notes…
        </span>
        <span style={{
          fontSize: '11px',
          background: 'var(--kbd-bg)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'var(--font-geist-mono)',
          flexShrink: 0,
        }}>⌘K</span>
      </button>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
        {/* New button */}
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '32px',
          padding: '0 12px',
          background: 'var(--teal)',
          color: '#0F1117',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          <Plus size={14} />
          <span>New</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--text-3)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid var(--line)',
          background: 'transparent',
          color: 'var(--text-3)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}>
          <Bell size={15} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--teal)',
          }} />
        </button>

        {/* AI Copilot toggle */}
        <button
          onClick={toggleCopilot}
          title="AI Copilot (⌘J)"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: copilotOpen ? '1px solid var(--teal)' : '1px solid var(--line)',
            background: copilotOpen ? 'var(--teal-soft)' : 'transparent',
            color: copilotOpen ? 'var(--teal)' : 'var(--text-3)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Sparkles size={15} />
        </button>

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-deep) 100%)',
              border: '2px solid var(--line)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: '13px',
              fontWeight: 500,
              color: '#0F1117',
            }}
          >
            {initials || 'R'}
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '200px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
              zIndex: 50,
              animation: 'fade-in 0.1s ease',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' }}>{displayName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{user?.email ?? ''}</div>
              </div>
              {[
                { icon: <User size={14} />,    label: 'View Profile', action: () => setDropdownOpen(false) },
                { icon: <Settings size={14} />, label: 'Settings',     action: () => setDropdownOpen(false) },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-2)',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ color: 'var(--text-3)' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--line)', padding: '4px 0' }}>
                <button
                  onClick={() => { setDropdownOpen(false); openSignOutModal(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--red)',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,86,75,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
