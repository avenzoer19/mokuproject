'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, SlidersHorizontal, Plus, Calendar, BookMarked, Atom, Quote,
  Unlock, Highlighter, ChevronDown, ChevronUp, Minus, List, Download, Upload,
  FileText, Bookmark, BookmarkCheck, MoreHorizontal, FlaskConical, Layers,
  BarChart3, ArrowUpRight, Check, Sparkles, MessageSquareText, Link2, X, AlertCircle,
} from 'lucide-react';
import { usePapers, PaperWithTags } from '@/lib/hooks/usePapers';
import { useUser } from '@/lib/hooks/useUser';
import { createClient } from '@/lib/supabase/client';

/* ─── Garuda type ────────────────────────────────────────────── */
interface GarudaResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publisher: string;
  abstract: string;
  doi: string | null;
  year: number | null;
  detailUrl: string;
  downloadUrl: string | null;
}

/* ─── ArXiv types & feed parser ──────────────────────────────── */
interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  year: number | null;
  authors: string[];
  categories: string[];
}

function parseArxivFeed(xml: string): ArxivPaper[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const NS = 'http://www.w3.org/2005/Atom';
  return Array.from(doc.getElementsByTagNameNS(NS, 'entry')).map(e => {
    const text = (tag: string) => e.getElementsByTagNameNS(NS, tag)[0]?.textContent?.trim() ?? '';
    const rawId = text('id');
    const id = rawId.split('/abs/').pop()?.replace(/v\d+$/, '') ?? rawId;
    const published = text('published');
    const authors = Array.from(e.getElementsByTagNameNS(NS, 'author'))
      .map(a => a.getElementsByTagNameNS(NS, 'name')[0]?.textContent?.trim() ?? '')
      .filter(Boolean);
    const categories = Array.from(e.getElementsByTagNameNS(NS, 'category'))
      .map(c => c.getAttribute('term') ?? '').filter(Boolean);
    return {
      id,
      title: text('title').replace(/\s+/g, ' '),
      summary: text('summary').replace(/\s+/g, ' '),
      year: published ? parseInt(published.slice(0, 4)) : null,
      authors,
      categories,
    };
  });
}

