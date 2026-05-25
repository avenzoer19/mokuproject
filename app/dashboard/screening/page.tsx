'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useScreening } from '@/lib/hooks/useScreening';
import {
  Plus, X, Play, Pause, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, MinusCircle, ArrowLeft,
  ArrowRight, ArrowDown, Sparkles, RotateCcw,
  Users, BarChart3, AlertTriangle, FileText,
  CheckCheck, MessageSquare,
} from 'lucide-react';

// ─────────────────────── Data ───────────────────────

interface Paper {
  id: string; title: string; authors: string;
  year: number; journal: string; abstract: string;
  aiConfidence: number; aiReasoning: string;
}

const PAPERS: Paper[] = [
  {
    id: 'p1',
    title: 'Electrospun PCL/chitosan scaffolds loaded with paclitaxel for cervical cancer treatment: an in vivo murine model study',
    authors: 'Chen Y., Setiawan A., Müller R.',
    year: 2023, journal: 'Biomaterials Science',
    abstract: 'This study reports the fabrication of coaxially electrospun polycaprolactone (PCL)/chitosan core-shell nanofibers loaded with paclitaxel (PTX) for locoregional cervical cancer therapy. Scaffolds were characterised by SEM, FTIR, and DSC. Drug release kinetics demonstrated a biphasic profile with initial burst release followed by sustained delivery over 21 days. In vivo efficacy was evaluated in a murine subcutaneous HeLa xenograft model (n=18). Tumour volume reduction of 64.3% was observed in the treatment group compared to controls (p<0.001). Histological analysis confirmed biocompatibility and absence of systemic toxicity.',
    aiConfidence: 91,
    aiReasoning: 'Included because: mentions in vivo cervical cancer model (HeLa xenograft), electrospun scaffold, sustained drug delivery, published 2023. Meets all inclusion criteria.',
  },
  {
    id: 'p2',
    title: 'Systematic review of nanofiber-based drug delivery systems in gynecological oncology',
    authors: 'Okafor J., Müller R.',
    year: 2022, journal: 'Journal of Controlled Release',
    abstract: 'A comprehensive systematic review and meta-analysis of electrospun nanofiber platforms investigated for gynecological cancer drug delivery (2010–2022). Fifty-three studies were included following PRISMA guidelines. The review found substantial heterogeneity in fibre composition, drug loading methodology, and outcome measurement. Cervical cancer models constituted 42% of included studies. Meta-analysis of drug encapsulation efficiency reported a pooled mean of 78.4% (95% CI: 71.2–85.6%). Key limitations include lack of standardised in vitro–in vivo correlation models and limited clinical translation data.',
    aiConfidence: 28,
    aiReasoning: 'Excluded because: this is a systematic review / meta-analysis. Exclusion criterion "Review paper" directly applies. Contains no original experimental in vivo data.',
  },
  {
    id: 'p3',
    title: 'Coaxial electrospinning of PVP/PCL core-shell nanofibers for sustained vaginal drug delivery',
    authors: 'Setiawan A., Petrova L., Iwasaki M.',
    year: 2024, journal: 'ACS Applied Materials & Interfaces',
    abstract: 'Core-shell nanofibers composed of polyvinylpyrrolidone (PVP) core and polycaprolactone (PCL) shell were fabricated via coaxial electrospinning for intravaginal drug delivery of tenofovir (TFV). Morphological characterisation by TEM confirmed core-shell architecture with mean shell thickness 180 ± 22 nm. Drug release over 14 days in simulated vaginal fluid (SVF, pH 4.2) demonstrated zero-order kinetics (R²=0.996). In vivo distribution study in New Zealand white rabbits demonstrated sustained mucosal drug levels for 72 hours post-insertion. Cytocompatibility with Vk2/E6E7 vaginal epithelial cells confirmed (viability >95%).',
    aiConfidence: 84,
    aiReasoning: 'Included because: coaxial electrospinning, PCL/PVP scaffold, in vivo rabbit model, vaginal drug delivery, published 2024. Meets inclusion criteria.',
  },
  {
    id: 'p4',
    title: 'Mechanical and degradation properties of crosslinked polycaprolactone scaffolds under physiological conditions',
    authors: 'Aharon D., Chen Y.',
    year: 2021, journal: 'Polymer Degradation and Stability',
    abstract: 'Crosslinked polycaprolactone (PCL) scaffolds prepared by UV irradiation (365 nm, 0–60 min) were characterised for mechanical properties and in vitro degradation in PBS (pH 7.4, 37°C) over 180 days. Ultimate tensile strength increased from 4.2 ± 0.3 MPa (uncrosslinked) to 7.8 ± 0.5 MPa at 30 min UV exposure. Mass loss followed first-order kinetics; crosslinked scaffolds retained structural integrity for 120 days versus 60 days for controls. No cytotoxicity was observed against L929 fibroblasts. Results support UV crosslinking as a viable strategy for tunable degradation control.',
    aiConfidence: 53,
    aiReasoning: 'Uncertain: PCL scaffold with crosslinking characterisation (partially matches inclusion criteria), but no in vivo study and no cancer model. Mechanical focus may be outside scope. Manual review recommended.',
  },
  {
    id: 'p5',
    title: 'In vitro cytotoxicity of aptamer-functionalised electrospun nanofibers against HeLa and SiHa cervical cancer cell lines',
    authors: 'Petrova L., Okafor J., Setiawan A.',
    year: 2023, journal: 'Nanomedicine: Nanotechnology, Biology and Medicine',
    abstract: 'Aptamer-functionalised electrospun PLGA nanofibers were evaluated for selective cytotoxicity against HeLa (HPV18+) and SiHa (HPV16+) cervical cancer cell lines. Aptamer AS1411 was conjugated to fibre surfaces via carbodiimide chemistry (conjugation efficiency 88.4%). MTT assay demonstrated IC₅₀ values of 12.4 µg/mL and 15.8 µg/mL for HeLa and SiHa respectively, with >4-fold selectivity over normal HEK293 cells. Flow cytometry confirmed G2/M cell cycle arrest. Apoptosis rate 67.3% at 72 h (Annexin V/PI). These results demonstrate promising selectivity for aptamer-targeted nanofiber platforms in cervical cancer.',
    aiConfidence: 76,
    aiReasoning: 'Included because: aptamer-functionalised electrospun nanofibers, cervical cancer cell lines, 2023. Note: in vitro only (no in vivo model). Inclusion criteria satisfied partially — screener judgment needed.',
  },
];

