'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight, Copy, Download, Sparkles,
  ChevronDown, Check, AlertCircle, X, FileText,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'English',               native: 'English' },
  { code: 'Bahasa Indonesia',      native: 'Bahasa Indonesia' },
  { code: 'Chinese (Simplified)',  native: '中文 (简体)' },
  { code: 'Chinese (Traditional)', native: '中文 (繁體)' },
  { code: 'Japanese',              native: '日本語' },
  { code: 'Korean',                native: '한국어' },
  { code: 'Arabic',                native: 'العربية' },
  { code: 'French',                native: 'Français' },
  { code: 'German',                native: 'Deutsch' },
  { code: 'Spanish',               native: 'Español' },
  { code: 'Portuguese',            native: 'Português' },
  { code: 'Russian',               native: 'Русский' },
  { code: 'Dutch',                 native: 'Nederlands' },
  { code: 'Italian',               native: 'Italiano' },
  { code: 'Turkish',               native: 'Türkçe' },
  { code: 'Hindi',                 native: 'हिन्दी' },
  { code: 'Malay',                 native: 'Bahasa Melayu' },
];

const RTL = new Set(['Arabic', 'Hebrew', 'Persian', 'Urdu']);
const MAX_WORDS = 5000;

function countWords(t: string) {
  return t.trim() ? t.trim().split(/\s+/).length : 0;
}

