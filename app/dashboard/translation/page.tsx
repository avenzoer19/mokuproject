'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Languages, ArrowRight, Copy, Download, Upload,
  Sparkles, ChevronDown, Check, AlertTriangle, Crown,
} from 'lucide-react';

// ─────────────────────── Data ───────────────────────

const SRC_LANGS = ['Auto-detect', 'English', 'Mandarin', 'Japanese', 'German', 'French'];
const TGT_LANGS = ['Indonesian', 'English', 'Mandarin', 'Japanese', 'German', 'French'];

const LANG_FLAGS: Record<string, string> = {
  'Auto-detect': '🌐',
  English:       '🇬🇧',
  Mandarin:      '🇨🇳',
  Japanese:      '🇯🇵',
  German:        '🇩🇪',
  French:        '🇫🇷',
  Indonesian:    '🇮🇩',
};

const PLACEHOLDER_SOURCE =
`Electrospinning has emerged as a versatile and scalable technique for the fabrication of nanofibrous scaffolds with diameters ranging from tens to several hundred nanometers. Polycaprolactone (PCL) and polyvinylpyrrolidone (PVP) composite fibers demonstrate exceptional biocompatibility and tunable mechanical properties, making them highly suitable for applications in tissue engineering and controlled drug delivery. Surface functionalization strategies, including UV crosslinking at 365 nm and chemical conjugation of targeting ligands, further expand the functional repertoire of electrospun membranes.

In the present study, we investigated the synergistic effects of PCL:PVP weight ratios (70:30, 60:40, and 50:50) on fiber morphology, hydrophilicity, and in vitro drug release kinetics of paclitaxel-loaded scaffolds. Scanning electron microscopy revealed uniform fiber diameters of 312 ± 42 nm for the 70:30 formulation. Water contact angle measurements demonstrated progressive hydrophilization from 132° (pure PCL) to 84° (70:30 blend), consistent with prior literature. Sustained paclitaxel release over 21 days was observed, following a biphasic profile characteristic of diffusion-mediated transport from polymeric matrices.`;

const PLACEHOLDER_TRANSLATION =
`Elektrospinning telah berkembang sebagai teknik serbaguna dan dapat diskalakan untuk fabrikasi perancah berserat nano dengan diameter berkisar dari puluhan hingga beberapa ratus nanometer. Serat komposit polikaprolakton (PCL) dan polivinilpirolidon (PVP) menunjukkan biokompatibilitas yang luar biasa dan sifat mekanik yang dapat disesuaikan, menjadikannya sangat cocok untuk aplikasi dalam rekayasa jaringan dan pengiriman obat terkontrol. Strategi fungsionalisasi permukaan, termasuk penaut-silang UV pada 365 nm dan konjugasi kimia ligan penargetan, semakin memperluas repertoar fungsional membran elektrospun.

Dalam penelitian ini, kami menyelidiki efek sinergis rasio berat PCL:PVP (70:30, 60:40, dan 50:50) terhadap morfologi serat, hidrofilisitas, dan kinetika pelepasan obat paklitaksel secara in vitro dari perancah yang dimuat. Mikroskopi elektron pemindaian mengungkapkan diameter serat seragam sebesar 312 ± 42 nm untuk formulasi 70:30. Pengukuran sudut kontak air menunjukkan hidrofilisasi progresif dari 132° (PCL murni) menjadi 84° (campuran 70:30), konsisten dengan literatur sebelumnya. Pelepasan paklitaksel berkelanjutan selama 21 hari diamati, mengikuti profil bifasik yang merupakan ciri transpor yang dimediasi difusi dari matriks polimerik.`;

const INITIAL_CREDITS = 4500;

// ─────────────────────── Skeleton ───────────────────────