interface ConflictRow {
  id: string; title: string;
  reviewer1: { decision: Decision; confidence: number; reasoning: string };
  reviewer2: { decision: Decision; confidence: number; reasoning: string };
}

const CONFLICT_ROWS: ConflictRow[] = [
  {
    id: 'c1',
    title: 'Coaxial electrospinning of PVP/PCL core-shell nanofibers for sustained vaginal drug delivery',
    reviewer1: { decision: 'include', confidence: 84, reasoning: 'Meets all inclusion criteria: in vivo animal model, electrospun scaffold, relevant drug delivery context, within date range 2015–2025.' },
    reviewer2: { decision: 'exclude', confidence: 55, reasoning: 'The rabbit model does not translate to cervical cancer context. Study focus is HIV prevention, not cancer therapy. Recommend exclusion under current protocol.' },
  },
  {
    id: 'c2',
    title: 'In vitro cytotoxicity of aptamer-functionalised electrospun nanofibers against HeLa and SiHa cervical cancer cell lines',
    reviewer1: { decision: 'include', confidence: 76, reasoning: 'Cervical cancer model (HeLa/SiHa), aptamer-nanofiber system, 2023. Meets primary criteria despite in vitro limitation.' },
    reviewer2: { decision: 'undecided', confidence: 48, reasoning: 'No in vivo component. Inclusion criteria specifies "In vivo study". Unclear whether in vitro qualifies under the current protocol. Needs clarification.' },
  },
  {
    id: 'c3',
    title: 'Nanofiber-mediated local immunotherapy in murine cervical cancer models: a pilot study',
    reviewer1: { decision: 'exclude', confidence: 82, reasoning: 'Immunotherapy focus deviates from drug delivery scope. Nanofiber is delivery vehicle but primary outcome is immune activation, not pharmacokinetics.' },
    reviewer2: { decision: 'include', confidence: 91, reasoning: 'In vivo murine model (inclusion criteria met), nanofiber scaffold, cervical cancer, 2022. The immunotherapy angle is still within scope of localised delivery.' },
  },
];