/* ─── Language dropdown ─────────────────────────────────── */
function LangSelect({ value, onChange, exclude }: {
  value: string; onChange: (v: string) => void; exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opts = LANGUAGES.filter(l => l.code !== exclude);
  const cur = LANGUAGES.find(l => l.code === value);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} className="ls-wrap">
      <button className="ls-btn" onClick={() => setOpen(v => !v)}>
        <span className="ls-cur">{cur?.native ?? value}</span>
        <ChevronDown size={13} strokeWidth={1.5}
          style={{ color: 'var(--text-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="ls-dropdown">
          {opts.map(l => (
            <button key={l.code} className={`ls-opt${l.code === value ? ' active' : ''}`}
              onClick={() => { onChange(l.code); setOpen(false); }}>
              <span className="ls-native">{l.native}</span>
              <span className="ls-en">{l.code !== l.native ? l.code : ''}</span>
              {l.code === value && <Check size={12} strokeWidth={2} style={{ color: 'var(--teal)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function TranslationPage() {
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Bahasa Indonesia');
  const [sourceText, setSourceText] = useState('');
  const [translated, setTranslated]   = useState('');
  const [translatedWC, setTranslatedWC] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const srcWC   = countWords(sourceText);
  const overLimit = srcWC > MAX_WORDS;
  const canGo   = sourceText.trim().length > 0 && !overLimit && status !== 'loading';

  function swap() {
    const pl = sourceLang, tl = targetLang, pt = sourceText, tt = translated;
    setSourceLang(tl); setTargetLang(pl);
    if (tt) { setSourceText(tt); setTranslated(pt); }
  }

  const go = useCallback(async () => {
    if (!canGo) return;
    setStatus('loading'); setTranslated(''); setErrMsg('');
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, sourceLang, targetLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Translation failed');
      setTranslated(data.translated);
      setTranslatedWC(data.translatedWordCount ?? countWords(data.translated));
      setStatus('done');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Translation failed');
      setStatus('error');
    }
  }, [canGo, sourceText, sourceLang, targetLang]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') go(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  function copyText() {
    if (!translated) return;
    navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function downloadTxt() {
    if (!translated) return;
    const blob = new Blob([translated], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `translation-${targetLang.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
  }

  const isRTL = RTL.has(targetLang);
  const pct   = Math.min((srcWC / MAX_WORDS) * 100, 100);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="tl-root">

        {/* ── Header ── */}
        <div className="tl-hd">
          <div>
            <div className="tl-eyebrow"><span className="tl-dot" /> Translation Engine</div>
            <h1 className="tl-title">Translate <em>anything</em> precisely.</h1>
          </div>
          <button className={`tl-go${canGo ? '' : ' off'}`} onClick={go} disabled={!canGo}>
            {status === 'loading'
              ? <><span className="tl-spin" /> Translating…</>
              : <><Sparkles size={14} strokeWidth={1.5} /> Translate</>}
          </button>
        </div>

        {/* ── Lang bar ── */}
        <div className="tl-lang-bar">
          <LangSelect value={sourceLang} onChange={setSourceLang} exclude={targetLang} />
          <button className="tl-swap" onClick={swap} title="Swap languages">
            <ArrowLeftRight size={14} strokeWidth={1.5} />
          </button>
          <LangSelect value={targetLang} onChange={setTargetLang} exclude={sourceLang} />
          <div className="tl-hint"><kbd>⌘</kbd><kbd>↵</kbd></div>
        </div>

        {/* ── Panes ── */}
        <div className="tl-panes">

          {/* Source */}
          <div className="tl-pane">
            <div className="tl-pane-bar">
              <span className="tl-lbl">Source · {sourceLang}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {sourceText && (
                  <button className="tl-icon" onClick={() => { setSourceText(''); setTranslated(''); setStatus('idle'); }} title="Clear">
                    <X size={12} strokeWidth={1.5} />
                  </button>
                )}
                <span className={`tl-wc${overLimit ? ' red' : srcWC > MAX_WORDS * 0.85 ? ' amber' : ''}`}>
                  {srcWC.toLocaleString()}<span className="tl-wc-of"> / {MAX_WORDS.toLocaleString()}</span>
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="tl-prog-wrap">
              <div className={`tl-prog${overLimit ? ' red' : ''}`} style={{ width: pct + '%' }} />
            </div>
            <textarea
              className="tl-ta"
              placeholder={"Paste your abstract, methods section, or any academic text here…\n\nCitations [1], units (nm, kDa, °C), and formatting are preserved exactly."}
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              spellCheck={false}
            />
            {overLimit && (
              <div className="tl-warn">
                <AlertCircle size={12} strokeWidth={1.5} />
                {(srcWC - MAX_WORDS).toLocaleString()} words over limit
              </div>
            )}
          </div>

          <div className="tl-vdiv" />

          {/* Output */}
          <div className="tl-pane">
            <div className="tl-pane-bar">
              <span className="tl-lbl">Translation · {targetLang}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {status === 'done' && <span className="tl-wc">{translatedWC.toLocaleString()} words</span>}
                <button className={`tl-action${copied ? ' active' : ''}`} onClick={copyText} disabled={!translated}>
                  {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={1.5} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button className="tl-action" onClick={downloadTxt} disabled={!translated}>
                  <Download size={12} strokeWidth={1.5} /> .txt
                </button>
              </div>
            </div>
            <div className="tl-prog-wrap" />

            <div className="tl-out" dir={isRTL ? 'rtl' : 'ltr'}>
              {status === 'idle' && (
                <div className="tl-empty">
                  <FileText size={28} strokeWidth={0.8} style={{ opacity: 0.18 }} />
                  <span>Translation will appear here.</span>
                  <span className="tl-empty-sub">
                    Academic terminology · citations · structure — all preserved.
                    <br />Up to {MAX_WORDS.toLocaleString()} words per request.
                  </span>
                </div>
              )}
              {status === 'loading' && (
                <div className="tl-skels">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="tl-sk" style={{ width: `${52 + (i * 19) % 40}%` }} />
                  ))}
                </div>
              )}
              {status === 'error' && (
                <div className="tl-err">
                  <AlertCircle size={15} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>Translation failed</div>
                    <div style={{ fontSize: 12, marginTop: 3, opacity: 0.75 }}>{errMsg}</div>
                  </div>
                </div>
              )}
              {status === 'done' && <p className="tl-result">{translated}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── CSS ────────────────────────────────────────────────── */
const CSS = `
.tl-root {
  display: flex; flex-direction: column;
  height: 100%; padding: 22px 28px 20px; gap: 14px;
  overflow: hidden; min-height: 0; background: var(--bg);
}

/* Header */
.tl-hd { display: flex; align-items: flex-end; justify-content: space-between; }
.tl-eyebrow {
  font-family: var(--font-geist-mono,monospace); font-size: 10.5px;
  letter-spacing: 0.26em; text-transform: uppercase;
  color: var(--text-3); display: flex; align-items: center; gap: 9px; margin-bottom: 6px;
}
.tl-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--teal); flex-shrink: 0;
  box-shadow: 0 0 0 0 rgba(78,205,196,.55); animation: tl-pulse 2.4s ease-out infinite;
}
@keyframes tl-pulse {
  0%  { box-shadow: 0 0 0 0   rgba(78,205,196,.55); }
  70% { box-shadow: 0 0 0 9px rgba(78,205,196,0); }
  100%{ box-shadow: 0 0 0 0   rgba(78,205,196,0); }
}
.tl-title {
  font-size: 28px; font-weight: 200; letter-spacing: -0.025em;
  color: var(--text); line-height: 1;
}
.tl-title em { font-style: italic; color: var(--text-2); }
.tl-go {
  appearance: none; cursor: pointer; flex-shrink: 0;
  background: var(--teal); border: none; border-radius: 12px;
  color: #0B3B38; font-size: 13.5px; font-family: inherit; font-weight: 500;
  padding: 11px 22px; display: inline-flex; align-items: center; gap: 8px;
  transition: background 0.15s, opacity 0.15s;
}
.tl-go.off { opacity: 0.42; cursor: not-allowed; }
.tl-go:not(.off):hover { background: var(--teal-deep); }

/* Lang bar */
.tl-lang-bar {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 14px; padding: 6px 10px;
}
.ls-wrap { flex: 1; position: relative; }
.ls-btn {
  width: 100%; appearance: none; background: transparent; border: none;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 9px; transition: background 0.15s;
}
.ls-btn:hover { background: var(--bg); }
.ls-cur { font-size: 14px; font-weight: 300; color: var(--text); flex: 1; text-align: left; }
.ls-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 50;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; padding: 5px;
  min-width: 220px; max-height: 300px; overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.24);
}
.ls-opt {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 10px; border: none;
  background: transparent; color: var(--text);
  font-size: 13px; cursor: pointer; border-radius: 7px;
  text-align: left; transition: background 0.1s;
}
.ls-opt:hover { background: var(--surface-2); }
.ls-opt.active { background: var(--teal-soft); color: var(--teal); }
.ls-native { flex: 1; font-weight: 300; }
.ls-en { font-size: 11px; color: var(--text-4); font-family: var(--font-geist-mono,monospace); }
.tl-swap {
  appearance: none; background: var(--bg); border: 1px solid var(--line);
  border-radius: 9px; color: var(--text-3); cursor: pointer; flex-shrink: 0;
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s, transform 0.22s;
}
.tl-swap:hover { background: var(--surface-2); color: var(--text); transform: rotate(180deg); }
.tl-hint {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-geist-mono,monospace); font-size: 10.5px; color: var(--text-4);
  padding-left: 8px; border-left: 1px solid var(--line); margin-left: 2px; white-space: nowrap;
}
.tl-hint kbd {
  background: var(--bg); border: 1px solid var(--line); border-radius: 4px;
  padding: 2px 5px; font-size: 10px; color: var(--text-3);
}

/* Panes */
.tl-panes {
  display: grid; grid-template-columns: 1fr 1px 1fr;
  flex: 1; min-height: 0;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 16px; overflow: hidden;
}
.tl-vdiv { background: var(--line); }
.tl-pane { display: flex; flex-direction: column; min-height: 0; }
.tl-pane-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px 10px; flex-shrink: 0;
  border-bottom: 1px solid var(--line-soft);
}
.tl-lbl {
  font-family: var(--font-geist-mono,monospace); font-size: 10px;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--text-4);
}
.tl-wc {
  font-family: var(--font-geist-mono,monospace); font-size: 11px;
  color: var(--text-4); font-variant-numeric: tabular-nums;
}
.tl-wc.red { color: var(--red); }
.tl-wc.amber { color: var(--amber,#F59E0B); }
.tl-wc-of { opacity: 0.45; }
.tl-icon {
  appearance: none; background: transparent; border: 1px solid transparent;
  border-radius: 6px; color: var(--text-4); cursor: pointer;
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.tl-icon:hover { background: var(--surface-2); color: var(--text-2); border-color: var(--line); }
.tl-action {
  appearance: none; background: var(--bg); border: 1px solid var(--line);
  border-radius: 7px; cursor: pointer; color: var(--text-3);
  font-size: 11.5px; font-family: inherit;
  padding: 4px 9px; display: inline-flex; align-items: center; gap: 4px;
  transition: all 0.15s;
}
.tl-action:not(:disabled):hover { background: var(--surface-2); color: var(--text); }
.tl-action:disabled { opacity: 0.3; cursor: not-allowed; }
.tl-action.active { background: var(--teal-soft); color: var(--teal); border-color: rgba(78,205,196,0.4); }

/* Progress bar */
.tl-prog-wrap {
  height: 2px; background: var(--line-soft); flex-shrink: 0;
  position: relative; overflow: hidden;
}
.tl-prog {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: var(--teal); transition: width 0.3s;
  border-radius: 0 2px 2px 0;
}
.tl-prog.red { background: var(--red); }

/* Textarea */
.tl-ta {
  flex: 1; resize: none; border: none; outline: none; background: transparent;
  padding: 16px 20px; font-family: inherit; font-size: 14px;
  color: var(--text); line-height: 1.78; font-weight: 300; min-height: 0;
}
.tl-ta::placeholder { color: var(--text-4); line-height: 1.78; white-space: pre; }
.tl-warn {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  font-size: 11.5px; color: var(--red); padding: 6px 20px 12px;
  font-family: var(--font-geist-mono,monospace);
}

/* Output */
.tl-out { flex: 1; overflow: auto; padding: 18px 20px; min-height: 0; }
.tl-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100%; gap: 12px; color: var(--text-4); text-align: center;
}
.tl-empty span { font-size: 13.5px; }
.tl-empty-sub {
  font-size: 11.5px !important; font-family: var(--font-geist-mono,monospace);
  letter-spacing: 0.04em; opacity: 0.65; max-width: 34ch;
  line-height: 1.6; margin-top: 2px;
}
.tl-skels { display: flex; flex-direction: column; gap: 12px; padding-top: 4px; }
.tl-sk {
  height: 14px; border-radius: 6px;
  background: linear-gradient(90deg,var(--skeleton-1) 0%,var(--skeleton-2) 40%,var(--skeleton-1) 80%);
  background-size: 240% 100%; animation: shimmer 1.6s linear infinite;
}
.tl-err {
  display: flex; align-items: flex-start; gap: 10px;
  color: var(--red); font-size: 13px; line-height: 1.55;
  background: rgba(229,86,75,0.07); border: 1px solid rgba(229,86,75,0.18);
  border-radius: 10px; padding: 14px 16px;
}
.tl-result {
  font-size: 14px; line-height: 1.8; color: var(--text);
  font-weight: 300; white-space: pre-wrap; margin: 0;
}

/* Spinner */
.tl-spin {
  display: inline-block; width: 13px; height: 13px; flex-shrink: 0;
  border: 2px solid rgba(11,59,56,0.25); border-top-color: #0B3B38;
  border-radius: 50%; animation: tl-rotate 0.7s linear infinite;
}
@keyframes tl-rotate { to { transform: rotate(360deg); } }

@media (max-width: 820px) {
  .tl-panes { grid-template-columns: 1fr; grid-template-rows: 1fr 1px 1fr; }
  .tl-vdiv  { width: 100%; }
  .tl-hint  { display: none; }
  .tl-title { font-size: 22px; }
}
`;
