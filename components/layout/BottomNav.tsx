'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Library, FlaskConical, TestTube2, FileText } from 'lucide-react';

const items = [
  { href: '/dashboard',         icon: <LayoutDashboard size={22} />, label: 'Home' },
  { href: '/dashboard/library', icon: <Library size={22} />,         label: 'Library' },
  { href: '/dashboard/dry-lab', icon: <FlaskConical size={22} />,    label: 'Dry Lab' },
  { href: '/dashboard/wet-lab', icon: <TestTube2 size={22} />,       label: 'Wet Lab' },
  { href: '/dashboard/studio',  icon: <FileText size={22} />,        label: 'Studio' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden flex items-center"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        zIndex: 10,
      }}
    >
      {items.map(item => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              height: '100%',
              color: active ? 'var(--teal)' : 'var(--text-4)',
              textDecoration: 'none',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '2px',
                background: 'var(--teal)',
                borderRadius: '0 0 4px 4px',
              }} />
            )}
            {item.icon}
            <span style={{ fontSize: '10px', fontWeight: active ? 500 : 300 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
