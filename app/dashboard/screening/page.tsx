'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useScreening } from '@/lib/hooks/useScreening';
import { usePapers } from '@/lib/hooks/usePapers';
import {
  Plus, X, Play, Pause, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, MinusCircle, ArrowLeft,
  ArrowRight, ArrowDown, Sparkles, RotateCcw,
  Users, BarChart3, AlertTriangle, FileText,
  CheckCheck, MessageSquare,
} from 'lucide-react';

// ─────────────────────── Types ───────────────────────

interface ScreeningPaper {
  id: string; title: string; authors: string;
  year: number; journal: string; abstract: string;
}

type Decision  = 'include' | 'exclude' | 'undecided';
type ViewState = 'setup' | 'screening' | 'results';
type ActiveTab = 'screening' | 'conflicts' | 'results';

// ─────────────────────── Helpers ───────────────────────

function confidenceColor(v: number): string {
  if (v >= 70) return '#6FBF8A';
  if (v >= 40) return '#E0A957';
  return '#E5564B';
}

function confidenceBg(v: number): string {
  if (v >= 70) return 'rgba(111,191,138,0.12)';
  if (v >= 40) return 'rgba(224,169,87,0.12)';
  return 'rgba(229,86,75,0.12)';
}

function DecisionPill({ d }: { d: Decision }) {
  const map = {
    include:   { label: 'Include',   color: '#6FBF8A', bg: 'rgba(111,191,138,0.12)', icon: <CheckCircle2 size={11} /> },
    exclude:   { label: 'Exclude',   color: '#E5564B', bg: 'rgba(229,86,75,0.12)',  icon: <XCircle size={11} /> },
    undecided: { label: 'Undecided', color: '#8B8FA8', bg: 'rgba(139,143,168,0.12)',icon: <MinusCircle size={11} /> },
  }[d];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: map.bg, border: `1px solid ${map.color}44`, color: map.color, fontSize: '10.5px', fontWeight: 500 }}>
      {map.icon} {map.label}
    </span>
  );
}

// ─────────────────────── Page ───────────────────────