/* ─── Import Paper Modal ──────────────────────────────────────── */
function ImportPaperModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (data: { title: string; authors: string; year: number | null; journal: string; doi: string; abstract: string; citation_count: number | null; file: File | null }) => Promise<void>;
}) {
  const [tab, setTab] = useState<'arxiv' | 'garuda' | 'manual'>('arxiv');

  /* arXiv state */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArxivPaper[]>([]);
  const [arxivStatus, setArxivStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [importing, setImporting] = useState<string | null>(null);

  /* Garuda state */
  const [garudaQuery, setGarudaQuery] = useState('');
  const [garudaResults, setGarudaResults] = useState<GarudaResult[]>([]);
  const [garudaStatus, setGarudaStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [garudaImporting, setGarudaImporting] = useState<string | null>(null);

  /* Manual form state */
  const [form, setForm] = useState({ title: '', authors: '', year: '', journal: '', doi: '', abstract: '', citation_count: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState('');
  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleArxivSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setArxivStatus('loading');
    setResults([]);
    try {
      const isId = /^\d{4}\.\d{4,5}(v\d+)?$/.test(q);
      const searchQ = isId ? `id:${q}` : `all:${q}`;
      const res = await fetch(`/api/arxiv?q=${encodeURIComponent(searchQ)}&max=8`);
      if (!res.ok) throw new Error();
      setResults(parseArxivFeed(await res.text()));
      setArxivStatus('done');
    } catch {
      setArxivStatus('error');
    }
  }

  async function handleArxivImport(paper: ArxivPaper) {
    setImporting(paper.id);
    try {
      await onImport({
        title: paper.title,
        authors: paper.authors.join(', '),
        year: paper.year,
        journal: paper.categories[0] ?? '',
        doi: `arxiv:${paper.id}`,
        abstract: paper.summary,
        citation_count: null,
        file: null,
      });
      onClose();
    } catch {
      setImporting(null);
    }
  }

  async function handleGarudaSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = garudaQuery.trim();
    if (!q) return;
    setGarudaStatus('loading');
    setGarudaResults([]);
    try {
      const res = await fetch(`/api/garuda?q=${encodeURIComponent(q)}&max=8`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Garuda search failed');
      setGarudaResults(data.results ?? []);
      setGarudaStatus('done');
    } catch (e) {
      setGarudaStatus('error');
    }
  }

  async function handleGarudaImport(r: GarudaResult) {
    setGarudaImporting(r.id);
    try {
      await onImport({
        title: r.title,
        authors: r.authors.join(', '),
        year: r.year,
        journal: r.journal,
        doi: r.doi ?? `garuda:${r.id}`,
        abstract: r.abstract,
        citation_count: null,
        file: null,
      });
      onClose();
    } catch {
      setGarudaImporting(null);
    }
  }

  async function extractMetadata(fileOverride?: File) {
    const file = fileOverride ?? pdfFile;
    if (!file || extracting) return;
    setExtracting(true);
    setExtractErr('');
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const res = await fetch('/api/papers/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed');
      const filled = new Set<string>();
      setForm(prev => {
        const next = { ...prev };
        if (data.title)    { next.title          = data.title;        filled.add('title'); }
        if (data.authors)  { next.authors         = data.authors;      filled.add('authors'); }
        if (data.year)     { next.year            = String(data.year); filled.add('year'); }
        if (data.journal)  { next.journal         = data.journal;      filled.add('journal'); }
        if (data.doi)      { next.doi             = data.doi;          filled.add('doi'); }
        if (data.abstract) { next.abstract        = data.abstract;     filled.add('abstract'); }
        return next;
      });
      setFilledFields(filled);
      setTimeout(() => setFilledFields(new Set()), 3500);
    } catch (e) {
      setExtractErr(e instanceof Error ? e.message : 'Extraction failed');
    }
    setExtracting(false);
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setSavingMsg(pdfFile ? 'Saving paper…' : 'Adding to library…');
    try {
      await onImport({
        title: form.title.trim(),
        authors: form.authors.trim() || '',
        year: form.year ? parseInt(form.year) : null,
        journal: form.journal.trim() || '',
        doi: form.doi.trim() || '',
        abstract: form.abstract.trim() || '',
        citation_count: form.citation_count ? parseInt(form.citation_count) : null,
        file: pdfFile,
      });
      onClose();
    } catch { setError('Failed to save. Please try again.'); setSaving(false); }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '24px 24px 20px', width: 'min(620px, 94vw)', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '88vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 400, color: 'var(--text)' }}>Import Paper</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {tab === 'arxiv' ? 'Search arXiv database' : 'Add paper details manually'}
            </div>
          </div>
          <button onClick={onClose} style={{ appearance: 'none', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6 }}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: 3, gap: 3 }}>
          {(['arxiv', 'garuda', 'manual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, appearance: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 10px', borderRadius: 8, fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: tab === t ? 500 : 400,
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text-3)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t === 'arxiv' ? 'arXiv' : t === 'garuda' ? 'Garuda 🇮🇩' : 'Manual'}
            </button>
          ))}
        </div>

        {/* ── arXiv tab ── */}
        {tab === 'arxiv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
            <form onSubmit={handleArxivSearch} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, paddingLeft: 12, gap: 8 }}>
                <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} strokeWidth={1.5} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Title, keywords, authors, or arXiv ID…"
                  autoFocus
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', padding: '10px 12px 10px 0' }}
                />
              </div>
              <button
                type="submit"
                disabled={arxivStatus === 'loading' || !query.trim()}
                style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 10, color: '#0B3B38', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, padding: '10px 18px', cursor: 'pointer', opacity: (arxivStatus === 'loading' || !query.trim()) ? 0.6 : 1, whiteSpace: 'nowrap' }}
              >
                {arxivStatus === 'loading' ? 'Searching…' : 'Search'}
              </button>
            </form>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 200 }}>
              {arxivStatus === 'idle' && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-4)', fontSize: 13 }}>
                  Search arXiv&apos;s 2M+ open-access papers by topic, author, or arXiv ID.
                </div>
              )}
              {arxivStatus === 'loading' && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 13, borderRadius: 5, background: 'var(--skeleton-1)', width: `${65 + (i * 11) % 22}%` }} />
                  <div style={{ height: 10, borderRadius: 4, background: 'var(--skeleton-1)', width: '42%' }} />
                  <div style={{ height: 10, borderRadius: 4, background: 'var(--skeleton-1)', width: '88%' }} />
                </div>
              ))}
              {arxivStatus === 'error' && (
                <div style={{ fontSize: 13, color: 'var(--red)', background: 'rgba(229,86,75,0.08)', border: '1px solid rgba(229,86,75,0.2)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  Could not reach arXiv. Check your connection and try again.
                </div>
              )}
              {arxivStatus === 'done' && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-4)', fontSize: 13 }}>
                  No results found for &ldquo;{query}&rdquo;.
                </div>
              )}
              {results.map(paper => (
                <div key={paper.id} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--text)', lineHeight: 1.4, marginBottom: 5, overflow: 'hidden', maxHeight: '2.8em' }}>
                      {paper.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5, fontFamily: 'var(--font-geist-mono, monospace)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      <span>{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ''}</span>
                      {paper.year && <><span>·</span><span>{paper.year}</span></>}
                      {paper.categories[0] && <><span>·</span><span style={{ color: 'var(--teal)', background: 'var(--teal-soft)', padding: '1px 6px', borderRadius: 4 }}>{paper.categories[0]}</span></>}
                    </div>
                    {paper.summary && (
                      <div style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5, overflow: 'hidden', maxHeight: '3em' }}>
                        {paper.summary}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleArxivImport(paper)}
                    disabled={!!importing}
                    style={{
                      appearance: 'none', flexShrink: 0,
                      background: importing === paper.id ? 'var(--teal)' : 'var(--surface)',
                      border: '1px solid var(--line)', borderRadius: 8,
                      color: importing === paper.id ? '#0B3B38' : 'var(--text-2)',
                      fontSize: 12.5, fontFamily: 'inherit', fontWeight: 500,
                      padding: '7px 12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                      opacity: (importing && importing !== paper.id) ? 0.5 : 1,
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                  >
                    {importing === paper.id ? 'Saving…' : <><Plus size={13} strokeWidth={1.8} /> Import</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Garuda tab ── */}
        {tab === 'garuda' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
            <form onSubmit={handleGarudaSearch} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, paddingLeft: 12, gap: 8 }}>
                <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} strokeWidth={1.5} />
                <input
                  value={garudaQuery}
                  onChange={e => setGarudaQuery(e.target.value)}
                  placeholder="Judul, kata kunci, penulis, atau nama jurnal…"
                  autoFocus
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', padding: '10px 12px 10px 0' }}
                />
              </div>
              <button
                type="submit"
                disabled={garudaStatus === 'loading' || !garudaQuery.trim()}
                style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 10, color: '#0B3B38', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, padding: '10px 18px', cursor: 'pointer', opacity: (garudaStatus === 'loading' || !garudaQuery.trim()) ? 0.6 : 1, whiteSpace: 'nowrap' }}
              >
                {garudaStatus === 'loading' ? 'Mencari…' : 'Cari'}
              </button>
            </form>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 200 }}>
              {garudaStatus === 'idle' && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-4)', fontSize: 13 }}>
                  Cari jurnal ilmiah Indonesia terindeks SINTA dari database Garuda.
                </div>
              )}
              {garudaStatus === 'loading' && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 13, borderRadius: 5, background: 'var(--skeleton-1)', width: `${65 + (i * 11) % 22}%` }} />
                  <div style={{ height: 10, borderRadius: 4, background: 'var(--skeleton-1)', width: '42%' }} />
                  <div style={{ height: 10, borderRadius: 4, background: 'var(--skeleton-1)', width: '88%' }} />
                </div>
              ))}
              {garudaStatus === 'error' && (
                <div style={{ fontSize: 13, color: 'var(--red)', background: 'rgba(229,86,75,0.08)', border: '1px solid rgba(229,86,75,0.2)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  Gagal mengakses Garuda. Periksa koneksi dan coba lagi.
                </div>
              )}
              {garudaStatus === 'done' && garudaResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-4)', fontSize: 13 }}>
                  Tidak ada hasil untuk &ldquo;{garudaQuery}&rdquo;.
                </div>
              )}
              {garudaResults.map(r => (
                <div key={r.id} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--text)', lineHeight: 1.4, marginBottom: 5, overflow: 'hidden', maxHeight: '2.8em' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 4, fontFamily: 'var(--font-geist-mono, monospace)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      <span>{r.authors.slice(0, 3).join(', ')}{r.authors.length > 3 ? ` +${r.authors.length - 3}` : ''}</span>
                      {r.year && <><span>·</span><span>{r.year}</span></>}
                      {r.journal && <><span>·</span><span style={{ color: 'var(--teal)', background: 'var(--teal-soft)', padding: '1px 6px', borderRadius: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.journal}</span></>}
                    </div>
                    {r.publisher && (
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 4 }}>{r.publisher}</div>
                    )}
                    {r.abstract && (
                      <div style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5, overflow: 'hidden', maxHeight: '3em' }}>
                        {r.abstract}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
                    <button
                      onClick={() => handleGarudaImport(r)}
                      disabled={!!garudaImporting}
                      style={{
                        appearance: 'none',
                        background: garudaImporting === r.id ? 'var(--teal)' : 'var(--surface)',
                        border: '1px solid var(--line)', borderRadius: 8,
                        color: garudaImporting === r.id ? '#0B3B38' : 'var(--text-2)',
                        fontSize: 12.5, fontFamily: 'inherit', fontWeight: 500,
                        padding: '7px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        opacity: (garudaImporting && garudaImporting !== r.id) ? 0.5 : 1,
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                      }}
                    >
                      {garudaImporting === r.id ? 'Saving…' : <><Plus size={13} strokeWidth={1.8} /> Import</>}
                    </button>
                    <a
                      href={r.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--text-4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                    >
                      Garuda <ArrowUpRight size={10} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Manual tab ── */}
        {tab === 'manual' && (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(229,86,75,0.08)', border: '1px solid rgba(229,86,75,0.2)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

            {/* ── PDF upload + AI extract ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                background: 'var(--bg)', borderRadius: 10, padding: '10px 14px',
                border: `1px dashed ${pdfFile ? 'var(--teal)' : 'var(--line)'}`,
                transition: 'border-color 0.15s',
              }}>
                <FileText size={15} style={{ color: pdfFile ? 'var(--teal)' : 'var(--text-4)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: pdfFile ? 'var(--text)' : 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pdfFile ? pdfFile.name : 'Upload PDF — AI will auto-fill the form below'}
                </span>
                {pdfFile && (
                  <span style={{ fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>
                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
                {pdfFile && (
                  <button type="button"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setPdfFile(null); setExtractErr(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0, display: 'flex' }}>
                    <X size={13} />
                  </button>
                )}
                <input type="file" accept="application/pdf" style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    setPdfFile(file);
                    setExtractErr('');
                    if (file) extractMetadata(file);
                  }} />
              </label>

              {/* Inline extraction status */}
              {pdfFile && extracting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--teal)', fontFamily: 'var(--font-geist-mono,monospace)', letterSpacing: '0.06em' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(78,205,196,0.25)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'modal-spin 0.7s linear infinite', flexShrink: 0 }} />
                  Extracting metadata…
                </div>
              )}
              {pdfFile && !extracting && filledFields.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--teal)' }}>
                  <Check size={12} strokeWidth={2.5} /> {filledFields.size} fields auto-filled
                  <button type="button" onClick={() => extractMetadata()} style={{ marginLeft: 4, appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 11.5, fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
                    Re-extract
                  </button>
                </div>
              )}
              {extractErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--red)' }}>
                  <AlertCircle size={12} strokeWidth={1.5} /> {extractErr}
                  <button type="button" onClick={() => extractMetadata()} style={{ marginLeft: 4, appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 11.5, fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
                    Retry
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={submitManual} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { k: 'title', label: 'Title *', placeholder: 'Full paper title', required: true },
                { k: 'authors', label: 'Authors', placeholder: 'e.g. Smith J, Doe A' },
                { k: 'doi', label: 'DOI', placeholder: 'e.g. 10.1039/d4bm00021a' },
              ].map(({ k, label, placeholder, required }) => (
                <div key={k}>
                  <label style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono,monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input
                    value={form[k as keyof typeof form]}
                    onChange={setField(k)}
                    placeholder={placeholder}
                    required={required}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', border: `1px solid ${filledFields.has(k) ? 'var(--teal)' : 'var(--line)'}`, boxShadow: filledFields.has(k) ? '0 0 0 3px var(--teal-soft)' : 'none', transition: 'border-color 0.4s, box-shadow 0.4s' }}
                  />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { k: 'year', label: 'Year', placeholder: '2024' },
                  { k: 'journal', label: 'Journal', placeholder: 'Journal name' },
                  { k: 'citation_count', label: 'Citations', placeholder: '0' },
                ].map(({ k, label, placeholder }) => (
                  <div key={k}>
                    <label style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono,monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input
                      value={form[k as keyof typeof form]}
                      onChange={setField(k)}
                      placeholder={placeholder}
                      type="number"
                      min={k === 'year' ? 1900 : 0}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', border: `1px solid ${filledFields.has(k) ? 'var(--teal)' : 'var(--line)'}`, boxShadow: filledFields.has(k) ? '0 0 0 3px var(--teal-soft)' : 'none', transition: 'border-color 0.4s, box-shadow 0.4s' }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono,monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Abstract</label>
                <textarea
                  value={form.abstract}
                  onChange={setField('abstract')}
                  placeholder="Paste abstract here…"
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', border: `1px solid ${filledFields.has('abstract') ? 'var(--teal)' : 'var(--line)'}`, boxShadow: filledFields.has('abstract') ? '0 0 0 3px var(--teal-soft)' : 'none', transition: 'border-color 0.4s, box-shadow 0.4s' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button type="button" onClick={onClose} style={{ appearance: 'none', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text-2)', fontSize: 13, fontFamily: 'inherit', padding: '10px 18px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 10, color: '#0B3B38', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, padding: '10px 20px', cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? savingMsg : <><Plus size={14} /> Add to Library</>}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

const ACTIVE_FILTERS_DEFAULT = ['year', 'journal'];

export default function LibraryPage() {
  /* ─── Data hooks ─────────────────────────────────────────── */
  const { papers: dbPapers, loading: dbLoading, addPaper, toggleBookmark, uploadPdf } = usePapers();
  const { user } = useUser();

  /* ─── State ──────────────────────────────────────────────── */
  const [skeletonDone, setSkeletonDone] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(ACTIVE_FILTERS_DEFAULT));
  const [aiTab, setAiTab] = useState<'extraction' | 'notes' | 'citations'>('extraction');
  const [annoPop, setAnnoPop] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [showImport, setShowImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Minimum skeleton time: 950ms (same as before)
  const loading = dbLoading || !skeletonDone;

  /* ─── Refs ───────────────────────────────────────────────── */
  const libRef = useRef<HTMLDivElement>(null);
  const zoneListRef = useRef<HTMLDivElement>(null);
  const zoneReaderRef = useRef<HTMLDivElement>(null);
  const rowResizerRef = useRef<HTMLDivElement>(null);
  const colResizerRef = useRef<HTMLDivElement>(null);
  const pdfScrollRef = useRef<HTMLDivElement>(null);
  const annoPopRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Initial load ───────────────────────────────────────── */
  useEffect(() => {
    // Load persisted panel sizes
    try {
      const listH = localStorage.getItem('moku.lib.listH');
      if (listH && zoneListRef.current) zoneListRef.current.style.setProperty('--list-h', listH);
      const readerL = localStorage.getItem('moku.lib.readerL');
      if (readerL && zoneReaderRef.current) {
        zoneReaderRef.current.style.setProperty('--reader-l', readerL);
        const pct = parseFloat(readerL);
        zoneReaderRef.current.style.setProperty('--reader-r', `${(100 - pct - 0.5).toFixed(2)}%`);
      }
    } catch (_) {}

    // Minimum skeleton display time
    const t = setTimeout(() => setSkeletonDone(true), 950);
    return () => clearTimeout(t);
  }, []);

  // Set first paper as active when data loads
  useEffect(() => {
    if (dbPapers.length > 0 && !activeId) {
      setActiveId(dbPapers[0].id);
    }
  }, [dbPapers, activeId]);

  // Filtered + searched papers
  const filteredPapers = searchQuery.trim()
    ? dbPapers.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.authors ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.doi ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.journal ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dbPapers;

  const activePaper = dbPapers.find(p => p.id === activeId) ?? null;

  /* ─── Toast helper ───────────────────────────────────────── */
  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 1900);
  }, []);

  /* ─── Annotation popover (mouseup inside pdf-scroll) ────── */
  useEffect(() => {
    function onMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setAnnoPop(p => ({ ...p, visible: false })); return; }
      const range = sel.getRangeAt(0);
      if (!range || !pdfScrollRef.current?.contains(range.commonAncestorContainer)) {
        setAnnoPop(p => ({ ...p, visible: false }));
        return;
      }
      const rect = range.getBoundingClientRect();
      const popW = 284;
      const x = Math.max(12, Math.min(window.innerWidth - popW - 12, rect.left + rect.width / 2 - popW / 2));
      const y = Math.max(60, rect.top - 56);
      setAnnoPop({ visible: true, x, y });
    }
    function onMouseDown(e: MouseEvent) {
      if (!annoPopRef.current?.contains(e.target as Node)) {
        setAnnoPop(p => ({ ...p, visible: false }));
      }
    }
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  async function handleAnnotation(act: 'highlight' | 'note' | 'copilot') {
    const sel = window.getSelection();
    let selectedText = '';
    if (sel && !sel.isCollapsed && pdfScrollRef.current) {
      try {
        const range = sel.getRangeAt(0);
        if (pdfScrollRef.current.contains(range.commonAncestorContainer)) {
          selectedText = sel.toString().trim();
          const mark = document.createElement('mark');
          mark.style.background = 'var(--highlight)';
          mark.style.padding = '1px 2px';
          mark.style.borderRadius = '2px';
          mark.style.color = 'inherit';
          mark.style.cursor = 'pointer';
          range.surroundContents(mark);
        }
      } catch (_) {}
      sel.removeAllRanges();
    }
    setAnnoPop(p => ({ ...p, visible: false }));
    showToast(act === 'highlight' ? 'Highlight saved' : act === 'note' ? 'Note added' : 'Sent to Copilot');

    // Persist to DB if we have a paper + user + text
    if (selectedText && activeId && user) {
      try {
        const supabase = createClient();
        await supabase.from('annotations').insert({
          paper_id: activeId,
          user_id: user.id,
          selected_text: selectedText,
          type: act,
          color: act === 'highlight' ? 'var(--teal)' : null,
        });
      } catch (_) {}
    }
  }

  /* ─── Row resizer (vertical drag, list ↔ reader) ─────────── */
  useEffect(() => {
    const resizer = rowResizerRef.current;
    const lib = libRef.current;
    const zoneList = zoneListRef.current;
    if (!resizer || !lib || !zoneList) return;

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      resizer!.setPointerCapture(e.pointerId);
      resizer!.classList.add('is-drag');
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      const libRect = lib!.getBoundingClientRect();
      const listTop = zoneList!.getBoundingClientRect().top - libRect.top;
      const minH = 140;
      const minReader = 220;

      function onMove(ev: PointerEvent) {
        const maxH = libRect.height - listTop - minReader;
        const h = Math.max(minH, Math.min(maxH, ev.clientY - libRect.top - listTop));
        zoneList!.style.setProperty('--list-h', h + 'px');
      }
      function onUp() {
        resizer!.releasePointerCapture(e.pointerId);
        resizer!.classList.remove('is-drag');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizer!.removeEventListener('pointermove', onMove);
        resizer!.removeEventListener('pointerup', onUp);
        try { localStorage.setItem('moku.lib.listH', zoneList!.style.getPropertyValue('--list-h')); } catch (_) {}
      }
      resizer!.addEventListener('pointermove', onMove);
      resizer!.addEventListener('pointerup', onUp);
    }

    function onDblClick() {
      zoneList!.style.removeProperty('--list-h');
      try { localStorage.removeItem('moku.lib.listH'); } catch (_) {}
    }

    resizer.addEventListener('pointerdown', onPointerDown);
    resizer.addEventListener('dblclick', onDblClick);
    return () => {
      resizer.removeEventListener('pointerdown', onPointerDown);
      resizer.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  /* ─── Col resizer (horizontal drag, PDF ↔ AI) ────────────── */
  useEffect(() => {
    const resizer = colResizerRef.current;
    const zoneReader = zoneReaderRef.current;
    if (!resizer || !zoneReader) return;

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      resizer!.setPointerCapture(e.pointerId);
      resizer!.classList.add('is-drag');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const r = zoneReader!.getBoundingClientRect();
      const minL = 320;
      const minR = 260;

      function onMove(ev: PointerEvent) {
        const x = ev.clientX - r.left;
        const l = Math.max(minL, Math.min(r.width - minR - 6, x));
        const lPct = (l / r.width) * 100;
        const rPct = ((r.width - l - 6) / r.width) * 100;
        zoneReader!.style.setProperty('--reader-l', lPct.toFixed(2) + '%');
        zoneReader!.style.setProperty('--reader-r', rPct.toFixed(2) + '%');
      }
      function onUp() {
        resizer!.releasePointerCapture(e.pointerId);
        resizer!.classList.remove('is-drag');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizer!.removeEventListener('pointermove', onMove);
        resizer!.removeEventListener('pointerup', onUp);
        try { localStorage.setItem('moku.lib.readerL', zoneReader!.style.getPropertyValue('--reader-l')); } catch (_) {}
      }
      resizer!.addEventListener('pointermove', onMove);
      resizer!.addEventListener('pointerup', onUp);
    }

    function onDblClick() {
      zoneReader!.style.removeProperty('--reader-l');
      zoneReader!.style.removeProperty('--reader-r');
      try { localStorage.removeItem('moku.lib.readerL'); } catch (_) {}
    }

    resizer.addEventListener('pointerdown', onPointerDown);
    resizer.addEventListener('dblclick', onDblClick);
    return () => {
      resizer.removeEventListener('pointerdown', onPointerDown);
      resizer.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  /* ─── Saved toggle ───────────────────────────────────────── */
  async function toggleSaved(id: string, current: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    await toggleBookmark(id, current);
    if (!current) showToast('Bookmarked');
  }

  /* ─── Import paper ───────────────────────────────────────── */
  async function handleImport(data: { title: string; authors: string; year: number | null; journal: string; doi: string; abstract: string; citation_count: number | null; file: File | null }) {
    const paper = await addPaper({
      title: data.title,
      authors: data.authors || null,
      year: data.year,
      journal: data.journal || null,
      doi: data.doi || null,
      abstract: data.abstract || null,
      citation_count: data.citation_count,
      is_bookmarked: false,
    });
    if (paper && data.file) {
      await uploadPdf(paper.id, data.file);
      showToast('Paper + PDF added to library');
    } else {
      showToast('Paper added to library');
    }
  }

  /* ─── Chip filter toggle ─────────────────────────────────── */
  function toggleFilter(key: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  /* ─── Skeleton rows ──────────────────────────────────────── */
  const skRow = (i: number) => (
    <div key={`sk-${i}`} style={tblRowStyle(false, false, i % 2 === 1)}>
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={skStyle(`${60 + (i * 13) % 30}%`, 10)} />
        <span style={skStyle(`${30 + (i * 7) % 15}%`, 8)} />
      </div>
      <span style={skStyle('75%', 10)} />
      <span style={skStyle('50%', 10)} />
      <span style={skStyle('80%', 10)} />
      <span style={skStyle('50%', 10)} />
      <div style={{ display: 'inline-flex', gap: 4 }}>
        <span style={{ ...skStyle(60, 18), borderRadius: 999 }} />
        <span style={{ ...skStyle(48, 18), borderRadius: 999 }} />
      </div>
      <div />
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Main library grid ── */}
      <div ref={libRef} className="lib">

        {/* ══ Zone 1: Search & Filters ══ */}
        <div className="zone-search">
          <div className="lib-header">
            <div className="lib-title">
              <span className="lib-eyebrow">
                <span className="lib-pulse" />
                Library · {loading ? '…' : dbPapers.length} papers
              </span>
              <h1>Your <em>research</em> shelf.</h1>
            </div>
            <div className="lib-stats">
              <span><b>{loading ? '–' : dbPapers.length}</b>&nbsp; papers</span>
              <span className="stat-sep" />
              <span><b>{loading ? '–' : dbPapers.filter(p => p.is_bookmarked).length}</b>&nbsp; bookmarked</span>
              <span className="stat-sep" />
              <span><b>{loading ? '–' : dbPapers.filter(p => (new Date().getTime() - new Date(p.created_at ?? 0).getTime()) < 7 * 24 * 60 * 60 * 1000).length}</b>&nbsp; new this week</span>
              <span className="stat-sep" />
              <span><b>{loading ? '–' : (dbPapers.reduce((s, p) => s + (p.citation_count ?? 0), 0) > 999 ? (dbPapers.reduce((s, p) => s + (p.citation_count ?? 0), 0) / 1000).toFixed(1) + 'k' : dbPapers.reduce((s, p) => s + (p.citation_count ?? 0), 0))}</b>&nbsp; citations</span>
            </div>
          </div>

          <div className="search-row">
            <div className="search-box">
              <span className="search-ic"><Search size={16} strokeWidth={1.5} /></span>
              <input
                type="search"
                placeholder="Search papers, authors, abstracts, or paste a DOI / arXiv ID…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="search-kbd">
                <kbd>⌘</kbd><kbd>K</kbd>
              </span>
            </div>
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <button className="pill-btn">
                <SlidersHorizontal size={14} strokeWidth={1.5} /> Advanced
              </button>
              <button className="pill-btn primary" onClick={() => setShowImport(true)}>
                <Plus size={14} strokeWidth={1.5} /> Import paper
              </button>
            </div>
          </div>

          <div className="filter-row">
            <span className="filter-lbl">Filters</span>
            {[
              { key: 'year', icon: <Calendar size={12} strokeWidth={1.6} />, label: 'Year', val: '2020 – 2025' },
              { key: 'journal', icon: <BookMarked size={12} strokeWidth={1.6} />, label: 'Journal', val: 'Biomaterials +3' },
              { key: 'field', icon: <Atom size={12} strokeWidth={1.6} />, label: 'Field', val: 'Any' },
              { key: 'cites', icon: <Quote size={12} strokeWidth={1.6} />, label: 'Citations', val: 'Any' },
            ].map(f => (
              <button
                key={f.key}
                className={`chip${activeFilters.has(f.key) ? ' is-on' : ''}`}
                onClick={() => toggleFilter(f.key)}
              >
                {f.icon} {f.label} <span className="chip-val">{f.val}</span>
                {activeFilters.has(f.key) && <span className="chip-x">×</span>}
              </button>
            ))}
            <span className="chip-divider" />
            {[
              { key: 'open', icon: <Unlock size={12} strokeWidth={1.6} />, label: 'Open access' },
              { key: 'annot', icon: <Highlighter size={12} strokeWidth={1.6} />, label: 'With my notes' },
            ].map(f => (
              <button
                key={f.key}
                className={`chip${activeFilters.has(f.key) ? ' is-on' : ''}`}
                onClick={() => toggleFilter(f.key)}
              >
                {f.icon} {f.label}
              </button>
            ))}
            <button className="chip-clear" onClick={() => setActiveFilters(new Set())}>Clear all</button>
          </div>
        </div>

        {/* ══ Zone 2: Paper list ══ */}
        <div ref={zoneListRef} className="zone-list">
          {/* Table header */}
          <div className="tbl-head">
            <div className="sortable">Title <ChevronDown size={11} style={{ opacity: 0.7 }} /></div>
            <div className="th-hide-sm">Authors</div>
            <div className="sortable">Year <ChevronDown size={11} style={{ opacity: 0.7 }} /></div>
            <div className="th-hide-sm">Journal</div>
            <div className="sortable">Citations <ChevronDown size={11} style={{ opacity: 0.7 }} /></div>
            <div className="th-hide-sm">Tags</div>
            <div />
          </div>

          {/* Table body */}
          <div className="tbl-body">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => skRow(i))
              : filteredPapers.length === 0
              ? (
                <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                  {searchQuery ? `No papers matching "${searchQuery}"` : 'No papers yet. Click "Import paper" to get started.'}
                </div>
              )
              : filteredPapers.map((p: PaperWithTags, i: number) => (
                <div
                  key={p.id}
                  className={`tbl-row${p.id === activeId ? ' is-active' : ''}${p.is_bookmarked ? ' is-saved' : ''}`}
                  style={tblRowStyle(p.id === activeId, false, i % 2 === 1)}
                  onClick={() => setActiveId(p.id)}
                >
                  <div className="col-title">
                    <span className="col-t">{p.title}</span>
                    {p.doi && <span className="col-meta"><b>doi:</b> {p.doi}</span>}
                  </div>
                  <div className="col-authors">{p.authors ?? '—'}</div>
                  <div className="col-year">{p.year ?? '—'}</div>
                  <div className="col-journal">{p.journal ?? '—'}</div>
                  <div className="col-citations">
                    <Quote size={12} strokeWidth={1.5} style={{ color: 'var(--text-4)' }} />
                    {(p.citation_count ?? 0).toLocaleString()}
                  </div>
                  <div className="col-tags">
                    {p.tags.slice(0, 2).map(tag => (
                      <span key={tag.id} className="tag" style={{ color: tag.color ?? 'var(--text-3)', borderColor: `${tag.color ?? 'var(--text-3)'}44` }}>
                        {tag.name}
                      </span>
                    ))}
                    {p.tags.length > 2 && (
                      <span className="tag more">+{p.tags.length - 2}</span>
                    )}
                  </div>
                  <div className="col-actions">
                    <button
                      title="Bookmark"
                      className={p.is_bookmarked ? 'is-saved' : ''}
                      onClick={e => toggleSaved(p.id, !!p.is_bookmarked, e)}
                    >
                      {p.is_bookmarked ? <BookmarkCheck size={14} strokeWidth={1.5} /> : <Bookmark size={14} strokeWidth={1.5} />}
                    </button>
                    <button title="Cite" onClick={e => e.stopPropagation()}>
                      <Quote size={14} strokeWidth={1.5} />
                    </button>
                    <button title="Open PDF" onClick={e => { e.stopPropagation(); if (p.pdf_url) window.open(p.pdf_url, '_blank'); }}>
                      <FileText size={14} strokeWidth={1.5} style={{ opacity: p.pdf_url ? 1 : 0.4 }} />
                    </button>
                    <button title="More" onClick={e => e.stopPropagation()}>
                      <MoreHorizontal size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* ══ Row resizer ══ */}
        <div
          ref={rowResizerRef}
          className="row-resizer"
          role="separator"
          aria-orientation="horizontal"
          tabIndex={0}
          title="Drag to resize · Double-click to reset"
        />

        {/* ══ Zone 3: Reader ══ */}
        <div ref={zoneReaderRef} className="zone-reader">

          {/* ── PDF pane ── */}
          <div className="pdf-pane">
            {/* PDF toolbar */}
            <div className="pdf-toolbar">
              <div className="pdf-file">
                <span className="pdf-file-ic"><FileText size={15} strokeWidth={1.5} /></span>
                <span className="pdf-file-name">
                  {activePaper ? activePaper.title.slice(0, 60) + (activePaper.title.length > 60 ? '…' : '') : 'No paper selected'}
                </span>
              </div>
              {activePaper?.pdf_url ? (
                <>
                  <span className="pdf-pg-num">Page 1 of —</span>
                  <span className="pdf-divider" />
                  <button className="tbtn" title="Previous page"><ChevronUp size={14} strokeWidth={1.5} /></button>
                  <button className="tbtn" title="Next page"><ChevronDown size={14} strokeWidth={1.5} /></button>
                  <span className="pdf-divider" />
                  <button className="tbtn" title="Zoom out"><Minus size={14} strokeWidth={1.5} /></button>
                  <span className="pdf-zoom">100%</span>
                  <button className="tbtn" title="Zoom in"><Plus size={14} strokeWidth={1.5} /></button>
                  <span className="pdf-divider" />
                  <button className="tbtn" title="Outline"><List size={14} strokeWidth={1.5} /></button>
                  <button className="tbtn" title="Download"><Download size={14} strokeWidth={1.5} /></button>
                </>
              ) : (
                <label className="tbtn pdf-upload-btn" title="Upload PDF" style={{ marginLeft: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '0 10px', fontSize: 12, color: 'var(--text-3)' }}>
                  <Upload size={13} strokeWidth={1.5} /> Upload PDF
                  <input type="file" accept="application/pdf" style={{ display: 'none' }}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file && activeId) { await uploadPdf(activeId, file); showToast('PDF uploaded'); }
                    }} />
                </label>
              )}
            </div>

            {/* PDF scroll area */}
            <div ref={pdfScrollRef} className="pdf-scroll">
              {activePaper?.pdf_url ? (
                /* Real PDF via iframe */
                <iframe
                  src={activePaper.pdf_url}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  title={activePaper.title}
                />
              ) : activePaper ? (
                /* Metadata view — clean card */
                <div className="pmv">
                  {/* Badges */}
                  <div className="pmv-badges">
                    {activePaper.journal && (
                      <span className={`pmv-chip${activePaper.doi?.startsWith('arxiv:') ? ' pmv-chip-teal' : ''}`}>
                        {activePaper.journal}
                      </span>
                    )}
                    {activePaper.year && <span className="pmv-chip">{activePaper.year}</span>}
                    {activePaper.citation_count != null && activePaper.citation_count > 0 && (
                      <span className="pmv-chip">
                        <Quote size={10} strokeWidth={1.5} /> {activePaper.citation_count.toLocaleString()} cited
                      </span>
                    )}
                    {activePaper.doi?.startsWith('arxiv:') && (
                      <a href={`https://arxiv.org/abs/${activePaper.doi.slice(6)}`} target="_blank" rel="noopener noreferrer" className="pmv-ext-link">
                        Open arXiv <ArrowUpRight size={11} strokeWidth={1.5} />
                      </a>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="pmv-title">{activePaper.title}</h2>

                  {/* Authors */}
                  {activePaper.authors && (
                    <div className="pmv-authors">{activePaper.authors}</div>
                  )}

                  {/* Identifier */}
                  {activePaper.doi && (
                    <div className="pmv-id">
                      <span className="pmv-id-lbl">{activePaper.doi.startsWith('arxiv:') ? 'arXiv' : 'doi'}</span>
                      {activePaper.doi.startsWith('arxiv:') ? activePaper.doi.slice(6) : activePaper.doi}
                    </div>
                  )}

                  <div className="pmv-rule" />

                  {/* Abstract */}
                  {activePaper.abstract ? (
                    <>
                      <div className="pmv-abstract-lbl">Abstract</div>
                      <p className="pmv-abstract">{activePaper.abstract}</p>
                    </>
                  ) : (
                    <div className="pmv-empty">
                      <FileText size={26} strokeWidth={0.8} />
                      <span>No abstract available</span>
                    </div>
                  )}

                  {/* Upload CTA */}
                  <label className="pmv-upload">
                    <Upload size={13} strokeWidth={1.5} />
                    Upload PDF to read full text
                    <input type="file" accept="application/pdf" style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file && activeId) { await uploadPdf(activeId, file); showToast('PDF uploaded'); }
                      }} />
                  </label>
                </div>
              ) : (
                /* No paper selected */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--text-4)' }}>
                  <FileText size={40} strokeWidth={0.8} style={{ opacity: 0.3 }} />
                  <div style={{ fontSize: 13, textAlign: 'center' }}>
                    Select a paper from the list above<br />to read it here.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Col resizer ── */}
          <div
            ref={colResizerRef}
            className="col-resizer"
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            title="Drag to resize · Double-click to reset"
          />

          {/* ── AI pane ── */}
          <div className="ai-pane">
            <div className="ai-tabs">
              {(['extraction', 'notes', 'citations'] as const).map(tab => (
                <span
                  key={tab}
                  className={`ai-tab${aiTab === tab ? ' is-on' : ''}`}
                  onClick={() => setAiTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              ))}
              <span style={{ flex: 1 }} />
              <span className="ai-credit">
                <span className="ai-orb" />
                Auto-extracted
              </span>
            </div>

            <div className="ai-body">
              {aiTab === 'extraction' && (
                <>
                  {/* Card 1: Methodology */}
                  <section className="ai-card">
                    <header className="card-head">
                      <span className="card-lbl">
                        <span className="card-ic"><FlaskConical size={12} strokeWidth={1.7} /></span>
                        Methodology
                      </span>
                      <span className="card-conf">
                        94% confident
                        <span className="conf-bar"><span style={{ width: '94%' }} /></span>
                      </span>
                    </header>
                    <div className="kv">
                      {[
                        { k: 'Technique', v: 'Electrospinning', link: '§2' },
                        { k: 'Solvent system', v: 'CHCl₃ / DMF (7 : 3 v/v)' },
                        { k: 'Voltage', v: '18 kV' },
                        { k: 'Tip-to-collector', v: '15 cm' },
                        { k: 'Feed rate', v: '0.8 mL h⁻¹' },
                        { k: 'UV crosslink', v: '365 nm, 30 min' },
                      ].map(row => (
                        <div key={row.k} className="kv-row">
                          <span className="kv-k">{row.k}</span>
                          <span className="kv-v">
                            {row.v}
                            {row.link && (
                              <span className="kv-link">
                                <Link2 size={11} strokeWidth={1.6} /> {row.link}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Card 2: Material ratios */}
                  <section className="ai-card">
                    <header className="card-head">
                      <span className="card-lbl">
                        <span className="card-ic"><Layers size={12} strokeWidth={1.7} /></span>
                        Material ratios
                      </span>
                      <span className="card-conf">
                        97%
                        <span className="conf-bar"><span style={{ width: '97%' }} /></span>
                      </span>
                    </header>
                    <div>
                      {[
                        { name: 'PCL (Mw 80 kDa)', pct: '70%', w: 70, variant: 'teal' },
                        { name: 'PVP (K-30)', pct: '30%', w: 30, variant: 'amber' },
                        { name: 'Total polymer concentration', pct: '12% w/v', w: 12, variant: 'violet' },
                      ].map(m => (
                        <div key={m.name} className="mat-row">
                          <div className="mat-meta">
                            <span className="mat-name">{m.name}</span>
                            <span className="mat-pct">{m.pct}</span>
                          </div>
                          <div className="mat-bar">
                            <span className={`mat-fill mat-${m.variant}`} style={{ width: m.w + '%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Card 3: Statistical results */}
                  <section className="ai-card">
                    <header className="card-head">
                      <span className="card-lbl">
                        <span className="card-ic"><BarChart3 size={12} strokeWidth={1.7} /></span>
                        Statistical results
                      </span>
                      <span className="card-conf">
                        91%
                        <span className="conf-bar"><span style={{ width: '91%' }} /></span>
                      </span>
                    </header>
                    <div className="stat-tbl">
                      <div className="stat-h">Metric</div>
                      <div className="stat-h r">Treatment</div>
                      <div className="stat-h r">Control</div>
                      <div className="stat-h r">p</div>
                      {[
                        { m: 'Wound closure · d14', tr: '92.4%', ctrl: '71.8%', p: '<0.001', sig: true },
                        { m: 'Cell viability · d7', tr: '96.1%', ctrl: '78.4%', p: '<0.01', sig: true },
                        { m: 'Tensile strength', tr: '4.6 MPa', ctrl: '3.9 MPa', p: '0.082', sig: false },
                        { m: 'Contact angle', tr: '84°', ctrl: '132°', p: '<0.001', sig: true },
                      ].map(row => (
                        <React.Fragment key={row.m}>
                          <div className="stat-cell">{row.m}</div>
                          <div className="stat-cell n">{row.tr}</div>
                          <div className="stat-cell n">{row.ctrl}</div>
                          <div className={`stat-cell n ${row.sig ? 'sig' : 'ns'}`}>{row.p}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </section>

                  {/* Card 4: Citation links */}
                  <section className="ai-card">
                    <header className="card-head">
                      <span className="card-lbl">
                        <span className="card-ic"><Quote size={12} strokeWidth={1.7} /></span>
                        Citation links
                      </span>
                      <span className="card-conf">42 refs</span>
                    </header>
                    <div className="cite-list">
                      {[
                        { n: '[1]', t: 'Sen, C. K. — Chronic wounds: an emerging health challenge', meta: 'Adv. Wound Care · 2019 · 1,420 cited by' },
                        { n: '[2]', t: 'Pham, Q. P. — Electrospinning of polymeric nanofibers for tissue engineering', meta: 'Tissue Eng. · 2006 · 4,812' },
                        { n: '[3]', t: 'Sill, T. J. — Electrospinning: Applications in drug delivery and tissue engineering', meta: 'Biomaterials · 2008 · 3,206' },
                        { n: '[4]', t: 'Kurakula, M. — Pharmaceutical assessment of polyvinylpyrrolidone', meta: 'J. Drug Deliv. Sci. Technol. · 2020 · 318' },
                      ].map(c => (
                        <div key={c.n} className="cite-item">
                          <span className="cite-n">{c.n}</span>
                          <div className="cite-body">
                            <span className="cite-t">{c.t}</span>
                            <span className="cite-meta">{c.meta}</span>
                          </div>
                          <span className="cite-arrow"><ArrowUpRight size={13} strokeWidth={1.5} /></span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {aiTab === 'notes' && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No notes yet. Select text in the PDF to add a note.
                </div>
              )}

              {aiTab === 'citations' && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  42 citations found. Opening full citation view…
                </div>
              )}
            </div>
          </div>

        </div>{/* /zone-reader */}
      </div>{/* /lib */}

      {/* ── Annotation popover ── */}
      <div
        ref={annoPopRef}
        role="menu"
        style={{
          position: 'fixed',
          left: annoPop.x,
          top: annoPop.y,
          opacity: annoPop.visible ? 1 : 0,
          transform: annoPop.visible ? 'translateY(0)' : 'translateY(6px)',
          pointerEvents: annoPop.visible ? 'auto' : 'none',
          transition: 'opacity 0.18s, transform 0.18s',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 8,
          display: 'inline-flex',
          gap: 4,
          boxShadow: 'var(--shadow)',
          zIndex: 40,
          whiteSpace: 'nowrap',
        }}
      >
        <button className="anno-btn" onClick={() => handleAnnotation('highlight')}>
          <Highlighter size={14} strokeWidth={1.5} /> Highlight
        </button>
        <button className="anno-btn" onClick={() => handleAnnotation('note')}>
          <MessageSquareText size={14} strokeWidth={1.5} /> Note
        </button>
        <button className="anno-btn primary" onClick={() => handleAnnotation('copilot')}>
          <Sparkles size={14} strokeWidth={1.5} /> Ask Copilot
        </button>
      </div>

      {/* ── Toast ── */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 28,
          transform: toast.visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
          opacity: toast.visible ? 1 : 0,
          transition: 'opacity 0.25s, transform 0.25s',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          color: 'var(--text)',
          fontSize: 13,
          padding: '10px 16px 10px 12px',
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(78,205,196,0.18)',
          color: 'var(--teal)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Check size={12} strokeWidth={2} />
        </span>
        <div>
          <span>{toast.message}</span>
          <div style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 10.5,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>Synced · auto</div>
        </div>
      </div>

      {/* ── Import modal ── */}
      {showImport && (
        <ImportPaperModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </>
  );
}

/* ─── Helper style fns ─────────────────────────────────────── */
function tblRowStyle(active: boolean, _hovered: boolean, alt: boolean) {
  return {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,2.4fr) minmax(0,1.3fr) 72px minmax(0,1.1fr) 96px minmax(0,1.2fr) 150px',
    alignItems: 'center',
    gap: '18px',
    padding: '0 28px',
    height: 64,
    borderBottom: '1px solid var(--line-soft)',
    cursor: 'pointer',
    position: 'relative' as const,
    background: active
      ? 'var(--teal-soft)'
      : alt
      ? 'var(--row-alt)'
      : 'transparent',
    transition: 'background-color 0.15s',
  } as React.CSSProperties;
}

function skStyle(w: string | number, h: number) {
  return {
    display: 'inline-block',
    width: typeof w === 'string' ? w : w,
    height: h,
    borderRadius: 6,
    background: 'linear-gradient(90deg, var(--skeleton-1) 0%, var(--skeleton-2) 40%, var(--skeleton-1) 80%)',
    backgroundSize: '240% 100%',
    animation: 'shimmer 1.6s linear infinite',
  } as React.CSSProperties;
}

/* ─── CSS (injected as <style> to match original patterns) ── */
const CSS = `
.lib {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 0;
  overflow: hidden;
  height: 100%;
}

/* Zone Search */
.zone-search {
  padding: 20px 28px 12px;
  display: grid;
  gap: 14px;
}
.lib-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.lib-title { display: grid; gap: 6px; }
.lib-eyebrow {
  font-family: var(--font-geist-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-3);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.lib-pulse {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 0 0 rgba(78,205,196,.55);
  animation: lib-pulse 2.4s ease-out infinite;
  flex-shrink: 0;
}
@keyframes lib-pulse {
  0% { box-shadow: 0 0 0 0 rgba(78,205,196,.55); }
  70% { box-shadow: 0 0 0 10px rgba(78,205,196,0); }
  100% { box-shadow: 0 0 0 0 rgba(78,205,196,0); }
}
.lib-title h1 {
  font-weight: 200;
  font-size: 30px;
  letter-spacing: -0.025em;
  color: var(--text);
  line-height: 1;
}
.lib-title h1 em { font-style: italic; color: var(--text-2); }
.lib-stats {
  display: inline-flex;
  gap: 20px;
  align-items: center;
  font-family: var(--font-geist-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-3);
}
.lib-stats b { color: var(--text); font-weight: 500; font-size: 13px; }
.stat-sep { width: 1px; height: 14px; background: var(--line); display: inline-block; }

/* Search */
.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}
.search-box {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  height: 44px;
  background: var(--search-bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition: border-color .2s, box-shadow .2s;
}
.search-box:focus-within {
  border-color: var(--ring);
  box-shadow: 0 0 0 4px var(--teal-soft);
}
.search-ic { justify-self: center; color: var(--text-3); display: flex; align-items: center; }
.search-box input {
  border: none; background: transparent; outline: none;
  font-family: inherit; font-size: 14px; color: var(--text);
  width: 100%; padding-right: 10px; font-weight: 300;
}
.search-box input::placeholder { color: var(--text-3); }
.search-kbd {
  display: inline-flex;
  gap: 4px;
  padding-right: 10px;
}
.search-kbd kbd {
  font-family: var(--font-geist-mono, monospace);
  font-size: 10.5px;
  color: var(--text-3);
  background: var(--kbd-bg);
  border: 1px solid var(--line);
  padding: 3px 6px;
  border-radius: 5px;
}
.pill-btn {
  appearance: none; cursor: pointer;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--text-2); font-family: inherit; font-size: 13px;
  height: 44px; padding: 0 14px; border-radius: 12px;
  display: inline-flex; align-items: center; gap: 8px;
  transition: background .2s, border-color .2s, color .2s;
}
.pill-btn:hover { background: var(--surface-2); color: var(--text); border-color: var(--text-4); }
.pill-btn.primary { background: var(--teal); color: #0B3B38; border-color: var(--teal); font-weight: 500; }
.pill-btn.primary:hover { background: var(--teal-deep); }

/* Filter chips */
.filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-lbl {
  font-family: var(--font-geist-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--text-4);
  margin-right: 4px;
}
.chip {
  appearance: none; cursor: pointer;
  background: transparent; border: 1px solid var(--line);
  color: var(--text-2); font-family: inherit; font-size: 12.5px;
  padding: 7px 11px 7px 13px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 8px;
  transition: background .2s, border-color .2s, color .2s;
  white-space: nowrap;
}
.chip:hover { border-color: var(--text-4); color: var(--text); }
.chip-val { color: var(--text-3); }
.chip.is-on { background: var(--teal-soft); color: var(--teal); border-color: rgba(78,205,196,0.4); }
.chip.is-on .chip-val { color: var(--teal); }
.chip-x { margin-left: 2px; opacity: 0.7; }
.chip-divider { width: 1px; height: 18px; background: var(--line); margin: 0 4px; }
.chip-clear {
  appearance: none; cursor: pointer; background: transparent; border: none;
  color: var(--text-3); font-family: var(--font-geist-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  padding: 4px 6px; border-radius: 5px;
}
.chip-clear:hover { color: var(--text); background: var(--surface); }

/* Zone List */
.zone-list {
  border-top: 1px solid var(--line);
  background: var(--bg);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
  height: var(--list-h, 38vh);
  position: relative;
}
.tbl-head {
  display: grid;
  grid-template-columns: minmax(0,2.4fr) minmax(0,1.3fr) 72px minmax(0,1.1fr) 96px minmax(0,1.2fr) 150px;
  align-items: center;
  gap: 18px;
  padding: 0 28px;
  height: 38px;
  font-family: var(--font-geist-mono, monospace);
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-4);
  border-bottom: 1px solid var(--line);
  background: var(--bg);
  position: sticky; top: 0; z-index: 2;
  flex-shrink: 0;
}
.sortable { cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.sortable:hover { color: var(--text-3); }
.tbl-body { overflow: auto; }

/* Table row hover & active states via CSS class */
.tbl-row:hover { background: var(--row-hover) !important; }
.tbl-row.is-active::before {
  content: "";
  position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: var(--teal);
  box-shadow: 0 0 12px rgba(78,205,196,0.5);
}
.col-title { display: grid; gap: 4px; min-width: 0; }
.col-t {
  font-size: 14px; font-weight: 400; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  letter-spacing: -0.005em;
}
.col-meta {
  font-family: var(--font-geist-mono, monospace);
  font-size: 10.5px; letter-spacing: 0.06em; color: var(--text-4);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.col-meta b { color: var(--text-3); font-weight: 400; }
.col-authors, .col-journal {
  font-size: 13px; color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.col-journal { font-style: italic; color: var(--text-3); font-family: "Spectral", serif; font-size: 14px; }
.col-year, .col-citations {
  font-family: var(--font-geist-mono, monospace);
  font-size: 12.5px; color: var(--text-2); font-variant-numeric: tabular-nums;
}
.col-citations { display: inline-flex; align-items: center; gap: 6px; color: var(--text); font-weight: 400; }
.col-tags { display: inline-flex; gap: 4px; flex-wrap: nowrap; min-width: 0; }
.tag {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  background: var(--surface); border: 1px solid var(--line);
  color: var(--text-2); white-space: nowrap;
}
.tag.more { color: var(--text-4); border-style: dashed; }
.col-actions {
  justify-self: end;
  display: inline-flex; gap: 2px;
  opacity: 0;
  transition: opacity .2s;
}
.tbl-row:hover .col-actions,
.tbl-row.is-active .col-actions { opacity: 1; }
.col-actions button {
  appearance: none; cursor: pointer;
  background: transparent; border: 1px solid transparent;
  color: var(--text-3); width: 30px; height: 30px;
  border-radius: 7px;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s, border-color .15s;
}
.col-actions button:hover { background: var(--surface-2); color: var(--text); border-color: var(--line); }
.col-actions button.is-saved { color: var(--teal); }

/* Row resizer */
.row-resizer {
  height: 6px;
  margin-top: -3px;
  margin-bottom: -3px;
  position: relative;
  z-index: 4;
  cursor: row-resize;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
}
.row-resizer::before {
  content: "";
  position: absolute;
  left: 0; right: 0; top: 50%; transform: translateY(-50%);
  height: 1px; background: var(--line);
  transition: background .2s, height .2s;
}
.row-resizer::after {
  content: "";
  width: 36px; height: 3px;
  border-radius: 2px;
  background: var(--line);
  opacity: 0;
  transition: opacity .2s, background .2s;
  position: relative; z-index: 1;
}
.row-resizer:hover::before,
.row-resizer.is-drag::before { background: var(--teal); height: 2px; }
.row-resizer:hover::after,
.row-resizer.is-drag::after { opacity: 1; background: var(--teal); }

/* Zone Reader */
.zone-reader {
  display: grid;
  grid-template-columns: var(--reader-l, 60%) 6px var(--reader-r, 40%);
  min-height: 0;
  overflow: hidden;
  background: var(--bg);
}

/* Col resizer */
.col-resizer {
  position: relative;
  cursor: col-resize;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  z-index: 4;
}
.col-resizer::before {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 1px; background: var(--line);
  transition: background .2s, width .2s;
}
.col-resizer::after {
  content: "";
  width: 3px; height: 36px;
  border-radius: 2px;
  background: var(--line);
  opacity: 0;
  transition: opacity .2s, background .2s;
  position: relative;
}
.col-resizer:hover::before,
.col-resizer.is-drag::before { background: var(--teal); width: 2px; }
.col-resizer:hover::after,
.col-resizer.is-drag::after { opacity: 1; background: var(--teal); }

/* PDF pane */
.pdf-pane {
  display: grid;
  grid-template-rows: 48px 1fr;
  background: var(--bg);
  min-width: 0; min-height: 0;
}
.pdf-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
  color: var(--text-3); font-size: 12.5px;
  flex-shrink: 0;
}
.pdf-file { display: inline-flex; align-items: center; gap: 10px; color: var(--text); }
.pdf-file-ic { color: var(--teal); display: inline-flex; }
.pdf-file-name {
  font-size: 13px; max-width: 32ch;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pdf-pg-num {
  margin-left: auto;
  font-family: var(--font-geist-mono, monospace); font-size: 11px;
  color: var(--text-3); letter-spacing: 0.06em;
}
.tbtn {
  appearance: none; background: transparent; border: 1px solid transparent;
  color: var(--text-3); width: 28px; height: 28px;
  border-radius: 7px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tbtn:hover { background: var(--surface); color: var(--text); border-color: var(--line); }
.pdf-divider { width: 1px; height: 18px; background: var(--line); margin: 0 4px; flex-shrink: 0; }
.pdf-zoom {
  font-family: var(--font-geist-mono, monospace); font-size: 11px;
  color: var(--text-3); width: 44px; text-align: center;
}
.pdf-scroll {
  overflow: auto;
  padding: 28px 28px 60px;
  position: relative;
  background-color: var(--bg);
}
html[data-theme="dark"] .pdf-scroll {
  background-image: radial-gradient(800px 500px at 50% 0%, rgba(78,205,196,0.04), transparent 60%);
}
html[data-theme="light"] .pdf-scroll {
  background-image: repeating-linear-gradient(45deg, transparent 0 22px, var(--line-soft) 22px 23px);
  background-size: 32px 32px;
}

/* PDF page */
.page {
  background: var(--pdf-bg);
  color: var(--pdf-ink);
  margin: 0 auto;
  width: min(700px, 100%);
  aspect-ratio: 8.5 / 11;
  padding: 56px 60px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 30px 60px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.04);
  font-family: "Spectral", "Times New Roman", serif;
  font-weight: 400; line-height: 1.5; font-size: 11.5px;
  position: relative; overflow: hidden;
}
.pg-header {
  display: flex; justify-content: space-between;
  font-family: var(--font-geist-sans, sans-serif);
  font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--pdf-mute);
  border-bottom: 0.5px solid var(--pdf-rule);
  padding-bottom: 6px; margin-bottom: 18px;
}
.paper-title {
  font-family: "Spectral", serif; font-weight: 600;
  font-size: 18px; line-height: 1.15;
  letter-spacing: -0.005em; color: var(--pdf-ink);
  text-wrap: balance;
  margin-bottom: 8px;
}
.paper-authors { font-family: "Spectral", serif; font-size: 10px; color: var(--pdf-mute); font-style: italic; margin-bottom: 4px; }
.paper-affil { font-family: var(--font-geist-sans, sans-serif); font-size: 7.5px; color: var(--pdf-mute); letter-spacing: 0.04em; margin-bottom: 18px; }
.abstract-label { font-family: var(--font-geist-sans, sans-serif); font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--pdf-mute); margin-bottom: 4px; }
.abstract { font-size: 10.5px; line-height: 1.55; margin-bottom: 16px; }
.body { column-count: 2; column-gap: 22px; font-size: 10px; line-height: 1.55; }
.body h3 { font-family: "Spectral", serif; font-weight: 600; font-size: 11px; margin: 0 0 6px; color: var(--pdf-ink); }
.body p { margin-bottom: 8px; text-align: justify; hyphens: auto; }
.ref { color: #2A6FDB; }
.eqn { display: block; text-align: center; font-style: italic; margin: 6px 0; color: var(--pdf-ink); }
.e-num { float: right; font-style: normal; color: var(--pdf-mute); }
.figure { break-inside: avoid; border: 0.5px solid var(--pdf-rule); padding: 10px; margin: 6px 0 10px; }
.fig-ph { height: 80px; background: repeating-linear-gradient(90deg, #EFEAE0 0 4px, #E8E2D4 4px 8px); border-radius: 2px; }
.fig-cap { margin-top: 6px; font-size: 8.5px; color: var(--pdf-mute); text-align: justify; font-family: var(--font-geist-sans, sans-serif); }
.pg-footer {
  position: absolute; left: 60px; right: 60px; bottom: 24px;
  display: flex; justify-content: space-between;
  font-family: var(--font-geist-sans, sans-serif);
  font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--pdf-mute);
  border-top: 0.5px solid var(--pdf-rule); padding-top: 6px;
}
mark.hl {
  background: var(--highlight);
  padding: 1px 2px; border-radius: 2px;
  color: inherit; cursor: pointer;
  transition: background .2s;
}
mark.hl:hover { background: rgba(78,205,196,0.45); }

/* AI pane */
.ai-pane { display: grid; grid-template-rows: 48px 1fr; background: var(--bg); min-width: 0; min-height: 0; }
.ai-tabs {
  display: flex; align-items: center; gap: 4px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.ai-tab {
  font-family: var(--font-geist-mono, monospace); font-size: 10.5px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--text-3);
  padding: 14px 10px; cursor: pointer;
  border-bottom: 1px solid transparent;
  margin-bottom: -1px;
  transition: color .2s, border-color .2s;
}
.ai-tab:hover { color: var(--text); }
.ai-tab.is-on { color: var(--teal); border-color: var(--teal); }
.ai-credit {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--text-4);
  font-family: var(--font-geist-mono, monospace); font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
}
.ai-orb {
  width: 14px; height: 14px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%),
    conic-gradient(from 180deg, #4ECDC4, #38B5AC, #6FE3DB, #4ECDC4);
  box-shadow: 0 0 8px rgba(78,205,196,.4);
}
.ai-body { overflow: auto; padding: 18px 18px 60px; display: grid; gap: 16px; align-content: start; }

/* AI cards */
.ai-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 16px 16px;
}
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-lbl {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-geist-mono, monospace); font-size: 10.5px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-3);
}
.card-ic {
  width: 20px; height: 20px; border-radius: 6px;
  background: var(--teal-soft); color: var(--teal);
  display: inline-flex; align-items: center; justify-content: center;
}
.card-conf {
  font-family: var(--font-geist-mono, monospace); font-size: 9.5px;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-4);
  display: inline-flex; align-items: center; gap: 6px;
}
.conf-bar {
  width: 36px; height: 3px; border-radius: 2px;
  background: var(--line-soft); position: relative; overflow: hidden;
}
.conf-bar span {
  position: absolute; inset: 0; height: 100%;
  background: linear-gradient(90deg, var(--teal-deep), var(--teal));
  border-radius: 2px;
}

/* kv rows */
.kv { display: grid; gap: 8px; }
.kv-row {
  display: grid; grid-template-columns: 1fr auto;
  align-items: baseline; gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--line-soft);
}
.kv-row:last-child { border-bottom: none; }
.kv-k { color: var(--text-3); font-size: 12.5px; font-weight: 300; }
.kv-v {
  font-family: var(--font-geist-mono, monospace); font-size: 12.5px;
  color: var(--text); text-align: right; font-variant-numeric: tabular-nums;
  display: inline-flex; align-items: center; gap: 6px;
}
.kv-link {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--teal); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; margin-left: 4px;
}

/* Material ratio bars */
.mat-row { display: grid; gap: 6px; padding: 8px 0; border-bottom: 1px dashed var(--line-soft); }
.mat-row:last-child { border-bottom: none; }
.mat-meta { display: flex; justify-content: space-between; align-items: baseline; }
.mat-name { font-size: 12.5px; color: var(--text); }
.mat-pct { font-family: var(--font-geist-mono, monospace); font-size: 12px; color: var(--text-2); font-variant-numeric: tabular-nums; }
.mat-bar { height: 4px; border-radius: 3px; background: var(--surface-3); overflow: hidden; position: relative; }
.mat-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; }
.mat-teal { background: linear-gradient(90deg, var(--teal-deep), var(--teal)); }
.mat-amber { background: linear-gradient(90deg, #B07A2E, var(--amber)); }
.mat-violet { background: linear-gradient(90deg, #6E58B0, var(--violet)); }

/* Stat table */
.stat-tbl { display: grid; grid-template-columns: 1fr auto auto auto; gap: 4px 12px; font-size: 12px; }
.stat-h {
  font-family: var(--font-geist-mono, monospace); font-size: 9.5px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-4);
  padding-bottom: 6px; border-bottom: 1px solid var(--line-soft);
}
.stat-h.r { text-align: right; }
.stat-cell { padding: 7px 0; border-bottom: 1px dashed var(--line-soft); color: var(--text-2); }
.stat-cell.n { text-align: right; font-family: var(--font-geist-mono, monospace); font-variant-numeric: tabular-nums; color: var(--text); }
.stat-cell.sig { color: var(--teal); }
.stat-cell.ns { color: var(--text-3); }

/* Citation list */
.cite-list { display: grid; gap: 6px; }
.cite-item {
  display: grid; grid-template-columns: 24px 1fr auto;
  gap: 10px; align-items: start;
  padding: 8px 8px 8px 4px; border-radius: 8px;
  cursor: pointer; transition: background .2s;
}
.cite-item:hover { background: var(--surface-2); }
.cite-n { font-family: var(--font-geist-mono, monospace); font-size: 10.5px; color: var(--text-4); padding-top: 2px; }
.cite-body { display: grid; gap: 3px; min-width: 0; }
.cite-t { font-size: 12.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cite-meta { font-size: 11px; color: var(--text-3); font-family: "Spectral", serif; font-style: italic; }
.cite-arrow { color: var(--text-4); padding-top: 4px; transition: transform .2s, color .2s; }
.cite-item:hover .cite-arrow { color: var(--teal); transform: translateX(2px); }

/* Annotation popover buttons */
.anno-btn {
  appearance: none; background: transparent; border: 1px solid transparent;
  color: var(--text-2); cursor: pointer;
  padding: 6px 10px; border-radius: 8px;
  display: inline-flex; align-items: center; gap: 6px;
  font-family: inherit; font-size: 12px;
  transition: background .2s, color .2s;
}
.anno-btn:hover { background: var(--surface-2); color: var(--text); border-color: var(--line); }
.anno-btn.primary { background: var(--teal); color: #0B3B38; border-color: var(--teal); }
.anno-btn.primary:hover { background: var(--teal-deep); }

/* Paper Metadata View */
.pmv {
  width: 100%; height: 100%;
  overflow: auto;
  padding: 36px 40px 56px;
  display: flex; flex-direction: column;
}
.pmv-badges {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin-bottom: 22px;
}
.pmv-chip {
  font-family: var(--font-geist-mono, monospace);
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--text-3); background: var(--surface);
  border: 1px solid var(--line); border-radius: 999px;
  padding: 4px 10px; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 5px;
}
.pmv-chip-teal {
  color: var(--teal); background: var(--teal-soft);
  border-color: rgba(78,205,196,0.3);
}
.pmv-ext-link {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--font-geist-mono, monospace);
  font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--teal); text-decoration: none;
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(78,205,196,0.3);
  background: var(--teal-soft);
  transition: background 0.15s;
}
.pmv-ext-link:hover { background: rgba(78,205,196,0.18); }
.pmv-title {
  font-size: 20px; font-weight: 300; line-height: 1.35;
  letter-spacing: -0.02em; color: var(--text);
  margin-bottom: 12px;
}
.pmv-authors {
  font-size: 13px; color: var(--text-3);
  font-style: italic; margin-bottom: 10px; line-height: 1.6;
}
.pmv-id {
  font-family: var(--font-geist-mono, monospace);
  font-size: 11px; letter-spacing: 0.06em;
  color: var(--text-4); margin-bottom: 24px;
  display: flex; align-items: center; gap: 6px;
}
.pmv-id-lbl {
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 4px; padding: 2px 5px; color: var(--text-4);
}
.pmv-rule {
  height: 1px; background: var(--line); margin-bottom: 20px;
}
.pmv-abstract-lbl {
  font-family: var(--font-geist-mono, monospace);
  font-size: 9.5px; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--text-4); margin-bottom: 10px;
}
.pmv-abstract {
  font-size: 13.5px; line-height: 1.75; color: var(--text-2);
  font-weight: 300; margin-bottom: 32px;
  max-width: 66ch;
}
.pmv-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 28px 0; color: var(--text-4);
  font-size: 13px; margin-bottom: 28px;
}
.pmv-upload {
  display: inline-flex; align-items: center; gap: 8px;
  cursor: pointer; align-self: flex-start;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 10px; color: var(--text-3);
  font-size: 12.5px; font-family: inherit;
  padding: 9px 14px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.pmv-upload:hover { background: var(--surface-2); border-color: var(--text-4); color: var(--text); }

@keyframes modal-spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 1180px) {
  .tbl-head, .tbl-row { grid-template-columns: minmax(0,2.2fr) 80px 100px 130px !important; }
  .col-authors, .col-journal, .col-tags { display: none !important; }
  .th-hide-sm { display: none !important; }
}
@media (max-width: 980px) {
  .zone-reader { grid-template-columns: 1fr !important; }
  .ai-pane, .col-resizer { display: none !important; }
}
`;
