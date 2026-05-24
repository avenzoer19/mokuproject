'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Library, TestTube2, FlaskConical,
  FileText, Settings, ChevronLeft, ChevronRight,
  Users, FolderOpen, Network,
} from 'lucide-react';
import { useSidebar } from '@/components/providers/AppProviders';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const mainNav: NavItem[] = [
  { href: '/dashboard',                   icon: <LayoutDashboard size={17} />, label: 'Dashboard'        },
  { href: '/dashboard/library',           icon: <Library size={17} />,         label: 'Library'           },
  { href: '/dashboard/neural-synthesis',  icon: <Network size={17} />,         label: 'Neural Synthesis'  },
];

const researchNav: NavItem[] = [
  { href: '/dashboard/dry-lab', icon: <FlaskConical size={17} />,   label: 'Dry Lab' },
  { href: '/dashboard/wet-lab', icon: <TestTube2 size={17} />,      label: 'Wet Lab' },
  { href: '/dashboard/studio',  icon: <FileText size={17} />,       label: 'Studio' },
];

function MokuLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="4"  cy="6"  r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="20" cy="6"  r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="4"  cy="18" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
      <line x1="4"  y1="6"  x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="20" y1="6"  x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="4"  y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="20" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function NavLink({ item, expanded, active }: { item: NavItem; expanded: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '44px',
        padding: '0 0 0 8px',
        marginLeft: active ? '0' : '0',
        borderRadius: '10px',
        color: active ? 'var(--teal)' : 'var(--text-3)',
        background: active ? 'var(--sidebar-active)' : 'transparent',
        borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
        boxShadow: active ? '2px 0 12px rgba(78,205,196,0.08)' : 'none',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        paddingRight: expanded ? '12px' : '0',
        justifyContent: expanded ? 'flex-start' : 'center',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--line-soft)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <span style={{ flexShrink: 0, paddingLeft: active ? '8px' : '11px' }}>{item.icon}</span>
      {expanded && (
        <span style={{ fontSize: '13.5px', fontWeight: active ? 500 : 300 }}>
          {item.label}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebar, toggleSidebar } = useSidebar();
  const expanded = sidebar === 'expanded';

  return (
    <aside
      style={{
        gridRow: '1 / -1',
        gridColumn: '1',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--line)',
        display: 'grid',
        gridTemplateRows: '56px 1fr auto',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 5,
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* Brand */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr',
        alignItems: 'center',
        height: '56px',
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        <div style={{ justifySelf: 'center', color: 'var(--teal)' }}>
          <MokuLogo />
        </div>
        <span className="sb-wordmark" style={{
          fontFamily: 'var(--font-geist-sans)',
          fontWeight: 500,
          fontSize: '14px',
          letterSpacing: '0.18em',
          color: 'var(--text)',
          textTransform: 'uppercase',
        }}>
          Moku
        </span>
      </div>

      {/* Nav */}
      <nav style={{ overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
        {/* Main */}
        {expanded && (
          <div style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            padding: '14px 12px 6px',
          }}>
            Main
          </div>
        )}
        {mainNav.map(item => (
          <NavLink
            key={item.href}
            item={item}
            expanded={expanded}
            active={pathname === item.href}
          />
        ))}

        <div style={{ height: '16px' }} />

        {/* Research */}
        {expanded && (
          <div style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            padding: '4px 12px 6px',
          }}>
            Research
          </div>
        )}
        {researchNav.map(item => (
          <NavLink
            key={item.href}
            item={item}
            expanded={expanded}
            active={pathname === item.href}
          />
        ))}

        <div style={{ height: '16px' }} />

        {/* Spaces */}
        {expanded && (
          <div style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-4)',
            padding: '4px 12px 6px',
          }}>
            Spaces
          </div>
        )}
        {[
          { href: '/dashboard', icon: <FolderOpen size={17} />, label: 'Nanomaterials Lab' },
          { href: '/dashboard', icon: <Users size={17} />,      label: 'Collaborators' },
        ].map((item, i) => (
          <NavLink key={i} item={item} expanded={expanded} active={false} />
        ))}
      </nav>

      {/* Bottom */}
      <div style={{
        borderTop: '1px solid var(--line)',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <NavLink item={{ href: '/dashboard', icon: <Settings size={17} />, label: 'Settings' }} expanded={expanded} active={false} />

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: '10px',
            minHeight: '44px',
            padding: expanded ? '0 12px 0 19px' : '0',
            borderRadius: '10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-4)',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--line-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          {expanded && <span style={{ fontSize: '13px' }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
