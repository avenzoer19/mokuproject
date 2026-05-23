'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Library, FlaskConical, TestTube2, FileText,
  TrendingUp, Beaker, Quote, Users,
  BookOpen, Microscope, Dna, ArrowRight,
} from 'lucide-react';

function StatCard({ icon, value, label, delta }: {
  icon: React.ReactNode; value: string; label: string; delta?: string;
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: '16px',
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'var(--teal-soft)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--teal)',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 200, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>{label}</div>
      </div>
      {delta && (
        <div style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <TrendingUp size={12} /> {delta}
        </div>
      )}
    </div>
  );
}

const activity = [
  { icon: <BookOpen size={14} />, text: 'Added "CRISPR-Cas9 off-target effects in primary cells" to Library', time: '2h ago', color: 'var(--teal)' },
  { icon: <Microscope size={14} />, text: 'Wet lab experiment "Western Blot #12" marked complete', time: '4h ago', color: 'var(--success)' },
  { icon: <FlaskConical size={14} />, text: 'Dry Lab: New docking run finished — ligand 4NQ-B, ΔG = −9.42', time: '6h ago', color: 'var(--violet)' },
  { icon: <FileText size={14} />, text: 'Studio: Saved draft "Nanomaterial cytotoxicity manuscript"', time: '1d ago', color: 'var(--warn)' },
  { icon: <Dna size={14} />, text: 'AI Copilot extracted 3 hypotheses from Liu et al. 2024', time: '1d ago', color: 'var(--teal)' },
  { icon: <Users size={14} />, text: 'Dr. Kamau Mwangi reviewed Studio draft — 4 comments', time: '2d ago', color: 'var(--rose)' },
];

const modules = [
  {
    href: '/dashboard/library',
    icon: <Library size={22} />,
    title: 'Library',
    description: 'Organize papers, extract AI insights, annotate PDFs',
    count: '142 papers',
  },
  {
    href: '/dashboard/dry-lab',
    icon: <FlaskConical size={22} />,
    title: 'Dry Lab',
    description: 'Molecular docking, structure visualization, AI evaluation',
    count: '8 runs',
  },
  {
    href: '/dashboard/wet-lab',
    icon: <TestTube2 size={22} />,
    title: 'Wet Lab',
    description: 'Protocol builder, smart log, failure analysis',
    count: '23 experiments',
  },
  {
    href: '/dashboard/studio',
    icon: <FileText size={22} />,
    title: 'Studio',
    description: 'Manuscript editor with AI reviewer and journal matching',
    count: '3 drafts',
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 300, color: 'var(--text)', marginBottom: '4px' }}>
          {greeting}, Aisha.
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        {loading ? (
          [0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
          ))
        ) : (
          <>
            <StatCard icon={<BookOpen size={16} />}   value="7"   label="Papers this week" delta="+3 vs last week" />
            <StatCard icon={<Beaker size={16} />}     value="3"   label="Experiments running" />
            <StatCard icon={<Quote size={16} />}      value="1.2k" label="Citations collected" delta="+84 this month" />
            <StatCard icon={<Users size={16} />}      value="5"   label="Active co-authors" />
          </>
        )}
      </div>

      {/* Modules + Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Module tiles */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Workspaces
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {modules.map(mod => (
              <Link
                key={mod.href}
                href={mod.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  padding: '22px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--teal)';
                  el.style.boxShadow = '0 0 0 1px var(--ring)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--line)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--teal-soft)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--teal)',
                }}>
                  {mod.icon}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '5px' }}>
                    {mod.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: '10px' }}>
                    {mod.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{mod.count}</span>
                    <ArrowRight size={14} style={{ color: 'var(--teal)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Recent Activity
          </div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {activity.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '14px 16px',
                  borderBottom: i < activity.length - 1 ? '1px solid var(--line-soft)' : 'none',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--surface-2)',
                  display: 'grid',
                  placeItems: 'center',
                  color: item.color,
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.45, marginBottom: '3px' }}>
                    {item.text}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
