'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Quote,
  BookOpen, Image, Minus, Undo2, Redo2,
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  FileText, Star, Eye, AlignLeft, Plus, Check, ChevronDown,
} from 'lucide-react';
import { useManuscript } from '@/lib/hooks/useManuscript';

const OUTLINE = [
  { level: 1, title: 'Abstract',              active: false },
  { level: 1, title: '1. Introduction',       active: true  },
  { level: 2, title: '1.1 Background',        active: false },
  { level: 2, title: '1.2 Research gaps',     active: false },
  { level: 1, title: '2. Methods',            active: false },
  { level: 2, title: '2.1 Cell culture',      active: false },
  { level: 2, title: '2.2 Nanomaterial prep', active: false },
  { level: 2, title: '2.3 Assay conditions',  active: false },
  { level: 1, title: '3. Results',            active: false },
  { level: 2, title: '3.1 Dose-response',     active: false },
  { level: 2, title: '3.2 Mechanism data',    active: false },
  { level: 1, title: '4. Discussion',         active: false },
  { level: 1, title: '5. Conclusion',         active: false },
  { level: 1, title: 'References',            active: false },
];

const JOURNALS = [
  { name: 'Nature Nanotechnology',   score: 92, fit: 'Excellent', impact: '38.1' },
  { name: 'ACS Nano',                score: 87, fit: 'Strong',    impact: '17.1' },
  { name: 'Small',                   score: 76, fit: 'Good',      impact: '13.3' },
  { name: 'Nanoscale',               score: 64, fit: 'Fair',      impact: '6.7' },
];

const REVIEWER_COMMENTS = [
  { type: 'major', section: 'Methods §2.3', text: 'The statistical analysis lacks justification for the chosen test. Given the non-normal distribution suggested by your data, a Mann-Whitney U test should replace the paired t-test.' },
  { type: 'minor', section: 'Results §3.1', text: 'Figure 2 legend is unclear — specify units for the y-axis and provide error bar definition (SD vs SEM).' },
  { type: 'suggestion', section: 'Discussion', text: 'Consider addressing the limitation of using only immortalized cell lines. Reviewer 2 will likely raise this.' },
];

const commentConfig = {
  major: { color: 'var(--red)',     label: 'Major' },
  minor: { color: 'var(--warn)',    label: 'Minor' },
  suggestion: { color: 'var(--blue)', label: 'Suggestion' },
} as const;

const REFS = [
  { num: 1, authors: 'Liu X, Zhang Y, Okonkwo A', year: '2024', title: 'CRISPR-Cas9 off-target effects', journal: 'Nat Biotechnol', doi: '10.1038/s41587-024-01234-5' },
  { num: 2, authors: 'Patel R, Kim J, Mwangi K',  year: '2023', title: 'Nanomaterial cytotoxicity profiles', journal: 'ACS Nano', doi: '10.1021/acsnano.3c04567' },
  { num: 3, authors: 'Chen L, Nakamura T',         year: '2024', title: 'Single-cell proteomics', journal: 'Cell Syst', doi: '10.1016/j.cels.2024.02.003' },
];

