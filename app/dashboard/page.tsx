'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Library, FlaskConical, TestTube2, FileText,
  TrendingUp, Beaker, Quote, BookOpen,
  Network, ScanSearch, ArrowRight, Plus, X, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';

interface Stats {
  paper_count: number | null;
  annotation_count: number | null;
  manuscript_count: number | null;
  active_protocols: number | null;
  bookmarked_count: number | null;
  completed_screenings: number | null;
}

interface RecentItem {
  id: string;
  type: 'paper' | 'manuscript' | 'protocol' | 'screening';
  title: string;
  updated_at: string | null;
}

function StatCard({ icon, value, label, delta, loading }: {
  icon: React.ReactNode; value: string | number; label: string; delta?: string; loading?: boolean;
}) {
  if (loading) return <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: '16px', padding: '22px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--teal-soft)', display: 'grid', placeItems: 'center', color: 'var(--teal)' }}>
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

const modules = [
  { href: '/dashboard/library',          icon: <Library size={22} />,     title: 'Library',          description: 'Organize papers, extract AI insights, annotate PDFs',           color: 'var(--teal)'   },
  { href: '/dashboard/screening',        icon: <ScanSearch size={22} />,  title: 'Screening',        description: 'PRISMA-compliant systematic review with AI-assisted triage',     color: 'var(--violet)' },
  { href: '/dashboard/neural-synthesis', icon: <Network size={22} />,     title: 'Neural Synthesis', description: 'Visualize knowledge graph and detect research gaps with AI',      color: '#FFD700'       },
  { href: '/dashboard/dry-lab',          icon: <FlaskConical size={22} />, title: 'Dry Lab',          description: 'Molecular docking, structure visualization, AI evaluation',     color: 'var(--blue)'   },
  { href: '/dashboard/wet-lab',          icon: <TestTube2 size={22} />,   title: 'Wet Lab',          description: 'Protocol builder, smart log, failure analysis',                  color: 'var(--success)'},
  { href: '/dashboard/studio',           icon: <FileText size={22} />,    title: 'Studio',           description: 'Manuscript editor with AI reviewer and journal matching',        color: 'var(--warn)'   },
];

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function DashboardPage() {
  const { user, profile, loading: userLoading } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome banner for new users (flag set during signup)
  useEffect(() => {
    try {
      if (localStorage.getItem('moku_new_user') === 'true') {
        setShowWelcome(true);
        localStorage.removeItem('moku_new_user');
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const load = async () => {
      const [
        { data: statsRow },
        { data: papers },
        { data: manuscripts },
        { data: protocols },
      ] = await Promise.all([
        supabase.from('dashboard_stats').select('*').eq('user_id', user.id).single(),
        supabase.from('papers').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(3),
        supabase.from('manuscripts').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(2),
        supabase.from('protocols').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(2),
      ]);

      setStats(statsRow ?? { paper_count: 0, annotation_count: 0, manuscript_count: 0, active_protocols: 0, bookmarked_count: 0, completed_screenings: 0 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: RecentItem[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((papers ?? []) as any[]).map((p: any) => ({ id: p.id, type: 'paper' as const, title: p.title, updated_at: p.updated_at })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((manuscripts ?? []) as any[]).map((m: any) => ({ id: m.id, type: 'manuscript' as const, title: m.title, updated_at: m.updated_at })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((protocols ?? []) as any[]).map((p: any) => ({ id: p.id, type: 'protocol' as const, title: p.title, updated_at: p.updated_at })),
      ].sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()).slice(0, 6);

      setRecent(items);
      setStatsLoading(false);
    };

    load();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Researcher';

  const recentIcons: Record<string, React.ReactNode> = {
    paper: <BookOpen size={14} />, manuscript: <FileText size={14} />,
    protocol: <TestTube2 size={14} />, screening: <ScanSearch size={14} />,
  };
  const recentColors: Record<string, string> = {
    paper: 'var(--teal)', manuscript: 'var(--warn)',
    protocol: 'var(--success)', screening: 'var(--violet)',
  };
  const recentHref: Record<string, string> = {
    paper: '/dashboard/library', manuscript: '/dashboard/studio',
    protocol: '/dashboard/wet-lab', screening: '/dashboard/screening',
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Welcome banner — shown once for new users after email confirmation */}
      {showWelcome && (
        <div style={{ background: 'linear-gradient(135deg, rgba(78,205,196,0.12) 0%, rgba(78,205,196,0.05) 100%)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', animation: 'fade-in 0.4s ease' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(78,205,196,0.15)', flexShrink: 0, display: 'grid', placeItems: 'center', color: 'var(--teal)' }}>
            <Sparkles size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
              Welcome to Moku! Your account is active.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              Start by importing your first paper into the Library, or explore the workspace modules below.
            </p>
          </div>
          <button onClick={() => setShowWelcome(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '4px', borderRadius: '6px', flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 300, color: 'var(--text)', marginBottom: '4px' }}>
            {greeting}, {userLoading ? '…' : firstName}.
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/library" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', borderRadius: '10px',
          background: 'var(--teal)', color: '#0F1117',
          fontSize: '13px', fontWeight: 500, textDecoration: 'none',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Import Paper
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard loading={statsLoading} icon={<BookOpen size={16} />}   value={stats?.paper_count ?? 0}     label="Papers in library" />
        <StatCard loading={statsLoading} icon={<Beaker size={16} />}     value={stats?.active_protocols ?? 0} label="Active protocols" />
        <StatCard loading={statsLoading} icon={<Quote size={16} />}      value={stats?.annotation_count ?? 0} label="Annotations" />
        <StatCard loading={statsLoading} icon={<FileText size={16} />}   value={stats?.manuscript_count ?? 0} label="Manuscripts" />
      </div>

      {/* Modules + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

        {/* Module grid */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '14px', fontFamily: 'var(--font-geist-mono)' }}>
            Workspaces
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {modules.map(m => (
              <Link key={m.href} href={m.href} style={{
                display: 'block', padding: '18px 20px',
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: '14px', textDecoration: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = m.color; el.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--line)'; el.style.background = 'var(--surface)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: m.color }}>{m.icon}</span>
                  <ArrowRight size={14} style={{ color: 'var(--text-4)' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{m.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{m.description}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '14px', fontFamily: 'var(--font-geist-mono)' }}>
            Recent Activity
          </div>
          {statsLoading ? (
            [0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '8px', marginBottom: '8px' }} />)
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-4)', fontSize: '13px' }}>
              <BookOpen size={24} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
              No activity yet.<br />Start by importing a paper.
            </div>
          ) : recent.map(item => (
            <Link key={item.id} href={recentHref[item.type]} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '10px 0', borderBottom: '1px solid var(--line-soft)',
              textDecoration: 'none',
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${recentColors[item.type]}18`, display: 'grid', placeItems: 'center', flexShrink: 0, color: recentColors[item.type] }}>
                {recentIcons[item.type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px', fontFamily: 'var(--font-geist-mono)' }}>
                  {timeAgo(item.updated_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
