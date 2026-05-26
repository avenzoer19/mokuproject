'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, FlaskConical, TestTube2, FileText, CheckCircle2, Clock, Zap } from 'lucide-react';
import { tokens } from '@/components/lib/design-tokens';
import { createClient } from '@/lib/supabase/client';

/* ── Dark palette constants ─────────────────────────────────── */
const D = {
  bg:      '#0F1117',
  surface: '#1A1D27',
  border:  '#2A2E3D',
  accent:  '#4ECDC4',
  text:    '#E8E8E8',
  muted:   '#8B8FA8',
};

/* ── Pillars data ───────────────────────────────────────────── */
const PILLARS = [
  {
    num: '01',
    title: 'Smart Library & Systematic Screening Studio',
    Icon: BookOpen,
    body: 'AI-assisted triage based on customizable inclusion/exclusion criteria, automated systematic flowchart generation, and In-App Document Translation that preserves complex scientific formatting.',
    tags: ['AI Paper Triage', 'PRISMA Flowchart', 'Document Translation', 'PDF Annotation'],
  },
  {
    num: '02',
    title: 'Computational Dry Lab Suite',
    Icon: FlaskConical,
    body: 'Molecular docking and simulation log parsing with an integrated AI biological relevance critic to prevent overclaims before physical testing.',
    tags: ['Molecular Docking', 'Simulation Parsing', 'Relevance Critic', 'Structure Analysis'],
  },
  {
    num: '03',
    title: 'Experimental Wet Lab OS',
    Icon: TestTube2,
    body: 'Adaptive protocol generator and Smart Experimental Logging paired with a Failure-to-Cause AI for troubleshooting physical execution parameters such as voltage and flow rate anomalies.',
    tags: ['Protocol Generator', 'Smart Logging', 'Failure-to-Cause AI', 'Anomaly Detection'],
  },
  {
    num: '04',
    title: 'Zen Studio (Writing & Publication)',
    Icon: FileText,
    body: 'Distraction-free manuscript editor with an inline data injector to paste your lab graphs, statistics, or references via keyboard shortcuts instantly.',
    tags: ['Manuscript Editor', 'Inline Data Inject', 'Keyboard Shortcuts', 'Journal Matchmaking'],
  },
];

/* ── Molecule canvas ─────────────────────────────────────────── */
function MoleculeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const NODE_COUNT = 60;
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: i % 5 === 0 ? 4.5 : 2.5,
      accent: i % 5 === 0,
    }));
    const LINK_DIST = 130;
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56,181,172,${(1 - dist / LINK_DIST) * 0.25})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent ? tokens.teal : 'rgba(78,205,196,0.25)';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
  );
}

/* ── SECTION 1 — Fragmentation problem ──────────────────────── */
function FragmentSection() {
  const items = [
    'Literature search in an isolated browser tab',
    'Reference manager as a separate desktop app',
    'Abstract screening in yet another spreadsheet',
    'Document translation pasted into a third-party site',
    'Lab parameters scribbled in a physical notebook',
    'Manuscript drafted in a disconnected text editor',
  ];
  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '160px 40px 140px' }}>
      <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.accent, marginBottom: '28px' }}>
        The problem
      </p>
      <h2 style={{ fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 200, letterSpacing: '-0.04em', lineHeight: 1.05, color: D.text, marginBottom: '64px', maxWidth: '820px' }}>
        Modern research is{' '}
        <span style={{ fontStyle: 'italic', color: D.accent }}>fragmented</span>{' '}
        by design.
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: D.border, borderRadius: '16px', overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: D.bg, padding: '28px 32px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: D.muted, marginTop: '3px', flexShrink: 0 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '14px', color: D.muted, lineHeight: 1.6 }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', color: D.text, lineHeight: 1.6, fontWeight: 300, letterSpacing: '-0.02em' }}>
            When your research data lives in a dozen disconnected places, you lose context — and context is where insight lives.
          </p>
        </div>
        <div style={{ borderLeft: `1px solid ${D.border}`, paddingLeft: '48px' }}>
          <p style={{ fontSize: '15px', color: D.muted, lineHeight: 1.8 }}>
            Moku collapses the entire research pipeline — from first literature search to final manuscript submission — into a single, coherent workspace. Every module speaks to every other.
          </p>
          <p style={{ fontSize: '13px', color: D.muted, lineHeight: 1.8, marginTop: '16px' }}>
            Your library papers surface in your screening queue. Your screening decisions inform your Dry Lab inputs. Your Wet Lab logs embed directly into Studio. One thread. Zero context-switching.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── SECTION 2 — 4 Pillars sticky scroll ─────────────────────── */