export default function ScreeningPage() {
  // ── DB hooks ──
  const { sessions, createSession, saveDecision, loading: sessionsLoading } = useScreening();
  const { papers: libraryPapers, loading: papersLoading } = usePapers();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Map library papers to screening format
  const PAPERS: ScreeningPaper[] = libraryPapers.map(p => ({
    id: p.id,
    title: p.title,
    authors: p.authors ?? '',
    year: p.year ?? new Date().getFullYear(),
    journal: p.journal ?? '',
    abstract: p.abstract ?? '',
  }));

  // ── View state ──
  const [viewState,   setViewState]   = useState<ViewState>('setup');
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('screening');

  // ── Criteria ──
  const [inclusionTags,  setInclusionTags]  = useState(['In vivo study', 'Published 2015–2025']);
  const [exclusionTags,  setExclusionTags]  = useState(['Review paper', 'Year < 2015']);
  const [incInput,  setIncInput]  = useState('');
  const [excInput,  setExcInput]  = useState('');

  // ── Screening ──
  const [cardIdx,             setCardIdx]             = useState(0);
  const [decisions,           setDecisions]           = useState<Record<string, Decision>>({});
  const [reasoningExpanded,   setReasoningExpanded]   = useState(false);

  // ── Swipe animation ──
  const cardRef      = useRef<HTMLDivElement>(null);
  const swipeStart   = useRef({ x: 0, y: 0 });
  const isSwiping    = useRef(false);
  const [offset,     setOffset]     = useState({ x: 0, y: 0 });
  const [swipeHint,  setSwipeHint]  = useState<Decision | null>(null);
  const [exiting,    setExiting]    = useState<{ dir: 'left'|'right'|'down'; d: Decision } | null>(null);

  // ── Conflicts ──
  const [expandedConflict,  setExpandedConflict]  = useState<string | null>(null);
  const [resolveModal,      setResolveModal]      = useState<{ id: string; title: string } | null>(null);
  const [resolvePick,       setResolvePick]       = useState<Decision>('include');
  const [resolved,          setResolved]          = useState<Set<string>>(new Set());

  // ── Premium / Exclude ──
  const [showPrismaModal,    setShowPrismaModal]    = useState(false);
  const [excludeDropOpen,    setExcludeDropOpen]    = useState(false);

  // ── AI triage results (real API) ──
  interface AiResult { confidence: number; decision: Decision; reasoning: string; }
  const [aiResults,    setAiResults]    = useState<Record<string, AiResult>>({});
  const [aiLoading,    setAiLoading]    = useState<Record<string, boolean>>({});

  // Fetch AI triage for all papers when screening starts
  useEffect(() => {
    if (viewState !== 'screening') return;
    const unscored = PAPERS.filter(p => !aiResults[p.id]);
    if (unscored.length === 0) return;

    unscored.forEach(async (paper) => {
      setAiLoading(prev => ({ ...prev, [paper.id]: true }));
      try {
        const res = await fetch('/api/ai/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paper: { title: paper.title, authors: paper.authors, year: paper.year, journal: paper.journal, abstract: paper.abstract },
            criteria: { include: inclusionTags, exclude: exclusionTags },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiResults(prev => ({ ...prev, [paper.id]: {
            confidence: data.confidence ?? 0,
            decision: data.decision ?? 'undecided',
            reasoning: data.reasoning ?? '',
          }}));
        }
      } catch {
        // AI triage unavailable — show no confidence score
      } finally {
        setAiLoading(prev => ({ ...prev, [paper.id]: false }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState]);

  const currentCard  = PAPERS[cardIdx] ?? null;
  const TOTAL_PAPERS = PAPERS.length;
  const DONE_PAPERS  = Object.keys(decisions).length;

  // Helper: get AI data for a paper (real result or default)
  const getAi = (paper: ScreeningPaper): AiResult => aiResults[paper.id] ?? {
    confidence: 0,
    decision: 'undecided',
    reasoning: '',
  };

  // ── Tag helpers ──
  const addTag = (type: 'inc' | 'exc') => {
    const val = (type === 'inc' ? incInput : excInput).trim();
    if (!val) return;
    if (type === 'inc') { setInclusionTags(p => [...p, val]); setIncInput(''); }
    else                { setExclusionTags(p => [...p, val]); setExcInput(''); }
  };
  const removeTag = (type: 'inc' | 'exc', tag: string) => {
    if (type === 'inc') setInclusionTags(p => p.filter(t => t !== tag));
    else                setExclusionTags(p => p.filter(t => t !== tag));
  };

  // ── Decision (with exit animation) ──
  const makeDecision = useCallback((d: Decision) => {
    if (!currentCard) return;
    const dir = d === 'include' ? 'right' : d === 'exclude' ? 'left' : 'down';
    setExiting({ dir, d });

    // Save decision to DB in background
    if (currentSessionId) {
      saveDecision(currentSessionId, null, currentCard.title, d).catch(() => null);
    }

    setTimeout(() => {
      setDecisions(prev => ({ ...prev, [currentCard!.id]: d }));
      setCardIdx(prev => Math.min(prev + 1, Math.max(0, PAPERS.length - 1)));
      setReasoningExpanded(false);
      setOffset({ x: 0, y: 0 });
      setSwipeHint(null);
      setExiting(null);
    }, 260);
  }, [currentCard, currentSessionId, saveDecision]);

  // ── Close exclude dropdown on outside click ──
  useEffect(() => {
    if (!excludeDropOpen) return;
    const h = () => setExcludeDropOpen(false);
    window.addEventListener('pointerdown', h);
    return () => window.removeEventListener('pointerdown', h);
  }, [excludeDropOpen]);

  // ── Keyboard ──
  useEffect(() => {
    if (viewState !== 'screening' || activeTab !== 'screening') return;
    const h = (e: KeyboardEvent) => {
      if (!e.isTrusted) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') makeDecision('include');
      if (e.key === 'ArrowLeft')  makeDecision('exclude');
      if (e.key === 'ArrowDown')  makeDecision('undecided');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [viewState, activeTab, makeDecision]);

  // ── Swipe (pointer events) ──
  const onSwipeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    isSwiping.current = true;
    swipeStart.current = { x: e.clientX, y: e.clientY };
    cardRef.current?.setPointerCapture(e.pointerId);
  };
  const onSwipeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwiping.current) return;
    const dx = e.clientX - swipeStart.current.x;
    const dy = e.clientY - swipeStart.current.y;
    setOffset({ x: dx, y: dy });
    const HINT_T = 55;
    if (Math.abs(dx) > Math.abs(dy)) {
      setSwipeHint(dx > HINT_T ? 'include' : dx < -HINT_T ? 'exclude' : null);
    } else {
      setSwipeHint(dy > HINT_T ? 'undecided' : null);
    }
  };
  const onSwipeEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const THRESH = 80;
    const dx = offset.x, dy = offset.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if      (dx >  THRESH) makeDecision('include');
      else if (dx < -THRESH) makeDecision('exclude');
      else { setOffset({ x: 0, y: 0 }); setSwipeHint(null); }
    } else {
      if (dy > THRESH) makeDecision('undecided');
      else { setOffset({ x: 0, y: 0 }); setSwipeHint(null); }
    }
  };

  // ── Card transform ──
  const cardTransform = (() => {
    if (exiting) {
      const tx = exiting.dir === 'right' ? 600 : exiting.dir === 'left' ? -600 : 0;
      const ty = exiting.dir === 'down'  ? 400 : 0;
      const rot = exiting.dir === 'right' ? 18 : exiting.dir === 'left' ? -18 : 0;
      return `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`;
    }
    const rot = offset.x * 0.028;
    return `translateX(${offset.x}px) translateY(${offset.y * 0.35}px) rotate(${rot}deg)`;
  })();

  const cardTransition = exiting ? 'transform 0.26s cubic-bezier(0.4,0,1,1), opacity 0.26s' : isSwiping.current ? 'none' : 'transform 0.35s cubic-bezier(0.2,0.8,0.3,1)';
  const cardOpacity    = exiting ? 0 : 1;

  // ────────────────────────── Render ──────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Top bar: breadcrumb + tab switcher ── */}
      <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.07em', marginBottom: '10px', textTransform: 'uppercase' }}>
          <span>Moku</span><span>›</span>
          <Link href="/dashboard/library" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Library</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-2)' }}>Systematic Screening</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '21px', fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.022em', margin: 0, lineHeight: 1.2 }}>
              Systematic Screening <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>Studio</em>
            </h1>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '3px' }}>
              PRISMA-compliant · dual-reviewer · AI-assisted triage
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* PRISMA 2020 Pro CTA — always visible */}
            <button
              onClick={() => setShowPrismaModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                height: '36px', padding: '0 14px',
                background: 'rgba(255,215,0,0.07)',
                border: '1px solid rgba(255,215,0,0.35)',
                borderRadius: '10px',
                color: '#F5C400', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,215,0,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.55)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,215,0,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.35)'; }}
            >
              <Sparkles size={13} />
              Generate PRISMA 2020 Flowchart
              <span style={{
                fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.06em',
                padding: '2px 6px', borderRadius: '20px',
                background: '#FFD700', color: '#0F1117',
              }}>PRO</span>
            </button>

            {/* Tab switcher (only when not in setup) */}
            {viewState !== 'setup' && (
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                {(['screening', 'conflicts', 'results'] as ActiveTab[]).map(tab => {
                  const labels: Record<ActiveTab, string> = { screening: 'Screening', conflicts: 'Conflicts', results: 'Results' };
                  const icons: Record<ActiveTab, React.ReactNode> = {
                    screening:  <Play size={12} />,
                    conflicts:  <AlertTriangle size={12} />,
                    results:    <BarChart3 size={12} />,
                  };
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '7px', border: 'none',
                        background: isActive ? 'var(--surface-3)' : 'transparent',
                        color: isActive ? 'var(--text)' : 'var(--text-3)',
                        fontSize: '12px', fontWeight: isActive ? 500 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {icons[tab]} {labels[tab]}
                      {tab === 'conflicts' && (
                        <span style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44', borderRadius: '20px', padding: '0 5px', fontSize: '10px', fontWeight: 600 }}>
                          0
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATE 1: Criteria Setup ── */}
      {viewState === 'setup' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Past sessions */}
            {!sessionsLoading && sessions.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 10 }}>Previous Sessions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sessions.slice(0, 4).map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--line-soft)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2, fontFamily: 'var(--font-geist-mono,monospace)' }}>
                          {s.done_count ?? 0} screened · {s.status}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: s.status === 'completed' ? 'rgba(111,191,138,0.12)' : 'var(--teal-soft)', color: s.status === 'completed' ? 'var(--success)' : 'var(--teal)' }}>
                        {s.status === 'completed' ? 'Done' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusion */}
            <CriteriaBox
              label="Inclusion Criteria"
              color="var(--teal)"
              colorBg="var(--teal-soft)"
              tags={inclusionTags}
              inputVal={incInput}
              onInputChange={setIncInput}
              onAdd={() => addTag('inc')}
              onRemove={tag => removeTag('inc', tag)}
              placeholder="Type criterion + Enter…"
            />

            {/* Exclusion */}
            <CriteriaBox
              label="Exclusion Criteria"
              color="var(--red)"
              colorBg="rgba(229,86,75,0.1)"
              tags={exclusionTags}
              inputVal={excInput}
              onInputChange={setExcInput}
              onAdd={() => addTag('exc')}
              onRemove={tag => removeTag('exc', tag)}
              placeholder="Type criterion + Enter…"
            />

            {/* Paper count */}
            <div style={{
              padding: '16px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--teal-soft)', display: 'grid', placeItems: 'center' }}>
                  <FileText size={16} style={{ color: 'var(--teal)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                    {papersLoading ? 'Loading library…' : `${libraryPapers.length} paper${libraryPapers.length !== 1 ? 's' : ''} in your library`}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                    {libraryPapers.length === 0 && !papersLoading ? 'Add papers to your Library first.' : 'Ready to screen.'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6FBF8A', boxShadow: '0 0 6px #6FBF8A' }} />
                <span style={{ fontSize: '11px', color: '#6FBF8A', fontFamily: 'monospace' }}>LIBRARY SYNC</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={async () => {
                const title = `Screening ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                const session = await createSession(title, inclusionTags, exclusionTags);
                if (session) setCurrentSessionId(session.id);
                setViewState('screening');
                setActiveTab('screening');
              }}
              style={{
                height: '48px',
                borderRadius: '14px',
                border: 'none',
                background: 'var(--teal)',
                color: '#0F1117',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                letterSpacing: '-0.01em',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              <Play size={17} fill="currentColor" />
              Start Screening Session
            </button>
          </div>
        </div>
      )}

      {/* ── STATE 2: Rapid Swipe Mode (Screening tab) ── */}
      {viewState === 'screening' && activeTab === 'screening' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

          {/* Progress bar + pause */}
          <div style={{ padding: '0 22px 10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'monospace' }}>
                {DONE_PAPERS} / {TOTAL_PAPERS} screened
              </span>
              <button
                onClick={() => setViewState('setup')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--line)', borderRadius: '8px', padding: '4px 10px', color: 'var(--text-3)', fontSize: '11.5px', cursor: 'pointer' }}
              >
                <Pause size={11} /> Pause Session
              </button>
            </div>
            <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: TOTAL_PAPERS > 0 ? `${(DONE_PAPERS / TOTAL_PAPERS) * 100}%` : '0%', background: 'linear-gradient(90deg, var(--teal), var(--teal-deep))', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Card area */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px', position: 'relative', overflow: 'hidden' }}>

            {/* Ghost cards behind */}
            {[2, 1].map(i => (
              <div key={i} style={{
                position: 'absolute',
                width: 'min(640px, calc(100% - 44px))',
                height: 'calc(100% - 16px)',
                background: 'var(--surface)',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                transform: `scale(${1 - i * 0.04}) translateY(${i * 10}px)`,
                opacity: 1 - i * 0.25,
                zIndex: 3 - i,
              }} />
            ))}

            {/* Active card */}
            {PAPERS.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-3)', zIndex: 10, position: 'relative' }}>
                <FileText size={40} style={{ color: 'var(--teal)', margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: '17px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>Library is empty</div>
                <div style={{ fontSize: '13px' }}>Add papers to your Library first, then return here to screen them.</div>
              </div>
            ) : currentCard && !decisions[currentCard.id] ? (
              <div
                ref={cardRef}
                onPointerDown={onSwipeStart}
                onPointerMove={onSwipeMove}
                onPointerUp={onSwipeEnd}
                onPointerLeave={onSwipeEnd}
                style={{
                  position: 'relative',
                  width: 'min(640px, calc(100% - 44px))',
                  height: 'calc(100% - 16px)',
                  background: 'var(--surface)',
                  borderRadius: '20px',
                  border: `1px solid ${swipeHint === 'include' ? 'rgba(111,191,138,0.6)' : swipeHint === 'exclude' ? 'rgba(229,86,75,0.6)' : 'var(--line)'}`,
                  boxShadow: 'var(--shadow)',
                  transform: cardTransform,
                  transition: cardTransition,
                  opacity: cardOpacity,
                  zIndex: 10,
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  touchAction: 'none',
                  userSelect: 'none',
                }}
              >
                {/* Swipe overlays */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', background: 'rgba(111,191,138,0.14)', opacity: swipeHint === 'include' ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '28px' }}>
                  <CheckCircle2 size={40} style={{ color: '#6FBF8A', opacity: 0.9 }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', background: 'rgba(229,86,75,0.14)', opacity: swipeHint === 'exclude' ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '28px' }}>
                  <XCircle size={40} style={{ color: '#E5564B', opacity: 0.9 }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', background: 'rgba(139,143,168,0.14)', opacity: swipeHint === 'undecided' ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '28px' }}>
                  <MinusCircle size={40} style={{ color: '#8B8FA8', opacity: 0.9 }} />
                </div>

                {/* AI confidence badge (top-right) */}
                {(() => {
                  const ai = getAi(currentCard);
                  const isLoadingAi = aiLoading[currentCard.id];
                  return (
                    <div style={{
                      position: 'absolute', top: '14px', right: '14px',
                      background: isLoadingAi ? 'var(--surface-3)' : confidenceBg(ai.confidence),
                      border: `1px solid ${isLoadingAi ? 'var(--line)' : confidenceColor(ai.confidence) + '44'}`,
                      borderRadius: '8px',
                      padding: '4px 10px',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      zIndex: 11,
                    }}>
                      <Sparkles size={11} style={{ color: isLoadingAi ? 'var(--text-4)' : confidenceColor(ai.confidence), animation: isLoadingAi ? 'spin 1.5s linear infinite' : 'none' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isLoadingAi ? 'var(--text-4)' : confidenceColor(ai.confidence), fontFamily: 'monospace' }}>
                        {isLoadingAi ? 'AI …' : `AI ${ai.confidence}%`}
                      </span>
                    </div>
                  );
                })()}

                {/* Card header */}
                <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--line-soft)', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {cardIdx + 1} of {TOTAL_PAPERS} in queue
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: '#E8E8E8', lineHeight: 1.35, marginBottom: '6px', paddingRight: '70px' }}>
                    {currentCard.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8B8FA8' }}>
                    {currentCard.authors} · {currentCard.year} · <em>{currentCard.journal}</em>
                  </div>
                </div>

                {/* Abstract */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '14px' }}>
                    {currentCard.abstract}
                  </div>

                  {/* AI Match bar + inline reasoning */}
                  {(() => {
                    const ai = getAi(currentCard);
                    const isLoadingAi = aiLoading[currentCard.id];
                    const matchColor = isLoadingAi ? 'var(--text-4)' : confidenceColor(ai.confidence);
                    const matchBg    = isLoadingAi ? 'var(--surface-3)' : confidenceBg(ai.confidence);
                    return (
                      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '12px', padding: '12px 14px', marginTop: '4px' }}>
                        {/* Row 1: label + score */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            <Sparkles size={11} style={{ color: 'var(--teal)' }} />
                            AI Match
                          </span>
                          <span style={{
                            fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-geist-mono)',
                            color: matchColor, background: matchBg,
                            padding: '2px 8px', borderRadius: '20px',
                            border: `1px solid ${isLoadingAi ? 'var(--line)' : confidenceColor(ai.confidence) + '44'}`,
                          }}>
                            {isLoadingAi ? 'Analyzing…' : `${ai.confidence}%`}
                          </span>
                        </div>
                        {/* Row 2: bar */}
                        <div style={{ height: '5px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                          {isLoadingAi
                            ? <div className="skeleton" style={{ height: '100%', width: '55%', borderRadius: '4px' }} />
                            : <div style={{ height: '100%', width: `${ai.confidence}%`, background: `linear-gradient(90deg, ${confidenceColor(ai.confidence)}bb, ${confidenceColor(ai.confidence)})`, borderRadius: '4px', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                          }
                        </div>
                        {/* Row 3: reasoning inline */}
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.65, fontStyle: 'italic' }}>
                          {isLoadingAi
                            ? 'Moku AI is evaluating this paper against your criteria…'
                            : ai.reasoning
                              ? ai.reasoning
                              : <span style={{ color: 'var(--text-4)' }}>AI reasoning will appear after analysis.</span>
                          }
                        </div>
                        {/* Row 4: expand button for long reasoning */}
                        {ai.reasoning && ai.reasoning.length > 120 && (
                          <button
                            onClick={() => setReasoningExpanded(v => !v)}
                            style={{ marginTop: '6px', background: 'none', border: 'none', color: 'var(--teal)', fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {reasoningExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {reasoningExpanded ? 'Show less' : 'Show full reasoning'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* All cards decided */
              <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                <CheckCheck size={40} style={{ color: 'var(--teal)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '17px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>Queue complete</div>
                <div style={{ fontSize: '13px' }}>All {TOTAL_PAPERS} papers in your library have been reviewed.</div>
                <button onClick={() => setActiveTab('results')} style={{ marginTop: '18px', padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'var(--teal)', color: '#0F1117', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                  View Results →
                </button>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div style={{ padding: '10px 22px 16px', flexShrink: 0, display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {/* Exclude — with reason dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
              {/* Reason dropdown */}
              {excludeDropOpen && (
                <div style={{
                  position: 'absolute', bottom: '66px', left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: '12px', padding: '6px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                  zIndex: 20, minWidth: '168px',
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 8px 6px' }}>
                    Exclude reason
                  </div>
                  {['Wrong population', 'Not in English', 'Not peer-reviewed', 'Duplicate', 'Out of scope'].map(reason => (
                    <button
                      key={reason}
                      onClick={() => { setExcludeDropOpen(false); makeDecision('exclude'); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', background: 'transparent', color: 'var(--text-2)', fontSize: '12.5px', cursor: 'pointer', borderRadius: '7px', transition: 'background 0.1s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,86,75,0.08)'; (e.currentTarget as HTMLElement).style.color = '#E5564B'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setExcludeDropOpen(v => !v)}
                style={{
                  width: '88px', height: '52px', borderRadius: '14px',
                  border: `1.5px solid ${swipeHint === 'exclude' || excludeDropOpen ? 'rgba(229,86,75,0.45)' : 'var(--line)'}`,
                  background: swipeHint === 'exclude' || excludeDropOpen ? 'rgba(229,86,75,0.08)' : 'var(--surface)',
                  color: swipeHint === 'exclude' || excludeDropOpen ? '#E5564B' : 'var(--text-2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  fontSize: '12.5px', fontWeight: 500, transition: 'all 0.15s', flexDirection: 'column',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(229,86,75,0.08)'; el.style.borderColor = 'rgba(229,86,75,0.45)'; el.style.color = '#E5564B'; }}
                onMouseLeave={e => { if (swipeHint === 'exclude' || excludeDropOpen) return; const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface)'; el.style.borderColor = 'var(--line)'; el.style.color = 'var(--text-2)'; }}
              >
                <ArrowLeft size={16} />
                <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Exclude <ChevronDown size={9} />
                </span>
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '4px', padding: '1px 6px' }}>←</span>
            </div>

            {/* Undecided */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => makeDecision('undecided')}
                style={{
                  width: '88px', height: '52px', borderRadius: '14px',
                  border: `1.5px solid ${swipeHint === 'undecided' ? 'rgba(139,143,168,0.45)' : 'var(--line)'}`,
                  background: swipeHint === 'undecided' ? 'rgba(139,143,168,0.08)' : 'var(--surface)',
                  color: swipeHint === 'undecided' ? '#8B8FA8' : 'var(--text-2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '12.5px', fontWeight: 500, transition: 'all 0.15s', flexDirection: 'column',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(139,143,168,0.08)'; el.style.borderColor = 'rgba(139,143,168,0.45)'; el.style.color = '#8B8FA8'; }}
                onMouseLeave={e => { if (swipeHint === 'undecided') return; const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface)'; el.style.borderColor = 'var(--line)'; el.style.color = 'var(--text-2)'; }}
              >
                <ArrowDown size={16} />
                <span style={{ fontSize: '11px' }}>Undecided</span>
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '4px', padding: '1px 6px' }}>↓</span>
            </div>

            {/* Include */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => makeDecision('include')}
                style={{
                  width: '88px', height: '52px', borderRadius: '14px',
                  border: `1.5px solid ${swipeHint === 'include' ? 'rgba(111,191,138,0.45)' : 'var(--line)'}`,
                  background: swipeHint === 'include' ? 'rgba(111,191,138,0.08)' : 'var(--surface)',
                  color: swipeHint === 'include' ? '#6FBF8A' : 'var(--text-2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '12.5px', fontWeight: 500, transition: 'all 0.15s', flexDirection: 'column',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(111,191,138,0.08)'; el.style.borderColor = 'rgba(111,191,138,0.45)'; el.style.color = '#6FBF8A'; }}
                onMouseLeave={e => { if (swipeHint === 'include') return; const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface)'; el.style.borderColor = 'var(--line)'; el.style.color = 'var(--text-2)'; }}
              >
                <ArrowRight size={16} />
                <span style={{ fontSize: '11px' }}>Include</span>
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '4px', padding: '1px 6px' }}>→</span>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 3: Conflicts Tab ── */}
      {viewState === 'screening' && activeTab === 'conflicts' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { label: 'Conflicts pending', value: `${resolved.size > 0 ? 0 : 0}`, color: '#F59E0B' },
              { label: 'Papers reviewed',   value: `${DONE_PAPERS} / ${TOTAL_PAPERS}`, color: 'var(--teal)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', minWidth: '160px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Empty state — dual-reviewer conflicts are recorded once two reviewers diverge on the same paper */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--teal)', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '15px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>No conflicts yet</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
              Reviewer conflicts appear here when a second reviewer disagrees with an earlier decision on the same paper. Invite a collaborator to enable dual-review.
            </div>
          </div>

          {/* Future: conflict rows rendered here when dual-reviewer data exists */}
          {false && (() => {
              const row = { id: '', title: '', reviewer1: { decision: 'include' as Decision, confidence: 0, reasoning: '' }, reviewer2: { decision: 'include' as Decision, confidence: 0, reasoning: '' } };
              const isExpanded = expandedConflict === row.id;
              const isResolved = resolved.has(row.id);
              return (
                <div key={row.id} style={{ borderBottom: '1px solid var(--line-soft)', borderLeft: isResolved ? '3px solid #6FBF8A' : '3px solid #F59E0B' }}>
                  {/* Row */}
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 90px', padding: '12px 16px', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setExpandedConflict(isExpanded ? null : row.id)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--row-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingRight: '12px' }}>
                      {isExpanded ? <ChevronUp size={13} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />}
                      <span style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.4 }}>{row.title}</span>
                    </div>
                    <div><DecisionPill d={row.reviewer1.decision} /></div>
                    <div><DecisionPill d={row.reviewer2.decision} /></div>
                    <div>
                      {isResolved ? (
                        <span style={{ fontSize: '11px', color: '#6FBF8A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Resolved
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setResolveModal(row); setResolvePick('include'); }}
                          style={{ padding: '4px 10px', borderRadius: '7px', border: '1px solid #F59E0B44', background: '#F59E0B11', color: '#F59E0B', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded reasoning */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 14px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[row.reviewer1, row.reviewer2].map((rev, ri) => (
                        <div key={ri} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <Users size={11} style={{ color: 'var(--text-3)' }} />
                            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Reviewer {ri + 1}</span>
                            <DecisionPill d={rev.decision} />
                            <span style={{ marginLeft: 'auto', fontSize: '10px', fontFamily: 'monospace', color: confidenceColor(rev.confidence) }}>{rev.confidence}%</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.65, fontStyle: 'italic' }}>{rev.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      )}

      {/* ── Results Tab ── */}
      {viewState === 'screening' && activeTab === 'results' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: 'Included',  value: Object.values(decisions).filter(d => d === 'include').length,   color: '#6FBF8A',        icon: <CheckCircle2 size={18} /> },
              { label: 'Excluded',  value: Object.values(decisions).filter(d => d === 'exclude').length,   color: '#E5564B',        icon: <XCircle size={18} /> },
              { label: 'Undecided', value: Object.values(decisions).filter(d => d === 'undecided').length, color: '#8B8FA8',        icon: <MinusCircle size={18} /> },
              { label: 'Remaining', value: TOTAL_PAPERS - DONE_PAPERS,                                     color: 'var(--text-3)', icon: <FileText size={18} /> },
            ].map(s => (
              <div key={s.label} style={{ flex: '1 1 120px', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 300, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Decisions list */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>
              Screened Papers ({Object.keys(decisions).length} in this session)
            </div>
            {PAPERS.filter(p => decisions[p.id]).map((p, i, arr) => (
              <div key={p.id} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.35, marginBottom: '3px' }}>{p.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.authors} · {p.year}</div>
                </div>
                <DecisionPill d={decisions[p.id]} />
              </div>
            ))}
            {Object.keys(decisions).length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                No papers screened yet in this session. Switch to the Screening tab to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRISMA 2020 Pro Modal ── */}
      {showPrismaModal && (
        <>
          <div
            onClick={() => setShowPrismaModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 'min(460px, 92vw)',
            background: 'var(--surface)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: '20px',
            boxShadow: '0 0 0 1px rgba(255,215,0,0.1), 0 32px 64px -24px rgba(0,0,0,0.6)',
            zIndex: 51, padding: '28px 28px 24px',
          }}>
            {/* Close */}
            <button onClick={() => setShowPrismaModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center', borderRadius: 7 }}>
              <X size={16} />
            </button>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Sparkles size={20} style={{ color: '#FFD700' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)' }}>PRISMA 2020 Flowchart</span>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFD700', color: '#0F1117', letterSpacing: '0.05em' }}>PRO</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Premium export feature</div>
              </div>
            </div>
            {/* Body */}
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 22 }}>
              Upgrade to <strong style={{ color: 'var(--text)' }}>Moku Pro</strong> to export PRISMA 2020 compliant flowcharts for your systematic review.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
              {['Auto-generates from your screening decisions', 'PRISMA 2020 & 2009 formats', 'Export as SVG, PNG, or PDF', 'Editable labels & stage counts'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                  <CheckCircle2 size={13} style={{ color: '#FFD700', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            {/* CTA */}
            <button
              style={{ width: '100%', height: 44, borderRadius: 12, border: '1.5px solid rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.1)', color: '#F5C400', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,215,0,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,215,0,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.4)'; }}
            >
              Upgrade to Moku Pro →
            </button>
            <div style={{ fontSize: 11.5, color: 'var(--text-4)', textAlign: 'center', marginTop: 12 }}>
              Cancel anytime · includes all Pro features
            </div>
          </div>
        </>
      )}

      {/* ── Resolve Conflict Modal ── */}
      {resolveModal && (
        <>
          <div
            onClick={() => setResolveModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 'min(480px, 92vw)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
            zIndex: 51,
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>Resolve Conflict</div>
              <button onClick={() => setResolveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: '18px', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--line)' }}>
              {resolveModal.title}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginBottom: '10px' }}>Final decision:</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {([
                { d: 'include'   as Decision, label: 'Include',   icon: <CheckCircle2 size={14} />, color: '#6FBF8A', bg: 'rgba(111,191,138,0.12)', border: 'rgba(111,191,138,0.45)' },
                { d: 'exclude'   as Decision, label: 'Exclude',   icon: <XCircle size={14} />,      color: '#E5564B', bg: 'rgba(229,86,75,0.12)',   border: 'rgba(229,86,75,0.45)' },
                { d: 'undecided' as Decision, label: 'Discuss',   icon: <MessageSquare size={14} />,color: '#8B8FA8', bg: 'rgba(139,143,168,0.12)', border: 'rgba(139,143,168,0.45)' },
              ]).map(opt => (
                <button
                  key={opt.d}
                  onClick={() => setResolvePick(opt.d)}
                  style={{
                    flex: 1, height: '54px', borderRadius: '12px',
                    border: `1.5px solid ${resolvePick === opt.d ? opt.border : 'var(--line)'}`,
                    background: resolvePick === opt.d ? opt.bg : 'transparent',
                    color: resolvePick === opt.d ? opt.color : 'var(--text-3)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    fontSize: '11.5px', fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setResolved(prev => { const s = new Set(Array.from(prev)); s.add(resolveModal!.id); return s; });
                setResolveModal(null);
              }}
              style={{ width: '100%', height: '42px', borderRadius: '11px', border: 'none', background: 'var(--teal)', color: '#0F1117', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Confirm Resolution
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────── CriteriaBox sub-component ───────────────────────

function CriteriaBox({
  label, color, colorBg, tags, inputVal, onInputChange, onAdd, onRemove, placeholder,
}: {
  label: string; color: string; colorBg: string;
  tags: string[]; inputVal: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (t: string) => void;
  placeholder: string;
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 5px ${color}88` }} />
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>{label}</span>
        <span style={{ marginLeft: 'auto', background: colorBg, border: `1px solid ${color}44`, borderRadius: '20px', padding: '1px 8px', fontSize: '10.5px', color, fontWeight: 600 }}>
          {tags.length}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: tags.length ? '10px' : '0' }}>
          {tags.map(tag => (
            <span
              key={tag}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: colorBg, border: `1px solid ${color}33`, color, fontSize: '12px', fontWeight: 500 }}
            >
              {tag}
              <button
                onClick={() => onRemove(tag)}
                style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', color, display: 'flex', alignItems: 'center', opacity: 0.7, lineHeight: 0 }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={inputVal}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
            placeholder={placeholder}
            style={{
              flex: 1, height: '36px', borderRadius: '9px', border: '1px solid var(--line)',
              background: 'var(--surface-2)', color: 'var(--text)', fontSize: '12.5px',
              padding: '0 12px', outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = color; (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px ${color}22`; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--line)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
          />
          <button
            onClick={onAdd}
            style={{ width: '36px', height: '36px', borderRadius: '9px', border: `1px solid ${color}44`, background: colorBg, color, cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'opacity 0.15s' }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