export default function StudioPage() {
  const [zenMode, setZenMode] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [rpOpen, setRpOpen] = useState(true);
  const [activeRpTab, setActiveRpTab] = useState<'journals' | 'reviewer' | 'refs'>('journals');
  const [activeOutline, setActiveOutline] = useState(1);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number } | null>(null);
  const [openManuscriptId, setOpenManuscriptId] = useState<string | undefined>(undefined);
  const [showMsMenu, setShowMsMenu] = useState(false);

  const { manuscript, allManuscripts, loading: msLoading, saving, createManuscript, saveContent } = useManuscript(openManuscriptId);

  const outlineW = zenMode ? 0 : outlineOpen ? 220 : 0;
  const rpW = zenMode ? 0 : rpOpen ? 280 : 0;

  // Open first manuscript on mount
  useEffect(() => {
    if (!msLoading && !openManuscriptId) {
      if (allManuscripts.length > 0) {
        setOpenManuscriptId(allManuscripts[0].id);
      }
    }
  }, [msLoading, allManuscripts, openManuscriptId]);

  // Populate editor when manuscript loads
  useEffect(() => {
    if (manuscript && editorRef.current) {
      editorRef.current.innerHTML = manuscript.content ?? '';
      setHasContent(!!(manuscript.content?.trim()));
    }
    if (manuscript && titleRef.current) {
      titleRef.current.textContent = manuscript.title ?? 'Untitled Manuscript';
    }
  }, [manuscript?.id]); // Only re-populate when switching manuscripts, not on every save

  const handleContentChange = useCallback(() => {
    if (!manuscript || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const title = titleRef.current?.textContent ?? manuscript.title;
    setHasContent(!!(editorRef.current.textContent?.trim()));
    saveContent(manuscript.id, content, title);
  }, [manuscript, saveContent]);

  const handleTitleChange = useCallback(() => {
    if (!manuscript || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const title = titleRef.current?.textContent?.trim() ?? 'Untitled Manuscript';
    saveContent(manuscript.id, content, title);
  }, [manuscript, saveContent]);

  async function handleNewManuscript() {
    const ms = await createManuscript('Untitled Manuscript');
    if (ms) { setOpenManuscriptId(ms.id); }
    setShowMsMenu(false);
  }

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0 && editorRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      } else {
        setSelectionToolbar(null);
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  return (
    <div style={{
      height: '100%',
      display: 'grid',
      gridTemplateColumns: `${outlineW}px 1fr ${rpW}px`,
      gridTemplateRows: zenMode ? '0 1fr' : '44px 1fr',
      transition: 'grid-template-columns 0.3s ease, grid-template-rows 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      {!zenMode && (
        <div style={{
          gridColumn: '1 / -1',
          gridRow: '1',
          height: '44px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '4px',
          overflow: 'hidden',
        }}>
          {/* Outline toggle */}
          <button
            onClick={() => setOutlineOpen(v => !v)}
            title="Toggle outline"
            style={tbtnStyle(outlineOpen)}
          >
            <AlignLeft size={14} />
          </button>

          <div style={{ width: '1px', height: '20px', background: 'var(--line)', margin: '0 6px' }} />

          {/* Format */}
          {[
            { icon: <Bold size={14} />, cmd: 'bold', title: 'Bold' },
            { icon: <Italic size={14} />, cmd: 'italic', title: 'Italic' },
          ].map(({ icon, cmd, title }) => (
            <button key={cmd} onClick={() => execCmd(cmd)} title={title} style={tbtnStyle(false)}>{icon}</button>
          ))}
          {[
            { icon: <Heading1 size={14} />, cmd: 'formatBlock', val: 'h1', title: 'H1' },
            { icon: <Heading2 size={14} />, cmd: 'formatBlock', val: 'h2', title: 'H2' },
          ].map(({ icon, cmd, val, title }) => (
            <button key={title} onClick={() => execCmd(cmd, val)} title={title} style={tbtnStyle(false)}>{icon}</button>
          ))}
          <button onClick={() => execCmd('formatBlock', 'blockquote')} title="Quote" style={tbtnStyle(false)}>
            <Quote size={14} />
          </button>

          <div style={{ width: '1px', height: '20px', background: 'var(--line)', margin: '0 6px' }} />

          <button title="Insert citation" style={tbtnStyle(false)}>
            <BookOpen size={14} />
          </button>
          <button title="Insert figure" style={tbtnStyle(false)}>
            <Image size={14} />
          </button>
          <button title="Divider" onClick={() => execCmd('insertHorizontalRule')} style={tbtnStyle(false)}>
            <Minus size={14} />
          </button>

          <div style={{ width: '1px', height: '20px', background: 'var(--line)', margin: '0 6px' }} />

          <button onClick={() => execCmd('undo')} title="Undo" style={tbtnStyle(false)}><Undo2 size={14} /></button>
          <button onClick={() => execCmd('redo')} title="Redo" style={tbtnStyle(false)}><Redo2 size={14} /></button>

          <div style={{ flex: 1 }} />

          {/* Manuscript picker */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMsMenu(v => !v)}
              style={{ ...tbtnStyle(showMsMenu), gap: 4, paddingLeft: 8, paddingRight: 8, fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center' }}
            >
              <FileText size={12} />
              <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {manuscript?.title ?? 'No manuscript'}
              </span>
              <ChevronDown size={11} />
            </button>
            {showMsMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '6px', zIndex: 20, minWidth: 220, boxShadow: 'var(--shadow)' }}>
                {allManuscripts.map(ms => (
                  <button key={ms.id} onClick={() => { setOpenManuscriptId(ms.id); setShowMsMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: ms.id === openManuscriptId ? 'var(--teal-soft)' : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: ms.id === openManuscriptId ? 'var(--teal)' : 'var(--text)', textAlign: 'left' }}>
                    {ms.id === openManuscriptId && <Check size={12} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ms.title}</span>
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                <button onClick={handleNewManuscript}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: 'var(--teal)' }}>
                  <Plus size={12} /> New manuscript
                </button>
              </div>
            )}
          </div>

          {/* Save indicator */}
          <div style={{ fontSize: 11, color: saving ? 'var(--teal)' : 'var(--text-4)', fontFamily: 'var(--font-geist-mono,monospace)', letterSpacing: '0.08em', marginLeft: 8, whiteSpace: 'nowrap' }}>
            {saving ? '● saving…' : manuscript ? '✓ saved' : ''}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--line)', margin: '0 6px' }} />

          {/* Zen mode */}
          <button
            onClick={() => setZenMode(v => !v)}
            title="Zen mode"
            style={tbtnStyle(zenMode)}
          >
            {zenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Right panel toggle */}
          <button
            onClick={() => setRpOpen(v => !v)}
            title="Toggle right panel"
            style={tbtnStyle(rpOpen)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Outline panel */}
      <div style={{
        gridColumn: '1',
        gridRow: '2',
        borderRight: outlineOpen && !zenMode ? '1px solid var(--line)' : 'none',
        background: 'var(--surface)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {outlineOpen && !zenMode && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-4)', padding: '0 16px', marginBottom: '8px' }}>
              Outline
            </div>
            {OUTLINE.map((item, i) => (
              <div
                key={i}
                onClick={() => setActiveOutline(i)}
                style={{
                  padding: `6px ${item.level === 1 ? '14px' : '24px'}`,
                  paddingLeft: `${14 + (item.level - 1) * 12}px`,
                  fontSize: item.level === 1 ? '13px' : '12px',
                  color: i === activeOutline ? 'var(--teal)' : 'var(--text-3)',
                  background: i === activeOutline ? 'var(--teal-soft)' : 'transparent',
                  borderLeft: i === activeOutline ? '2px solid var(--teal)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: item.level === 1 ? 500 : 300,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'all 0.1s',
                }}
              >
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        overflowY: 'auto',
        background: 'var(--bg)',
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '680px' }}>
          {/* Document title */}
          <div
            ref={titleRef}
            contentEditable={!!manuscript}
            suppressContentEditableWarning
            onBlur={handleTitleChange}
            style={{
              fontSize: '28px',
              fontWeight: 300,
              color: 'var(--text)',
              outline: 'none',
              marginBottom: '8px',
              lineHeight: 1.3,
              fontFamily: 'Spectral, Georgia, serif',
            }}
            data-placeholder="Untitled Manuscript"
          >
            {!manuscript && !msLoading ? 'Start a new manuscript' : ''}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-4)', marginBottom: '32px', fontFamily: 'var(--font-geist-sans)' }}>
            {manuscript
              ? `${manuscript.word_count ?? 0} words · ${saving ? 'Saving…' : 'Auto-saved'}`
              : msLoading ? 'Loading…' : 'No manuscript open'
            }
          </div>

          {/* Editor content */}
          {!manuscript && !msLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-4)' }}>
              <FileText size={40} strokeWidth={0.8} style={{ opacity: 0.3, margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 8 }}>Your manuscript starts here.</div>
              <div style={{ fontSize: 12, marginBottom: 24 }}>Create a new manuscript or select one from the toolbar above.</div>
              <button onClick={handleNewManuscript} style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 10, color: '#0B3B38', fontSize: 13, fontWeight: 500, padding: '10px 20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> New Manuscript
              </button>
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable={!!manuscript}
            suppressContentEditableWarning
            onInput={handleContentChange}
            style={{
              outline: 'none',
              fontFamily: 'Spectral, Georgia, serif',
              fontSize: '17px',
              lineHeight: 1.75,
              color: 'var(--text)',
              minHeight: manuscript ? '400px' : '0',
              display: manuscript ? undefined : 'none',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>Abstract</h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-2)' }}>
              The proliferation of engineered nanomaterials in biomedical applications necessitates comprehensive toxicological profiling across diverse cell types. We conducted a systematic meta-analysis of 847 independent cytotoxicity studies published between 2015 and 2024, encompassing 23 nanomaterial classes across both immortalized and primary human cell lines. Our findings reveal a systematic underestimation of cytotoxicity in immortalized cell models by a factor of 2.8–4.1× compared to primary cell counterparts, with titanium dioxide and zinc oxide nanoparticles exhibiting the greatest divergence.
            </p>

            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)', marginTop: '28px' }}>1. Introduction</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-2)' }}>
              Engineered nanomaterials (ENMs) have emerged as transformative agents in drug delivery, imaging, and regenerative medicine{' '}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '12px',
                padding: '1px 7px',
                borderRadius: '20px',
                background: 'var(--teal-soft)',
                color: 'var(--teal)',
                border: '1px solid rgba(78,205,196,0.3)',
                fontFamily: 'var(--font-geist-sans)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <BookOpen size={10} /> 1
              </span>.
              Despite their therapeutic promise, concerns regarding cytotoxicity and genotoxicity remain inadequately resolved, particularly in clinically relevant primary cell systems{' '}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '12px',
                padding: '1px 7px',
                borderRadius: '20px',
                background: 'var(--teal-soft)',
                color: 'var(--teal)',
                border: '1px solid rgba(78,205,196,0.3)',
                fontFamily: 'var(--font-geist-sans)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <BookOpen size={10} /> 2
              </span>.
            </p>

            {/* Inline docking data card */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderLeft: '3px solid var(--teal)',
              borderRadius: '12px',
              padding: '14px 18px',
              margin: '20px 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
            contentEditable={false}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 200, color: 'var(--teal)' }}>−9.42</div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>ΔG (kcal/mol)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 200, color: 'var(--text)' }}>1.42 Å</div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>RMSD</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 200, color: 'var(--text)' }}>5</div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Key residues</div>
              </div>
              <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: 'var(--text-4)', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                From Dry Lab · 4NQ-B docking · Pose 1/9
              </div>
            </div>

            <p style={{ marginBottom: '16px', color: 'var(--text-2)' }}>
              The regulatory landscape for nanomaterial safety assessment is evolving rapidly, yet the experimental models employed in toxicological studies have not kept pace with the diversity of nanomaterial compositions and surface functionalization strategies now in clinical development{' '}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '12px',
                padding: '1px 7px',
                borderRadius: '20px',
                background: 'var(--teal-soft)',
                color: 'var(--teal)',
                border: '1px solid rgba(78,205,196,0.3)',
                fontFamily: 'var(--font-geist-sans)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <BookOpen size={10} /> 3
              </span>.
            </p>

            {/* Inline stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              margin: '24px 0',
            }}
            contentEditable={false}
            >
              {[
                { v: '847', l: 'Studies analyzed' },
                { v: '23', l: 'Nanomaterial classes' },
                { v: '3.4×', l: 'Cytotox underestimation' },
                { v: '2015–24', l: 'Publication range' },
              ].map(({ v, l }) => (
                <div key={l} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 200, color: 'var(--teal)' }}>{v}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        gridColumn: '3',
        gridRow: '2',
        borderLeft: rpOpen && !zenMode ? '1px solid var(--line)' : 'none',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {rpOpen && !zenMode && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
              {(['journals', 'reviewer', 'refs'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveRpTab(tab)}
                  style={{
                    flex: 1,
                    padding: '11px 6px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeRpTab === tab ? '2px solid var(--teal)' : '2px solid transparent',
                    color: activeRpTab === tab ? 'var(--teal)' : 'var(--text-3)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    marginBottom: '-1px',
                  }}
                >
                  {tab === 'journals' ? <><FileText size={11} style={{ display: 'inline', marginRight: '4px' }} />Journals</> :
                   tab === 'reviewer' ? <><Eye size={11} style={{ display: 'inline', marginRight: '4px' }} />Reviewer</> :
                   <><BookOpen size={11} style={{ display: 'inline', marginRight: '4px' }} />Refs</>}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {/* Journals */}
              {activeRpTab === 'journals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>
                    Journal match based on your manuscript content and field
                  </div>
                  {JOURNALS.map(j => (
                    <div key={j.name} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>{j.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={10} style={{ color: 'var(--warn)' }} fill="var(--warn)" />
                          <span style={{ fontSize: '11px', color: 'var(--warn)' }}>{j.score}</span>
                        </div>
                      </div>
                      <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px', marginBottom: '6px' }}>
                        <div style={{ height: '100%', width: `${j.score}%`, background: 'var(--teal)', borderRadius: '2px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-4)' }}>
                        <span>Fit: {j.fit}</span>
                        <span>IF: {j.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviewer */}
              {activeRpTab === 'reviewer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>
                    Simulated peer review based on your manuscript
                  </div>
                  {REVIEWER_COMMENTS.map((c, i) => {
                    const cfg = commentConfig[c.type as keyof typeof commentConfig];
                    return (
                      <div key={i} style={{ background: 'var(--surface-2)', border: `1px solid ${cfg.color}33`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: `${cfg.color}22`, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{c.section}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55 }}>{c.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Refs */}
              {activeRpTab === 'refs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>3 references auto-compiled</span>
                    <button style={{ fontSize: '11px', color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer' }}>Export BibTeX</button>
                  </div>
                  {REFS.map(r => (
                    <div key={r.num} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)', flexShrink: 0 }}>[{r.num}]</span>
                        <div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.4, marginBottom: '4px' }}>{r.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{r.authors} · {r.journal} · {r.year}</div>
                          <div style={{ fontSize: '11px', color: 'var(--teal)', marginTop: '4px' }}>doi:{r.doi}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Selection toolbar */}
      {selectionToolbar && (
        <div style={{
          position: 'fixed',
          left: selectionToolbar.x,
          top: selectionToolbar.y,
          transform: 'translate(-50%, -100%)',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          gap: '2px',
          padding: '4px',
          zIndex: 50,
          animation: 'fade-in 0.1s ease',
        }}>
          {[
            { icon: <Bold size={13} />, cmd: 'bold' },
            { icon: <Italic size={13} />, cmd: 'italic' },
            { icon: <BookOpen size={13} />, cmd: '' },
          ].map(({ icon, cmd }, i) => (
            <button
              key={i}
              onClick={() => cmd && execCmd(cmd)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-2)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function tbtnStyle(active: boolean): React.CSSProperties {
  return {
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    border: 'none',
    background: active ? 'var(--teal-soft)' : 'transparent',
    color: active ? 'var(--teal)' : 'var(--text-3)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    transition: 'all 0.1s',
  };
}