function PillarsSection({ sectionRef, activePillar }: { sectionRef: React.RefObject<HTMLDivElement>; activePillar: number }) {
  const active = PILLARS[activePillar];
  const ActiveIcon = active.Icon;

  return (
    <section style={{ position: 'relative', borderTop: `1px solid ${D.border}` }}>
      <div ref={sectionRef} style={{ height: '400vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

          {/* Left — kinetic indicator stack */}
          <div style={{ borderRight: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
            <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.accent, marginBottom: '48px' }}>
              The platform
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {PILLARS.map((p, i) => {
                const isActive = activePillar === i;
                return (
                  <div key={p.num} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 0', borderBottom: `1px solid ${D.border}`, opacity: isActive ? 1 : 0.18, transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)', cursor: 'default' }}>
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 'clamp(22px, 3vw, 40px)', fontWeight: 200, color: isActive ? D.accent : D.text, transition: 'color 0.5s', lineHeight: 1, minWidth: '56px' }}>
                      {p.num}
                    </span>
                    <span style={{ fontSize: 'clamp(13px, 1.4vw, 16px)', fontWeight: isActive ? 500 : 300, color: isActive ? D.text : D.muted, transition: 'color 0.5s', letterSpacing: '-0.01em' }}>
                      {p.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — morphing content card */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px' }}>
            <div key={activePillar} style={{ animation: 'pillarFadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both' }}>

              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', color: D.accent }}>
                <ActiveIcon size={20} />
              </div>

              <h3 style={{ fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: 300, letterSpacing: '-0.03em', color: D.text, lineHeight: 1.2, marginBottom: '20px' }}>
                {active.title}
              </h3>
              <p style={{ fontSize: '15px', color: D.muted, lineHeight: 1.8, marginBottom: '36px', maxWidth: '480px' }}>
                {active.body}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {active.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(78,205,196,0.07)', border: '1px solid rgba(78,205,196,0.18)', color: D.accent, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.04em' }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Progress indicator */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '48px' }}>
                {PILLARS.map((_, i) => (
                  <div key={i} style={{ height: '2px', borderRadius: '2px', flex: i === activePillar ? 3 : 1, background: i === activePillar ? D.accent : D.border, transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pillarFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .pillars-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ── SECTION 3 — Kenapa Moku Dibangun ───────────────────────── */
function PhilosophySection() {
  return (
    <section style={{ borderTop: `1px solid ${D.border}`, padding: '120px 40px 140px', maxWidth: '820px', margin: '0 auto' }}>
      <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.accent, marginBottom: '48px' }}>
        Kenapa Moku dibangun?
      </p>

      <blockquote style={{ borderLeft: `2px solid ${D.border}`, paddingLeft: '32px', margin: '0 0 48px' }}>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', color: D.text, lineHeight: 1.85, fontWeight: 300, marginBottom: '24px' }}>
          &ldquo;Moku tidak dimulai dari pendanaan jutaan dolar atau tim korporasi besar. Proyek ini lahir sederhana: dari rasa frustrasi saya sendiri sebagai mahasiswa Teknik Biomedis yang harus membuka puluhan tab setiap kali riset.
        </p>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', color: D.muted, lineHeight: 1.85, fontWeight: 300, marginBottom: '24px' }}>
          Sangat melelahkan ketika harus beralih dari satu aplikasi ke aplikasi lain hanya untuk membaca paper, melakukan penapisan (screening), menerjemahkan dokumen, mencatat parameter di meja lab, hingga mengetik draf di dokumen terpisah. Ketika data riset tercecer di banyak tempat, kita kehilangan banyak waktu dan pola penting. Moku ada karena saya butuh sebuah platform yang bisa menyatukan semua proses itu di satu tempat yang tenang.
        </p>
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', color: D.muted, lineHeight: 1.85, fontWeight: 300 }}>
          Ini adalah proyek idealis yang saya bangun apa adanya berdasarkan masalah riil yang kita semua hadapi di dunia akademik. Saya percaya alat penelitian yang bagus tidak harus rumit atau eksklusif. Melalui semangat <em style={{ color: D.accent, fontStyle: 'italic' }}>Science for Everyone</em>, Moku berkomitmen menyediakan ruang kerja yang bersih, agar kita—para mahasiswa dan peneliti muda—bisa fokus pada hal yang paling mendasar: berpikir ilmiah dan berinovasi.&rdquo;
        </p>
      </blockquote>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '32px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: D.accent }}>
          R
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: D.text, margin: 0 }}>Rifqi Aditya</p>
          <p style={{ fontSize: '12px', color: D.muted, margin: 0 }}>Creator of Moku · Biomedical Engineering</p>
        </div>
      </div>
    </section>
  );
}

/* ── SECTION 4 — Build in Public / Roadmap ──────────────────── */
function RoadmapSection({ ctaHref }: { ctaHref: string }) {
  const stages = [
    { icon: CheckCircle2, color: D.accent,  label: 'Visual shell & workflows',    status: 'Complete',    note: 'All 10 pages built and deployed' },
    { icon: CheckCircle2, color: D.accent,  label: 'Supabase backend + auth',     status: 'Complete',    note: 'Real-time DB, RLS, PDF storage' },
    { icon: CheckCircle2, color: D.accent,  label: 'Moku Intelligence Engine',    status: 'Complete',    note: 'AI triage, translation, gap analysis' },
    { icon: Zap,          color: '#E0A957', label: 'Collaboration & workspaces',  status: 'In progress', note: 'Multi-user, shared libraries' },
    { icon: Clock,        color: D.muted,   label: 'Mobile & offline support',    status: 'Planned',     note: 'PWA + local-first sync' },
    { icon: Clock,        color: D.muted,   label: 'Institutional integrations',  status: 'Planned',     note: 'DOI resolver, CrossRef, PubMed' },
  ];

  return (
    <section style={{ borderTop: `1px solid ${D.border}`, padding: '120px 40px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: D.accent, marginBottom: '28px' }}>
          Build in public
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start', marginBottom: '72px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 200, letterSpacing: '-0.04em', lineHeight: 1.1, color: D.text, marginBottom: '20px' }}>
              Transparent<br />
              <span style={{ fontStyle: 'italic', color: D.accent }}>by default.</span>
            </h2>
          </div>
          <div style={{ paddingTop: '8px' }}>
            <p style={{ fontSize: '15px', color: D.muted, lineHeight: 1.8, marginBottom: '16px' }}>
              The visual shell and core workflows are fully ready. We are actively wiring the backend architecture and AI pipelines in the open.
            </p>
            <p style={{ fontSize: '15px', color: D.muted, lineHeight: 1.8 }}>
              Explore the live beta workspace today. Every session helps shape what Moku becomes next.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: D.border, borderRadius: '16px', overflow: 'hidden', marginBottom: '80px' }}>
          {stages.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: D.bg, padding: '28px 28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Icon size={15} color={s.color} />
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: s.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {s.status}
                  </span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: D.text, marginBottom: '6px', lineHeight: 1.4 }}>{s.label}</p>
                <p style={{ fontSize: '12px', color: D.muted, lineHeight: 1.6 }}>{s.note}</p>
              </div>
            );
          })}
        </div>

        {/* CTA bar */}
        <div style={{ borderTop: `1px solid ${D.border}`, padding: '48px 0 80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <p style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: 300, color: D.text, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Ready to unify your research?
            </p>
            <p style={{ fontSize: '14px', color: D.muted }}>Free to use during beta. No credit card required.</p>
          </div>
          <Link href={ctaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: D.accent, color: '#0F1117', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = tokens.tealDeep; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 12px 30px rgba(78,205,196,0.3)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = D.accent; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
          >
            Open workspace <ArrowRight size={17} />
          </Link>
        </div>

        {/* Dark footer */}
        <div style={{ borderTop: `1px solid ${D.border}`, padding: '24px 0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: D.accent }}>
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
              <circle cx="20" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
              <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
              <line x1="4" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <line x1="20" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <line x1="4" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <line x1="20" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            </svg>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: D.muted }}>Moku</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '11px', color: D.muted, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.06em' }}>
            <span>Science for Everyone</span>
            <span>·</span>
            <span>v1.0 — 2025</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [ctaHref, setCtaHref] = useState('/auth');
  const [scrollY, setScrollY] = useState(0);
  const [activePillar, setActivePillar] = useState(0);
  const pillarSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCtaHref('/dashboard');
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      if (pillarSectionRef.current) {
        const rect = pillarSectionRef.current.getBoundingClientRect();
        const total = pillarSectionRef.current.offsetHeight - window.innerHeight;
        const progress = Math.max(0, Math.min(0.9999, -rect.top / total));
        setActivePillar(Math.min(3, Math.floor(progress * 4)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const navDark = scrollY > heroH * 0.75;
  const crosshairVisible = scrollY < 80;

  return (
    <div style={{ background: '#F8F6F1' }}>
      {/* Canvas — fixed, only visible behind hero */}
      <MoleculeCanvas />

      {/* Crosshairs — fade out on scroll */}
      {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
        <div key={pos} style={{ position: 'fixed', top: pos.includes('t') ? '24px' : 'auto', bottom: pos.includes('b') ? '24px' : 'auto', left: pos.includes('l') ? '24px' : 'auto', right: pos.includes('r') ? '24px' : 'auto', width: '24px', height: '24px', zIndex: 1, opacity: crosshairVisible ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(78,205,196,0.5)" strokeWidth="1.5">
            {pos.includes('l') && <line x1="0" y1="12" x2="12" y2="12" />}
            {pos.includes('r') && <line x1="12" y1="12" x2="24" y2="12" />}
            {pos.includes('t') && <line x1="12" y1="0" x2="12" y2="12" />}
            {pos.includes('b') && <line x1="12" y1="12" x2="12" y2="24" />}
          </svg>
        </div>
      ))}

      {/* Nav — transitions from cream to dark */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10, background: navDark ? 'rgba(15,17,23,0.88)' : 'transparent', backdropFilter: navDark ? 'blur(16px)' : 'none', borderBottom: navDark ? `1px solid ${D.border}` : 'none', transition: 'background 0.4s ease, border-color 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: tokens.teal }}>
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="20" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
            <line x1="4" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <line x1="20" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <line x1="4" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <line x1="20" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
          </svg>
          <span style={{ fontWeight: 500, fontSize: '14px', letterSpacing: '0.16em', textTransform: 'uppercase', color: navDark ? D.text : '#1A1A18', transition: 'color 0.4s' }}>
            Moku
          </span>
        </div>
        <Link href={ctaHref} style={{ fontSize: '13.5px', color: navDark ? D.muted : '#3A3A36', textDecoration: 'none', padding: '8px 20px', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '8px', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(78,205,196,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          Sign In
        </Link>
      </nav>

      {/* ── HERO (100vh) ─────────────────────────────────────── */}
      <section style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <h1 style={{ fontSize: 'clamp(56px, 11.2vw, 196px)', fontWeight: 200, letterSpacing: '-0.045em', lineHeight: 0.9, color: '#1A1A18', marginBottom: '32px', userSelect: 'none' }}>
            Moku <em style={{ fontStyle: 'italic', color: tokens.tealDeep }}>for</em> Research
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 20px)', color: '#6E6B63', fontWeight: 300, lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 40px' }}>
            Literature, experiments, computation, and writing — unified in one intelligent research workspace.
          </p>
          <Link href={ctaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: tokens.teal, color: '#0F1117', borderRadius: '50px', textDecoration: 'none', fontSize: '16px', fontWeight: 500, transition: 'all 0.2s', letterSpacing: '-0.01em' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = tokens.tealDeep; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 12px 30px rgba(78,205,196,0.35)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = tokens.teal; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
          >
            Open workspace <ArrowRight size={18} />
          </Link>
        </div>

        {/* Hero footer badges — inside hero, absolute bottom */}
        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Literature', 'Datasets', 'Analysis', 'Writing'].map(badge => (
              <span key={badge} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.2)', color: '#6E6B63', letterSpacing: '0.04em' }}>
                {badge}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#A8A49A', letterSpacing: '0.06em' }}>
            <span>1.2345° N, 36.8219° E</span>
            <span>·</span>
            <span>v1.0 — 2025</span>
            <span>·</span>
            <span>Moku for Research</span>
          </div>
        </div>

        {/* Scroll nudge */}
        <div style={{ position: 'absolute', bottom: '88px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: scrollY < 60 ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }}>
          <div style={{ width: '1px', height: '32px', background: 'linear-gradient(to bottom, transparent, rgba(78,205,196,0.5))', animation: 'scrollNudge 2s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ── DARK SECTIONS ────────────────────────────────────── */}
      <div style={{ background: D.bg, position: 'relative', zIndex: 3, borderTop: '1px solid #E2E0DB' }}>

        <FragmentSection />
        <PillarsSection sectionRef={pillarSectionRef} activePillar={activePillar} />
        <PhilosophySection />
        <RoadmapSection ctaHref={ctaHref} />
      </div>

      <style>{`
        @keyframes scrollNudge {
          0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
          50%       { opacity: 1;   transform: scaleY(1); }
        }
        @media (max-width: 768px) {
          .fragment-grid   { grid-template-columns: 1fr !important; }
          .fragment-prose  { grid-template-columns: 1fr !important; }
          .roadmap-grid    { grid-template-columns: 1fr 1fr !important; }
          .roadmap-cta     { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