function SkeletonLines() {
  const rows = [1, 0.92, 0.97, 0.74, 0.88, 0.62, 1, 0.90, 0.95, 0.68];
  return (
    <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {rows.map((w, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: '14px', borderRadius: '5px', width: `${w * 100}%`, opacity: 0.7 - i * 0.025 }}
        />
      ))}
      <div style={{ height: '14px' }} />
      {[0.94, 0.86, 0.97, 0.72, 0.80].map((w, i) => (
        <div
          key={`b${i}`}
          className="skeleton"
          style={{ height: '14px', borderRadius: '5px', width: `${w * 100}%`, opacity: 0.65 - i * 0.025 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────── Language dropdown ───────────────────────

function LangSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          height: '38px', padding: '0 12px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: '10px', color: 'var(--text)', fontSize: '13.5px',
          cursor: 'pointer', transition: 'border-color 0.15s',
          minWidth: '152px',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
      >
        <span style={{ fontSize: '15px' }}>{LANG_FLAGS[value] ?? '🌐'}</span>
        <span style={{ flex: 1, textAlign: 'left', fontWeight: 400 }}>{value}</span>
        <ChevronDown
          size={14}
          style={{ color: 'var(--text-4)', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '42px', left: 0, zIndex: 40,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: '12px', padding: '5px',
          minWidth: '180px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        }}>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '8px 10px', border: 'none',
                background: value === opt ? 'var(--teal-soft)' : 'transparent',
                color: value === opt ? 'var(--teal)' : 'var(--text)',
                fontSize: '13px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (value !== opt) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; } }}
              onMouseLeave={e => { if (value !== opt) { (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{LANG_FLAGS[opt] ?? '🌐'}</span>
              <span style={{ flex: 1 }}>{opt}</span>
              {value === opt && <Check size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────── Page ───────────────────────

export default function TranslationPage() {
  const [srcLang, setSrcLang]           = useState('Auto-detect');
  const [tgtLang, setTgtLang]           = useState('Indonesian');
  const [sourceText, setSourceText]     = useState(PLACEHOLDER_SOURCE);
  const [translated, setTranslated]     = useState(PLACEHOLDER_TRANSLATION);
  const [isTranslating, setTranslating] = useState(false);
  const [credits, setCredits]           = useState(INITIAL_CREDITS);
  const [copied, setCopied]             = useState(false);

  const wordCount      = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const transWordCount = translated.trim() ? translated.trim().split(/\s+/).length : 0;
  const creditsLow     = credits > 0 && credits < 500;
  const creditsEmpty   = credits === 0;

  const handleTranslate = async () => {
    if (creditsEmpty || isTranslating || !sourceText.trim()) return;
    setTranslating(true);
    const wordsUsed = wordCount;
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, from: srcLang, to: tgtLang }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslated(data.translation ?? PLACEHOLDER_TRANSLATION);
      } else {
        setTranslated(PLACEHOLDER_TRANSLATION);
      }
      setCredits(c => Math.max(0, c - wordsUsed));
    } catch {
      setTranslated(PLACEHOLDER_TRANSLATION);
      setCredits(c => Math.max(0, c - wordsUsed));
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translated).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const creditsColor = creditsEmpty ? 'var(--red)' : creditsLow ? '#F59E0B' : 'var(--text-2)';
  const creditsBorder = creditsEmpty ? 'rgba(229,86,75,0.3)' : creditsLow ? 'rgba(245,158,11,0.3)' : 'var(--line)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.07em', marginBottom: '10px', textTransform: 'uppercase' }}>
          <span>Moku</span>
          <span>›</span>
          <span style={{ color: 'var(--text-2)' }}>Translation Engine</span>
        </div>

        {/* Title + Credits row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '21px', fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.022em', margin: 0, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Languages size={20} style={{ color: 'var(--teal)' }} />
              Native AI <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>Translation</em>
            </h1>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '3px' }}>
              Scientific terminology-aware · paragraph structure preserved · domain-calibrated
            </div>
          </div>

          {/* Credits counter */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px',
            background: 'var(--surface)', border: `1px solid ${creditsBorder}`,
            borderRadius: '11px', transition: 'border-color 0.3s',
          }}>
            {(creditsLow || creditsEmpty) && (
              <AlertTriangle size={13} style={{ color: creditsColor, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-geist-mono)', color: creditsColor, whiteSpace: 'nowrap' }}>
              {creditsEmpty ? 'No credits left' : `${credits.toLocaleString()} words remaining`}
            </span>
            <span style={{ width: '1px', height: '14px', background: 'var(--line)', display: 'inline-block' }} />
            <button style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '12.5px', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500, transition: 'opacity 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              <Crown size={12} /> Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* ── Credits warning banners ── */}
      {creditsLow && (
        <div style={{ margin: '0 22px 10px', padding: '10px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: '10px', fontSize: '12.5px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <AlertTriangle size={13} />
          Running low on credits.{' '}
          <button style={{ background: 'none', border: 'none', color: '#F59E0B', fontSize: '12.5px', cursor: 'pointer', padding: 0, fontWeight: 600, textDecoration: 'underline' }}>
            Upgrade for unlimited translation.
          </button>
        </div>
      )}
      {creditsEmpty && (
        <div style={{ margin: '0 22px 10px', padding: '14px 18px', background: 'rgba(229,86,75,0.07)', border: '1px solid rgba(229,86,75,0.28)', borderRadius: '12px', flexShrink: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--red)', marginBottom: '4px' }}>
            You&apos;ve used all your translation credits.
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Upgrade to <strong style={{ color: 'var(--text)' }}>Moku Pro</strong> to continue translating scientific documents without limits.
          </div>
        </div>
      )}

      {/* ── Language selector bar ── */}
      <div style={{ padding: '0 22px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <LangSelect value={srcLang} options={SRC_LANGS} onChange={setSrcLang} />

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px' }}>
          <ArrowRight size={16} style={{ color: 'var(--text-4)' }} />
        </div>

        <LangSelect value={tgtLang} options={TGT_LANGS} onChange={setTgtLang} />

        <button
          onClick={handleTranslate}
          disabled={creditsEmpty || isTranslating || !sourceText.trim()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            height: '38px', padding: '0 20px',
            background: creditsEmpty ? 'var(--surface-3)' : 'var(--teal)',
            border: 'none', borderRadius: '10px',
            color: creditsEmpty ? 'var(--text-4)' : '#0B3B38',
            fontSize: '13.5px', fontWeight: 600,
            cursor: (creditsEmpty || isTranslating) ? 'not-allowed' : 'pointer',
            opacity: (creditsEmpty || isTranslating) ? 0.65 : 1,
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { if (!creditsEmpty && !isTranslating) { (e.currentTarget as HTMLElement).style.opacity = '0.86'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={e => { if (!creditsEmpty && !isTranslating) { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; } }}
        >
          <Sparkles size={14} style={{ animation: isTranslating ? 'spin 1.4s linear infinite' : 'none' }} />
          {isTranslating ? 'Translating…' : 'Translate'}
        </button>
      </div>

      {/* ── Split view ── */}
      <div
        className="translation-grid"
        style={{
          flex: 1, minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '0 22px 22px',
        }}
      >
        {/* ── Source panel ── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: '16px', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', minHeight: 0,
        }}>
          {/* Panel header */}
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Original Document
            </span>
          </div>

          {/* Textarea */}
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="Paste scientific text or upload PDF…"
            style={{
              flex: 1, width: '100%', boxSizing: 'border-box',
              background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', padding: '16px 18px',
              color: 'var(--text)', fontSize: '13.5px',
              lineHeight: 1.75, fontFamily: 'inherit',
            }}
          />

          {/* Footer */}
          <div style={{ padding: '9px 14px', borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '8px' }}>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '8px',
                background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--text-3)', fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
            >
              <Upload size={12} /> Upload PDF
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)' }}>
              {wordCount.toLocaleString()} words
            </span>
          </div>
        </div>

        {/* ── Translation panel ── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: '16px', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', minHeight: 0,
        }}>
          {/* Panel header */}
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Translation
              <span style={{ fontSize: '14px' }}>{LANG_FLAGS[tgtLang] ?? ''}</span>
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Copy */}
              <button
                onClick={handleCopy}
                disabled={!translated.trim()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '7px',
                  background: copied ? 'var(--teal-soft)' : 'transparent',
                  border: `1px solid ${copied ? 'rgba(78,205,196,0.4)' : 'var(--line)'}`,
                  color: copied ? 'var(--teal)' : 'var(--text-3)',
                  fontSize: '11.5px', cursor: 'pointer', transition: 'all 0.15s',
                  opacity: !translated.trim() ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!copied && translated.trim()) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; } }}
                onMouseLeave={e => { if (!copied) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; } }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {/* Download */}
              <button
                disabled={!translated.trim()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '7px',
                  background: 'transparent', border: '1px solid var(--line)',
                  color: 'var(--text-3)', fontSize: '11.5px', cursor: 'pointer',
                  transition: 'all 0.15s', opacity: !translated.trim() ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (translated.trim()) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
              >
                <Download size={12} /> .docx
              </button>
            </div>
          </div>

          {/* Content — skeleton or translation */}
          {isTranslating ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SkeletonLines />
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
              {translated ? (
                <p style={{ color: 'var(--text)', fontSize: '13.5px', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {translated}
                </p>
              ) : (
                <p style={{ color: 'var(--text-4)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                  Translation will appear here after you click Translate.
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '9px 14px', borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)' }}>
              {transWordCount.toLocaleString()} words
            </span>
          </div>
        </div>
      </div>

      {/* ── Mobile responsive styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .translation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