// ─────────────────────── Types ───────────────────────

type Decision   = 'include' | 'exclude' | 'undecided';
type ViewState  = 'setup' | 'screening' | 'results';
type ActiveTab  = 'screening' | 'conflicts' | 'results';

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
  // ── DB hook ──
  const { sessions, createSession, saveDecision, completeSession, loading: sessionsLoading } = useScreening();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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
  const [resolveModal,      setResolveModal]      = useState<ConflictRow | null>(null);
  const [resolvePick,       setResolvePick]       = useState<Decision>('include');
  const [resolved,          setResolved]          = useState<Set<string>>(new Set());

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
            confidence: data.confidence ?? paper.aiConfidence,
            decision: data.decision ?? 'undecided',
            reasoning: data.reasoning ?? paper.aiReasoning,
          }}));
        }
      } catch {
        // Fall through to use hardcoded values
      } finally {
        setAiLoading(prev => ({ ...prev, [paper.id]: false }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState]);

  const currentCard = PAPERS[cardIdx];
  const TOTAL_SIM   = 247;
  const DONE_SIM    = 124 + Object.keys(decisions).length;

  // Helper: get AI data for a paper (real result or fallback to hardcoded)
  const getAi = (paper: Paper): AiResult => aiResults[paper.id] ?? {
    confidence: paper.aiConfidence,
    decision: 'undecided',
    reasoning: paper.aiReasoning,
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
      setDecisions(prev => ({ ...prev, [currentCard.id]: d }));
      setCardIdx(prev => Math.min(prev + 1, PAPERS.length - 1));
      setReasoningExpanded(false);
      setOffset({ x: 0, y: 0 });
      setSwipeHint(null);
      setExiting(null);
    }, 260);
  }, [currentCard, currentSessionId, saveDecision]);

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
                        {CONFLICT_ROWS.length - resolved.size}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
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
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>247 papers loaded</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Ready to screen.</div>
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
                {DONE_SIM} / {TOTAL_SIM} screened
              </span>
              <button
                onClick={() => setViewState('setup')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--line)', borderRadius: '8px', padding: '4px 10px', color: 'var(--text-3)', fontSize: '11.5px', cursor: 'pointer' }}
              >
                <Pause size={11} /> Pause Session
              </button>
            </div>
            <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(DONE_SIM / TOTAL_SIM) * 100}%`, background: 'linear-gradient(90deg, var(--teal), var(--teal-deep))', borderRadius: '4px', transition: 'width 0.4s ease' }} />
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
            {currentCard && !decisions[currentCard.id] ? (
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
                    {cardIdx + 1} of {PAPERS.length} in queue
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

                  {/* AI confidence bar */}
                  {(() => {
                    const ai = getAi(currentCard);
                    const isLoadingAi = aiLoading[currentCard.id];
                    return (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Confidence</span>
                            <span style={{ fontSize: '10.5px', fontWeight: 600, color: isLoadingAi ? 'var(--text-4)' : confidenceColor(ai.confidence), fontFamily: 'monospace' }}>
                              {isLoadingAi ? '…' : `${ai.confidence}%`}
                            </span>
                          </div>
                          <div style={{ height: '5px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
                            {isLoadingAi
                              ? <div style={{ height: '100%', width: '40%', background: 'var(--surface-2)', borderRadius: '4px', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                              : <div style={{ height: '100%', width: `${ai.confidence}%`, background: confidenceColor(ai.confidence), borderRadius: '4px', transition: 'width 0.5s ease' }} />
                            }
                          </div>
                        </div>

                        {/* AI Reasoning accordion */}
                        <button
                          onClick={() => setReasoningExpanded(v => !v)}
                          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-3)', fontSize: '11.5px', fontWeight: 500 }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={12} style={{ color: 'var(--teal)' }} />
                            AI Reasoning {isLoadingAi && <span style={{ color: 'var(--text-4)', fontSize: '10px' }}>— analyzing…</span>}
                          </span>
                          {reasoningExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {reasoningExpanded && (
                          <div style={{ marginTop: '6px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '0 0 10px 10px', border: '1px solid var(--line)', borderTop: 'none', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.65, fontStyle: 'italic' }}>
                            {isLoadingAi ? 'Moku AI is evaluating this paper against your criteria…' : ai.reasoning}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* All cards decided */
              <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                <CheckCheck size={40} style={{ color: 'var(--teal)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '17px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>Queue complete</div>
                <div style={{ fontSize: '13px' }}>All {PAPERS.length} papers in this batch have been reviewed.</div>
                <button onClick={() => setActiveTab('results')} style={{ marginTop: '18px', padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'var(--teal)', color: '#0F1117', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                  View Results →
                </button>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div style={{ padding: '10px 22px 16px', flexShrink: 0, display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {([
              { d: 'exclude'   as Decision, label: 'Exclude',   icon: <ArrowLeft size={16} />,  kbd: '←', accentColor: '#E5564B', accentBg: 'rgba(229,86,75,0.08)',  borderActive: 'rgba(229,86,75,0.45)' },
              { d: 'undecided' as Decision, label: 'Undecided', icon: <ArrowDown size={16} />,  kbd: '↓', accentColor: '#8B8FA8', accentBg: 'rgba(139,143,168,0.08)', borderActive: 'rgba(139,143,168,0.45)' },
              { d: 'include'   as Decision, label: 'Include',   icon: <ArrowRight size={16} />, kbd: '→', accentColor: '#6FBF8A', accentBg: 'rgba(111,191,138,0.08)', borderActive: 'rgba(111,191,138,0.45)' },
            ]).map(btn => (
              <div key={btn.d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => makeDecision(btn.d)}
                  style={{
                    width: '88px', height: '52px',
                    borderRadius: '14px',
                    border: `1.5px solid ${swipeHint === btn.d ? btn.borderActive : 'var(--line)'}`,
                    background: swipeHint === btn.d ? btn.accentBg : 'var(--surface)',
                    color: swipeHint === btn.d ? btn.accentColor : 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '12.5px', fontWeight: 500,
                    transition: 'all 0.15s',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = btn.accentBg;
                    el.style.borderColor = btn.borderActive;
                    el.style.color = btn.accentColor;
                  }}
                  onMouseLeave={e => {
                    if (swipeHint === btn.d) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'var(--surface)';
                    el.style.borderColor = 'var(--line)';
                    el.style.color = 'var(--text-2)';
                  }}
                >
                  {btn.icon}
                  <span style={{ fontSize: '11px' }}>{btn.label}</span>
                </button>
                <span style={{
                  fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace',
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                  borderRadius: '4px', padding: '1px 6px',
                }}>{btn.kbd}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATE 3: Conflicts Tab ── */}
      {viewState === 'screening' && activeTab === 'conflicts' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[
              { label: 'Conflicts remaining', value: `${CONFLICT_ROWS.length - resolved.size}`, color: '#F59E0B' },
              { label: 'Agreement rate',       value: '89%',                                   color: '#6FBF8A' },
              { label: 'Papers reviewed',       value: `${DONE_SIM} / ${TOTAL_SIM}`,           color: 'var(--teal)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', minWidth: '160px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '14px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 90px', padding: '10px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
              {['Paper Title', 'Reviewer 1', 'Reviewer 2', 'Action'].map(h => (
                <div key={h} style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {CONFLICT_ROWS.map((row, i) => {
              const isExpanded = expandedConflict === row.id;
              const isResolved = resolved.has(row.id);
              return (
                <div key={row.id} style={{ borderBottom: i < CONFLICT_ROWS.length - 1 ? '1px solid var(--line-soft)' : 'none', borderLeft: isResolved ? '3px solid #6FBF8A' : '3px solid #F59E0B' }}>
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
            })}
          </div>
        </div>
      )}

      {/* ── Results Tab ── */}
      {viewState === 'screening' && activeTab === 'results' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: 'Included',   value: Object.values(decisions).filter(d => d === 'include').length   + 68, color: '#6FBF8A', icon: <CheckCircle2 size={18} /> },
              { label: 'Excluded',   value: Object.values(decisions).filter(d => d === 'exclude').length   + 142, color: '#E5564B', icon: <XCircle size={18} /> },
              { label: 'Undecided',  value: Object.values(decisions).filter(d => d === 'undecided').length + 14,  color: '#8B8FA8', icon: <MinusCircle size={18} /> },
              { label: 'Remaining',  value: TOTAL_SIM - DONE_SIM,                                                 color: 'var(--text-3)', icon: <FileText size={18} /> },
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
