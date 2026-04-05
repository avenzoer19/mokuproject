"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { callGemini, searchCrossRef } from "@/lib/gemini";

// ============ CONSTANTS ============
const STORAGE_KEY = "laprak-ai-v3";
const HISTORY_KEY = "laprak-history";

export function saveLaprakToHistory(data) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const entry = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      title: data.judulLaporan || data.topikPraktikum || "Laprak tanpa judul",
      mataKuliah: data.mataKuliah || "",
      tanggal: data.tanggalPraktikum || "",
      snippet: data.pendahuluan?.substring(0, 200) || "",
      data: { ...data, fotoResults: [] },
    };
    const updated = [entry, ...history.filter(h => h.id !== entry.id)].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { }
}
const UNAIR_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAACzY+a1AAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAACpLklEQVR42u";
const PROFILE_DEFAULT = { nama: "", nim: "", kelompok: "", kelas: "", prodi: "", fakultas: "", universitas: "", tahun: "2026" };
const C_LIGHT = { navy: "#7c5ce7", gold: "#f0a030", bg: "#fffcf7", card: "#ffffff", card2: "#faf5ec", border: "#ede5d5", input: "#ffffff", inputB: "#ddd6c8", text: "#1b1622", muted: "#665e72", accent: "#7c5ce7", accent2: "#9f8df7", green: "#22c980", yellow: "#f0a030", red: "#e94560", white: "#1b1622" };
const C_DARK = { navy: "#a78bfa", gold: "#fbbf24", bg: "#0e0c15", card: "#1a1628", card2: "#151222", border: "#2d2644", input: "#1a1628", inputB: "#2d2644", text: "#f0ecfa", muted: "#9088a8", accent: "#a78bfa", accent2: "#c4b5fd", green: "#34d399", yellow: "#fbbf24", red: "#fb7185", white: "#f0ecfa" };
let C = C_LIGHT;
const shimmer = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`;


const formatAPA = r => `${r.authors} (${r.year}). ${r.title}. ${r.journal}${r.doi ? `. https://doi.org/${r.doi}` : ""}`;
const tierBadge = t => t === "fulltext" ? "✅ Full-text" : t === "abstract" ? "📋 Abstract" : "⚠️ Metadata";
const tierColor = t => t === "fulltext" ? C.green : t === "abstract" ? C.yellow : C.red;

// ============ VALIDATION LAYER (Upgrade #5) ============
function validateData(tabels) {
  const warnings = [];
  (tabels || []).forEach((tbl, ti) => {
    tbl.rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (ci === 0) return; // skip No column
        const num = parseFloat(cell);
        if (isNaN(num) || !cell) return;
        // Collect all numeric values in this column
        const colVals = tbl.rows.map(r => parseFloat(r[ci])).filter(v => !isNaN(v));
        if (colVals.length < 3) return;
        const mean = colVals.reduce((a, b) => a + b, 0) / colVals.length;
        const sd = Math.sqrt(colVals.reduce((a, b) => a + (b - mean) ** 2, 0) / colVals.length);
        if (sd > 0 && Math.abs(num - mean) > 5 * sd) {
          warnings.push({ tabel: tbl.title, row: ri + 1, col: tbl.headers[ci], value: num, mean: mean.toFixed(2), sd: sd.toFixed(2), msg: `Nilai ${num} menyimpang >5σ dari mean (${mean.toFixed(2)} ± ${sd.toFixed(2)})` });
        }
        if (num < 0 && colVals.filter(v => v >= 0).length > colVals.length * 0.8) {
          warnings.push({ tabel: tbl.title, row: ri + 1, col: tbl.headers[ci], value: num, msg: `Nilai negatif (${num}) di kolom yang mayoritas positif — kemungkinan typo?` });
        }
      });
    });
  });
  return warnings;
}

// ============ CONFIDENCE SCORE (Upgrade #6) ============
function calcConfidence(data) {
  const reasons = [];
  let score = 100;
  // Data reliability
  (data.hasilTabels || []).forEach(tbl => {
    tbl.rows.forEach(row => {
      row.forEach((cell, ci) => {
        if (ci === 0) return;
        const colVals = tbl.rows.map(r => parseFloat(r[ci])).filter(v => !isNaN(v));
        if (colVals.length < 2) return;
        const mean = colVals.reduce((a, b) => a + b, 0) / colVals.length;
        const cv = mean !== 0 ? (Math.sqrt(colVals.reduce((a, b) => a + (b - mean) ** 2, 0) / colVals.length) / Math.abs(mean)) * 100 : 0;
        if (cv > 50) { score -= 5; reasons.push(`High variance in ${tbl.title} col ${tbl.headers[ci]} (CV=${cv.toFixed(0)}%)`); }
      });
    });
  });
  // Reference integrity
  const refs = data.selectedRefs || [];
  const ftCount = refs.filter(r => r.tier === "fulltext").length;
  const metaCount = refs.filter(r => r.tier === "metadata").length;
  if (refs.length === 0) { score -= 20; reasons.push("No references"); }
  else if (ftCount === 0 && metaCount > 0) { score -= 10; reasons.push(`${metaCount} metadata-only refs (no full-text)`); }
  if (refs.length < 3) { score -= 5; reasons.push("Less than 3 references"); }
  // Math sync
  const hasAnalisis = data.enableAnalisis && (data.analisisBlocks || []).some(b => b.hasil);
  const hasDeterministic = (data.analisisBlocks || []).some(b => b.deterministicResult);
  if (hasAnalisis && !hasDeterministic) { score -= 10; reasons.push("Analysis not verified by Deterministic Engine"); }
  // Pembahasan exists
  if (!data.pembahasan) { score -= 15; reasons.push("No pembahasan generated"); }
  if (!data.abstrak) { score -= 5; reasons.push("No abstrak"); }
  return { score: Math.max(0, Math.min(100, score)), reasons: [...new Set(reasons)] };
}

// ============ DETERMINISTIC MATH ENGINE (Upgrade #2) ============
async function runDeterministicCalc(equation, instruksi, tabelData, prevResult) {
  // Step 1: Ask Gemini to generate JS code
  const codePrompt = `Kamu adalah code generator. Tugas: HANYA tulis JavaScript function yang menghitung berdasarkan rumus dan data.

RUMUS: ${equation}
INSTRUKSI: ${instruksi || "Hitung sesuai rumus"}
DATA: ${tabelData}
${prevResult ? `HASIL SEBELUMNYA: ${prevResult}` : ""}

RULES:
- Output HANYA JavaScript code, TANPA penjelasan, TANPA markdown backticks
- Function harus bernama 'calculate' dan return object: { cleanResult: "string ringkas (rumus+variabel+hasil)", workingSheet: "string detail step-by-step", tables: [{title,headers,rows}] }
- cleanResult: HANYA rumus, variabel input, dan hasil akhir (Mean ± SD format)
- workingSheet: SEMUA step perhitungan detail
- tables: jika hasil berupa tabel (misal distribusi frekuensi), masukkan sebagai array of {title, headers, rows}
- Parse data string jadi angka, hitung dengan presisi penuh
- Gunakan Math.sqrt, Math.log10, dll untuk operasi matematika`;

  const jsCode = await callGemini("Kamu code generator JavaScript. Output HANYA code tanpa backticks/markdown.", codePrompt);

  // Step 2: Execute the code deterministically
  try {
    const cleanCode = jsCode.replace(/```javascript|```js|```/g, "").trim();
    const fn = new Function(cleanCode + "\nreturn calculate();");
    const result = fn();
    return { success: true, ...result };
  } catch (e) {
    return { success: false, cleanResult: `Error eksekusi: ${e.message}`, workingSheet: `Code yang di-generate:\n${jsCode}\n\nError: ${e.message}`, tables: [] };
  }
}

// ============ UI COMPONENTS ============
const s = {
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px 22px", marginBottom: 14, animation: "fadeIn .3s ease" },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1.2 },
  input: { width: "100%", padding: "9px 13px", background: C.input, border: `1px solid ${C.inputB}`, borderRadius: 12, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 13px", background: C.input, border: `1px solid ${C.inputB}`, borderRadius: 12, color: C.text, fontSize: 13, outline: "none", minHeight: 110, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 },
  btn: { padding: "8px 18px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .15s", letterSpacing: .3 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
};

function DInput({ value: ev, onCommit, style: es, ...props }) {
  const [l, setL] = useState(ev || ""); const f = useRef(false);
  useEffect(() => { if (!f.current) setL(ev || ""); }, [ev]);
  return <input style={{ ...s.input, ...es }} value={l} onChange={e => setL(e.target.value)} onFocus={() => { f.current = true; }} onBlur={() => { f.current = false; onCommit(l); }} {...props} />;
}
function DTextarea({ value: ev, onCommit, style: es, ...props }) {
  const [l, setL] = useState(ev || ""); const f = useRef(false);
  useEffect(() => { if (!f.current) setL(ev || ""); }, [ev]);
  return <textarea style={{ ...s.textarea, ...es }} value={l} onChange={e => setL(e.target.value)} onFocus={() => { f.current = true; }} onBlur={() => { f.current = false; onCommit(l); }} {...props} />;
}
function Card({ title, icon, children, action, gold }) {
  return (<div style={s.card}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: title ? 14 : 0, flexWrap: "wrap", gap: 8 }}>{title && <h3 style={{ color: gold ? C.gold : C.white, margin: 0, fontSize: 15, fontWeight: 700 }}>{icon} {title}</h3>}{action}</div>{children}</div>);
}
function Btn({ children, variant = "primary", ...props }) {
  const v = { primary: { background: C.accent, color: "#fff" }, secondary: { background: "transparent", color: C.accent, border: `1px solid ${C.accent}` }, success: { background: C.green, color: "#fff" }, gold: { background: C.gold, color: C.navy }, danger: { background: C.red, color: "#fff" }, ghost: { background: "rgba(255,255,255,.05)", color: C.muted } };
  return <button style={{ ...s.btn, ...v[variant] }} {...props}>{children}</button>;
}

// Confidence Badge (Upgrade #6 — INTERNAL ONLY)
function ConfidenceBadge({ data }) {
  const { score, reasons } = calcConfidence(data);
  const [open, setOpen] = useState(false);
  const color = score >= 80 ? C.green : score >= 60 ? C.yellow : C.red;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen(!open)} style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 12, padding: "4px 10px", cursor: "pointer", fontSize: 10, color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
        🔍 Internal Audit: {score}%
      </div>
      {open && reasons.length > 0 && (
        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, minWidth: 250, zIndex: 10, fontSize: 10, color: C.muted }}>
          <div style={{ fontWeight: 700, color: C.white, marginBottom: 6 }}>Confidence Breakdown:</div>
          {reasons.map((r, i) => <div key={i} style={{ marginBottom: 3 }}>• {r}</div>)}
          <div style={{ marginTop: 6, fontSize: 9, color: C.muted, fontStyle: "italic" }}>⚠️ Internal only — tidak masuk .docx</div>
        </div>
      )}
    </div>
  );
}

// ============ TABLE BUILDER ============
function TableBuilder({ value, onChange }) {
  const [mode, setMode] = useState("build");
  const [pasteText, setPasteText] = useState("");
  const [local, setLocal] = useState(value);
  const isFocused = useRef(false);
  useEffect(() => { if (!isFocused.current) setLocal(value); }, [value]);
  const flush = () => { isFocused.current = false; onChange(local); };
  const addRow = () => { const n = { ...local, rows: [...local.rows, local.headers.map(() => "")] }; setLocal(n); onChange(n); };
  const addCol = () => { const h = prompt("Nama kolom:"); if (!h) return; const n = { headers: [...local.headers, h], rows: local.rows.map(r => [...r, ""]) }; setLocal(n); onChange(n); };
  const rmRow = i => { const n = { ...local, rows: local.rows.filter((_, x) => x !== i) }; setLocal(n); onChange(n); };
  const rmCol = i => { const n = { headers: local.headers.filter((_, x) => x !== i), rows: local.rows.map(r => r.filter((_, x) => x !== i)) }; setLocal(n); onChange(n); };
  const updCell = (ri, ci, v) => setLocal(p => ({ ...p, rows: p.rows.map((r, x) => x === ri ? r.map((c, y) => y === ci ? v : c) : r) }));
  const updHdr = (i, v) => setLocal(p => ({ ...p, headers: p.headers.map((h, x) => x === i ? v : h) }));
  const parsePaste = () => { if (!pasteText.trim()) return; const lines = pasteText.trim().split("\n").map(l => l.split("\t").map(c => c.trim())); if (lines.length < 2) return; const n = { headers: lines[0], rows: lines.slice(1) }; setLocal(n); onChange(n); setMode("build"); };

  return (<div>
    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}><Btn variant={mode === "build" ? "primary" : "ghost"} onClick={() => setMode("build")}>📊 Builder</Btn><Btn variant={mode === "paste" ? "primary" : "ghost"} onClick={() => setMode("paste")}>📋 Paste</Btn></div>
    {mode === "paste" ? (<div><p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px" }}>Paste dari Excel (tab-separated). Baris 1 = header.</p><textarea style={{ ...s.textarea, minHeight: 80 }} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste..." /><Btn variant="success" onClick={parsePaste} style={{ marginTop: 8 }}>✓ Parse</Btn></div>) : (
      <div><div style={{ overflowX: "auto", marginBottom: 8 }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}><thead><tr><th style={{ padding: "4px", color: C.muted, fontSize: 10, width: 24 }}>#</th>
        {local.headers.map((h, i) => (<th key={i} style={{ padding: 3, position: "relative" }}><input style={{ ...s.input, fontSize: 11, fontWeight: 700, padding: "4px 6px", textAlign: "center" }} value={h} onChange={e => updHdr(i, e.target.value)} onFocus={() => { isFocused.current = true; }} onBlur={flush} />{local.headers.length > 1 && <button onClick={() => rmCol(i)} style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: C.red, color: "#fff", border: "none", fontSize: 8, cursor: "pointer" }}>✕</button>}</th>))}
        <th style={{ width: 24 }}></th></tr></thead><tbody>
          {local.rows.map((row, ri) => (<tr key={ri}><td style={{ color: C.muted, fontSize: 10, textAlign: "center" }}>{ri + 1}</td>
            {row.map((cell, ci) => (<td key={ci} style={{ padding: 2 }}><input style={{ ...s.input, fontSize: 12, padding: "4px 6px" }} value={cell} onChange={e => updCell(ri, ci, e.target.value)} onFocus={() => { isFocused.current = true; }} onBlur={flush} /></td>))}
            <td><button onClick={() => rmRow(ri)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11 }}>✕</button></td></tr>))}
        </tbody></table></div><div style={{ display: "flex", gap: 6 }}><Btn variant="ghost" onClick={addRow}>+ Baris</Btn><Btn variant="ghost" onClick={addCol}>+ Kolom</Btn></div></div>)}
  </div>);
}

// ============ ANALISIS BLOCK V3 (Deterministic Engine) ============
function AnalisisBlock({ index, value, total, onChange, onRemove, allTabels }) {
  const fRef = useRef(null);
  const [calculating, setCalculating] = useState(false);
  const [showWorking, setShowWorking] = useState(false);

  const handleFoto = (e) => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => { onChange({ ...value, fotoRumus: { name: file.name, type: file.type, data: ev.target.result.split(",")[1], preview: ev.target.result } }); }; r.readAsDataURL(file); };

  const autoCalc = async () => {
    setCalculating(true);
    const tabelData = (allTabels || []).map(t => `${t.title}:\n${t.headers.join(" | ")}\n${t.rows.map(r => r.join(" | ")).join("\n")}`).join("\n\n");
    const result = await runDeterministicCalc(value.equation, value.instruksi, tabelData, index > 0 ? value.prevResult : "");
    onChange({ ...value, hasil: result.cleanResult || "", workingSheet: result.workingSheet || "", deterministicResult: true, resultTables: result.tables || [] });
    setCalculating(false);
  };

  return (
    <div style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>📐 Analisis {index + 1}{index > 0 ? ` (chain dari #${index})` : ""}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {value.deterministicResult && <span style={{ fontSize: 9, color: C.green, background: "rgba(13,186,115,.1)", padding: "2px 6px", borderRadius: 6 }}>✓ JS-Verified</span>}
          {total > 1 && <button onClick={onRemove} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11 }}>🗑️</button>}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={s.label}>Foto Rumus (opsional)</label>
        <input ref={fRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="ghost" onClick={() => fRef.current?.click()} style={{ fontSize: 10, padding: "4px 10px" }}>📷 Upload</Btn>
          {value.fotoRumus && (<div style={{ position: "relative" }}><img src={value.fotoRumus.preview} alt="" style={{ height: 45, borderRadius: 6, border: `1px solid ${C.border}` }} /><button onClick={() => onChange({ ...value, fotoRumus: null })} style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: C.red, color: "#fff", border: "none", fontSize: 8, cursor: "pointer" }}>✕</button></div>)}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}><label style={s.label}>Rumus / Equation</label><DInput value={value.equation} onCommit={v => onChange({ ...value, equation: v })} placeholder="Z = V/I, k = 1 + 3.322·log(n), σ = √(Σ(xi-μ)²/N)" /></div>
      <div style={{ marginBottom: 8 }}><label style={s.label}>Instruksi Perhitungan</label><DInput value={value.instruksi || ""} onCommit={v => onChange({ ...value, instruksi: v })} placeholder="Hitung mean tiap sisi, lalu Sturges, lalu distribusi frekuensi..." /></div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Clean Result (masuk laporan)</label>
          <Btn variant="primary" onClick={autoCalc} disabled={calculating} style={{ padding: "4px 12px", fontSize: 10 }}>{calculating ? "⏳ Computing..." : "🔧 Deterministic Calculate"}</Btn>
        </div>
        <DTextarea value={value.hasil} onCommit={v => onChange({ ...value, hasil: v })} style={{ minHeight: 60 }} placeholder="Klik Deterministic Calculate..." />
      </div>
      {value.workingSheet && (
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => setShowWorking(!showWorking)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 11, padding: 0 }}>{showWorking ? "▼" : "▶"} Working Sheet (detail — tidak masuk laporan)</button>
          {showWorking && <div style={{ background: "rgba(0,0,0,.3)", borderRadius: 12, padding: 10, marginTop: 6, fontSize: 11, color: C.muted, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", fontFamily: "'JetBrains Mono', monospace" }}>{value.workingSheet}</div>}
        </div>
      )}
      {value.resultTables?.length > 0 && value.resultTables.map((rt, rti) => (
        <div key={rti} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 4 }}>{rt.title || `Tabel Hasil ${rti + 1}`}</div>
          <div style={{ overflowX: "auto", fontSize: 11 }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead><tr>{(rt.headers || []).map((h, i) => <th key={i} style={{ padding: "4px 8px", background: "rgba(45,127,249,.1)", border: `1px solid ${C.border}`, color: C.text, fontSize: 10 }}>{h}</th>)}</tr></thead>
              <tbody>{(rt.rows || []).map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ padding: "3px 8px", border: `1px solid ${C.border}`, color: C.text, fontSize: 10 }}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      ))}
      <div><label style={s.label}>Keterangan</label><DInput value={value.keterangan} onCommit={v => onChange({ ...value, keterangan: v })} placeholder="Interpretasi singkat..." /></div>
    </div>
  );
}

// ============ REF MANAGER V3 (3-Tier + PDF Upload) ============
function RefManager({ selectedRefs, onRefsChange }) {
  const [query, setQuery] = useState(""); const [results, setResults] = useState([]); const [busy, setBusy] = useState(false);
  const [localRefs, setLocalRefs] = useState(selectedRefs || []); const [uploading, setUploading] = useState(false); const [uploadMsg, setUploadMsg] = useState("");
  const onRefsRef = useRef(onRefsChange); onRefsRef.current = onRefsChange;
  const pdfRef = useRef(null);
  const prevLen = useRef(selectedRefs?.length);
  useEffect(() => { if (selectedRefs?.length !== prevLen.current) { setLocalRefs(selectedRefs || []); prevLen.current = selectedRefs?.length; } }, [selectedRefs]);

  const doSearch = async () => { if (!query.trim()) return; setBusy(true); setResults(await searchCrossRef(query)); setBusy(false); };
  const handleAdd = (r) => { if (localRefs.find(x => x.doi === r.doi && x.title === r.title)) return; const next = [...localRefs, r]; setLocalRefs(next); onRefsRef.current(next); };
  const handleRemove = (i) => { const next = localRefs.filter((_, x) => x !== i); setLocalRefs(next); onRefsRef.current(next); };

  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    let accumulated = [...localRefs];

    for (let fi = 0; fi < files.length; fi++) {
      const file = files[fi];
      setUploadMsg(`Reading PDF ${fi + 1}/${files.length}: ${file.name}...`);
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target.result.split(",")[1]);
          reader.onerror = () => reject(new Error("Read failed"));
          reader.readAsDataURL(file);
        });

        const extracted = await callGemini(
          `You are an academic paper analyzer. Read this PDF thoroughly. Extract information into a JSON object.

CRITICAL JSON RULES:
- Return ONLY the JSON object, nothing else
- NO markdown backticks
- Use double quotes for all keys and string values
- ESCAPE all double quotes inside values with backslash
- Keep each value as a SINGLE LINE string (no actual line breaks inside values, use spaces instead)

JSON format:
{"title":"paper title","authors":"Author1, A., Author2, B.","year":"2024","journal":"Journal Name","doi":"DOI or empty","abstract":"full abstract as single line","introduction":"3-5 sentence summary of intro and objectives","methodology":"detailed methods: materials, procedures, parameters, equipment","results":"all key results with numerical values and measurements","discussion":"main discussion points and interpretations","conclusions":"main conclusions","keyFindings":"5-8 specific findings with data points","relevantData":"key quantitative data for comparison","limitations":"limitations mentioned"}`,
          "Extract all scientific content from this paper PDF as valid JSON.",
          [{ type: "application/pdf", data: base64 }]);

        // Check if Gemini returned an error
        if (extracted.startsWith("Error")) {
          alert(`Gemini error untuk ${file.name}: ${extracted}`);
          continue;
        }

        let meta = null;
        try {
          // Try 1: direct parse after cleanup
          const clean = extracted.replace(/```json|```/g, "").trim();
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          if (jsonMatch) meta = JSON.parse(jsonMatch[0]);
        } catch (e1) {
          try {
            // Try 2: fix common JSON issues - unescaped newlines, control chars
            const fixed = extracted.replace(/```json|```/g, "").trim()
              .replace(/\{[\s\S]*\}/, m => m.replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' '));
            const jsonMatch2 = fixed.match(/\{[\s\S]*\}/);
            if (jsonMatch2) meta = JSON.parse(jsonMatch2[0]);
          } catch (e2) {
            try {
              // Try 3: extract fields manually with regex
              const getText = (key) => { const m = extracted.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)); return m ? m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"') : ""; };
              meta = { title: getText("title"), authors: getText("authors"), year: getText("year"), journal: getText("journal"), doi: getText("doi"), abstract: getText("abstract"), introduction: getText("introduction"), methodology: getText("methodology"), results: getText("results"), discussion: getText("discussion"), conclusions: getText("conclusions"), keyFindings: getText("keyFindings"), relevantData: getText("relevantData"), limitations: getText("limitations") };
              if (!meta.title) meta = null;
            } catch { }
          }
        }

        if (meta) {
          const ref = {
            title: meta.title || file.name.replace(".pdf", ""),
            authors: meta.authors || "Unknown",
            year: meta.year || "n.d.",
            journal: meta.journal || "",
            doi: meta.doi || "",
            abstract: meta.abstract || "",
            introduction: meta.introduction || "",
            methodology: meta.methodology || "",
            results: meta.results || "",
            discussion: meta.discussion || "",
            conclusions: meta.conclusions || "",
            keyFindings: meta.keyFindings || "",
            relevantData: meta.relevantData || "",
            limitations: meta.limitations || "",
            tier: "fulltext",
            source: "PDF Upload"
          };
          accumulated = [...accumulated, ref];
          setLocalRefs(accumulated);
          onRefsRef.current(accumulated);
        } else {
          alert(`Gagal parse dari: ${file.name}\n\nResponse preview:\n${extracted.substring(0, 200)}`);
          console.error("Full response for", file.name, ":", extracted);
        }
      } catch (err) {
        alert(`Error reading ${file.name}: ${err.message}`);
      }
    }
    setUploading(false);
    setUploadMsg("");
    if (pdfRef.current) pdfRef.current.value = "";
  };

  return (<>
    <Card title="Referensi Jurnal" icon="🔍" gold action={<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input ref={pdfRef} type="file" accept=".pdf" multiple onChange={handlePdfUpload} style={{ display: "none" }} />
      <Btn variant="secondary" onClick={() => pdfRef.current?.click()} disabled={uploading} style={{ fontSize: 10, padding: "4px 10px" }}>{uploading ? `⏳ ${uploadMsg || "Reading..."}` : "📄 Upload PDF (multi)"}</Btn>
      <span style={{ fontSize: 9, color: C.green }}>CrossRef + PDF</span>
    </div>}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <input style={{ ...s.input, flex: 1 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search CrossRef..." onKeyDown={e => e.key === "Enter" && doSearch()} />
        <Btn onClick={doSearch} disabled={busy}>{busy ? "⏳" : "Cari"}</Btn>
      </div>
      {results.map((r, i) => {
        const added = localRefs.some(x => x.doi === r.doi); return (
          <div key={i} style={{ background: added ? "rgba(13,186,115,.15)" : "rgba(13,186,115,.06)", border: `1px solid rgba(13,186,115,.15)`, borderRadius: 12, padding: 10, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3, flex: 1 }}>{r.title}</div>
              <span style={{ fontSize: 9, color: tierColor(r.tier), fontWeight: 700, flexShrink: 0 }}>{tierBadge(r.tier)}</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>{r.authors} ({r.year}) — {r.journal}</div>
            {added ? <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>✓ Added</span> : <Btn variant="success" onClick={() => handleAdd(r)} style={{ padding: "3px 10px", fontSize: 10, marginTop: 4 }}>+ Tambah</Btn>}
          </div>);
      })}
    </Card>
    <Card title={`Referensi Terpilih (${localRefs.length})`} icon="📚" gold>
      {!localRefs.length && <p style={{ color: C.muted, fontSize: 12 }}>Cari di CrossRef atau upload PDF paper.</p>}
      {localRefs.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(45,127,249,.05)", border: `1px solid rgba(45,127,249,.12)`, borderRadius: 12, padding: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: tierColor(r.tier), fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{tierBadge(r.tier)}</span>
          <div style={{ flex: 1, fontSize: 11, color: C.text, lineHeight: 1.5 }}>[{i + 1}] {formatAPA(r)}</div>
          <button onClick={() => handleRemove(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </Card>
  </>);
}

// ============ MAIN APP ============
export default function LaprakAI() {
  const __t = useTheme();
  C = __t.mode === "dark" ? C_DARK : C_LIGHT;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [customLogo, setCustomLogo] = useState(null); // {data: base64, preview: dataURL}
  const logoUpRef = useRef(null);
  const [data, setData] = useState({
    // Profil
    nama: "", nim: "", kelompok: "", kelas: "", prodi: "", fakultas: "", universitas: "", tahun: "2026",
    // Praktikum
    mataKuliah: "", topikPraktikum: "", judulLaporan: "", tanggalPraktikum: "", dosenPengampu: "", asisten: "",
    selectedRefs: [], pendahuluan: "", studiPustaka: "",
    alatBahan: "", prosedur: "",
    hasilNaratif: "", hasilTabels: [{ title: "Tabel 1", headers: ["No", "Parameter", "Nilai", "Satuan"], rows: [["1", "", "", ""]] }],
    fotoResults: [],
    enableAnalisis: false, analisisBlocks: [{ equation: "", instruksi: "", fotoRumus: null, hasil: "", workingSheet: "", keterangan: "", deterministicResult: false, resultTables: [] }],
    summaryFindings: "", preFeedback: "", userFeedback: "", pembahasan: "", kesimpulan: "", abstrak: "", revisiInstruksi: "",
  });
  const [saved, setSaved] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const fileRef = useRef(null);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Load
  useEffect(() => {
    (async () => {
      try { const r = localStorage.getItem(STORAGE_KEY); if (r) { setData(prev => ({ ...prev, ...JSON.parse(r) })); setSaved("Loaded"); setTimeout(() => setSaved(""), 2000); } } catch { }
      try { const h = localStorage.getItem(HISTORY_KEY); if (h) setHistory(JSON.parse(h)); } catch { }
    })();
  }, []);

  const saveToStorage = useCallback(async (d) => {
    try {
      const o = { ...(d || dataRef.current) };
      delete o.fotoResults;
      if (o.selectedRefs) o.selectedRefs = o.selectedRefs.map(r => { const { pdfData, ...rest } = r; return rest; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
      setSaved("✓"); setTimeout(() => setSaved(""), 1200);
    } catch { }
  }, []);

  const saveToHistory = useCallback(() => {
    try {
      const o = { ...dataRef.current, fotoResults: [] };
      if (o.selectedRefs) o.selectedRefs = o.selectedRefs.map(r => { const { pdfData, ...rest } = r; return rest; });
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const entry = {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        title: o.judulLaporan || o.topikPraktikum || "Laprak tanpa judul",
        mataKuliah: o.mataKuliah || "",
        tanggal: o.tanggalPraktikum || "",
        snippet: o.pendahuluan?.substring(0, 200) || "",
        data: o,
      };
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, 20)));
      setSaved("Saved to history ✓"); setTimeout(() => setSaved(""), 2000);
    } catch { }
  }, []);
  const changeStep = useCallback((n) => { saveToStorage(); setStep(n); }, [saveToStorage]);
  const upd = useCallback((k, v) => { setData(prev => ({ ...prev, [k]: v })); }, []);
  const handlePhoto = (e) => { Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload = ev => { setData(prev => ({ ...prev, fotoResults: [...prev.fotoResults, { name: f.name, type: f.type, data: ev.target.result.split(",")[1], preview: ev.target.result }] })); }; r.readAsDataURL(f); }); };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => setCustomLogo({ preview: ev.target.result, data: ev.target.result.split(",")[1], type: file.type });
    r.readAsDataURL(file);
  };

  const tableToText = () => (data.hasilTabels || []).map((t, i) => { if (!t.rows.some(r => r.some(c => c))) return ""; return `${t.title}:\n${t.headers.join(" | ")}\n${t.rows.map(r => r.join(" | ")).join("\n")}`; }).filter(Boolean).join("\n\n");
  const analisisCleanText = () => { if (!data.enableAnalisis) return ""; return (data.analisisBlocks || []).map((b, i) => { const p = []; if (b.equation) p.push(`Rumus: ${b.equation}`); if (b.hasil) p.push(b.hasil); if (b.keterangan) p.push(`Keterangan: ${b.keterangan}`); return p.length ? `Analisis ${i + 1}:\n${p.join("\n")}` : ""; }).filter(Boolean).join("\n\n"); };

  // Build ref context for AI — full-text refs get comprehensive content
  const refContext = () => (data.selectedRefs || []).map(r => {
    let ctx = `- ${r.authors} (${r.year}). ${r.title}. ${r.journal} [${tierBadge(r.tier)}]`;
    if (r.tier === "fulltext") {
      if (r.abstract) ctx += `\n  Abstract: ${r.abstract}`;
      if (r.introduction) ctx += `\n  Introduction: ${r.introduction}`;
      if (r.methodology) ctx += `\n  Methodology: ${r.methodology}`;
      if (r.results) ctx += `\n  Results: ${r.results}`;
      if (r.discussion) ctx += `\n  Discussion: ${r.discussion}`;
      if (r.conclusions) ctx += `\n  Conclusions: ${r.conclusions}`;
      if (r.keyFindings) ctx += `\n  Key Findings: ${r.keyFindings}`;
      if (r.relevantData) ctx += `\n  Data: ${r.relevantData}`;
    } else {
      if (r.abstract) ctx += `\n  Abstract: ${r.abstract.substring(0, 400)}`;
      if (r.keyFindings) ctx += `\n  Key Findings: ${r.keyFindings.substring(0, 300)}`;
    }
    return ctx;
  }).join("\n\n");

  const SYS = `Kamu asisten akademik Teknik Biomedis UNAIR. Bahasa Indonesia akademik formal. TANPA markdown (##, **, dll). Teks paragraf biasa. Data user IMMUTABLE. JUJUR tentang level pengetahuan referensi: jika hanya punya metadata/judul, JANGAN pura-pura sudah baca isi paper. Tandai: [✅ Full-text] atau [📋 Abstract] atau [⚠️ Metadata only] di setiap kutipan.`;

  // AI Generate functions
  const generateStep2 = async () => {
    setLoading(true);
    setLoadingMsg("Generating Pendahuluan...");
    const pendResult = await callGemini(SYS, `Buatkan HANYA bagian PENDAHULUAN untuk laporan praktikum:
- Mata Kuliah: ${data.mataKuliah}, Topik: ${data.topikPraktikum}, Judul: ${data.judulLaporan}

Isi: Latar belakang topik, tujuan praktikum, manfaat praktikum. 3-4 paragraf.
Referensi: ${refContext() || "Belum ada."}
JANGAN tulis Studi Pustaka di sini. HANYA Pendahuluan. TANPA header "PENDAHULUAN:" di awal.`);
    upd("pendahuluan", pendResult.replace(/^PENDAHULUAN[:\s]*/i, "").trim());

    setLoadingMsg("Generating Studi Pustaka...");
    const spResult = await callGemini(SYS, `Buatkan HANYA bagian STUDI PUSTAKA untuk laporan praktikum:
- Mata Kuliah: ${data.mataKuliah}, Topik: ${data.topikPraktikum}, Judul: ${data.judulLaporan}

Isi: 5 sub-bab (A-E) yang relevan dengan topik, masing-masing 2-3 paragraf.
Referensi: ${refContext() || "Belum ada."}
JANGAN tulis Pendahuluan. HANYA Studi Pustaka. TANPA header "STUDI PUSTAKA:" di awal.
Format: A. [Judul]\n[teks]\n\nB. [Judul]\n[teks]\n...sampai E.`);
    upd("studiPustaka", spResult.replace(/^STUDI PUSTAKA[:\s]*/i, "").trim());
    setLoading(false);
  };

  const generateSummary = async () => {
    setLoading(true); setLoadingMsg("Running validation & analysis...");
    // Upgrade #5: Run validation first
    const w = validateData(data.hasilTabels);
    setWarnings(w);
    setLoadingMsg("Agent analyzing data vs literature...");
    const imgs = data.fotoResults.slice(0, 4).map(f => ({ type: f.type, data: f.data }));
    let visionDesc = "";
    if (imgs.length > 0) { setLoadingMsg("Vision AI analyzing photos..."); visionDesc = await callGemini("Deskripsikan detail ilmiah gambar hasil praktikum. Bahasa Indonesia.", `Topik: "${data.topikPraktikum}":`, imgs); }
    const result = await callGemini(SYS, `Research Agent. Tugas:
1. Analisis data IMMUTABLE
2. Bandingkan dengan literatur (JUJUR tentang tier referensi)
3. Identifikasi anomali
4. Hipotesis penyebab teknis
${data.preFeedback ? `\n⭐ ARAHAN USER (PRIORITAS UTAMA — fokuskan analisis pada topik berikut):\n${data.preFeedback}\n` : ""}
DATA IMMUTABLE:
${tableToText()}
Naratif: ${data.hasilNaratif}
${data.enableAnalisis ? `Analisis: ${analisisCleanText()}` : ""}
${visionDesc ? `Visual: ${visionDesc}` : ""}
${w.length ? `\n⚠️ VALIDATION WARNINGS:\n${w.map(x => x.msg).join("\n")}` : ""}
Referensi:
${refContext()}

Output SUMMARY OF FINDINGS: ${data.preFeedback ? "PRIORITASKAN arahan user di atas dalam analisis. " : ""}Data sesuai teori, Anomali, Hipotesis penyebab, Rekomendasi pembahasan.`);
    upd("summaryFindings", result);
    setLoading(false);
  };

  const generatePembahasan = async () => {
    setLoading(true);
    setLoadingMsg("Drafting Pembahasan...");
    const pembResult = await callGemini(SYS, `Buat HANYA bagian PEMBAHASAN:
Topik: ${data.topikPraktikum}, Judul: ${data.judulLaporan}
Data: ${tableToText()}
${data.enableAnalisis ? `Analisis: ${analisisCleanText()}` : ""}
Summary of Findings: ${data.summaryFindings}
${data.preFeedback ? `⭐ ARAHAN AWAL USER (PRIORITAS TINGGI): ${data.preFeedback}` : ""}
${data.userFeedback ? `💬 FEEDBACK TAMBAHAN USER: ${data.userFeedback}` : ""}
Referensi: ${refContext()}

Mulai dengan "Pada praktikum kali ini telah dilakukan...", analisis mendalam, bandingkan teori, bahas anomali+feedback, error sources.
JANGAN tulis Kesimpulan di sini. HANYA Pembahasan. TANPA header "PEMBAHASAN:" di awal.`);
    upd("pembahasan", pembResult.replace(/^PEMBAHASAN[:\s]*/i, "").trim());

    setLoadingMsg("Drafting Kesimpulan...");
    const kesmResult = await callGemini(SYS, `Buat HANYA bagian KESIMPULAN berdasarkan:
Topik: ${data.topikPraktikum}, Judul: ${data.judulLaporan}
Pembahasan yang sudah ditulis: ${pembResult.substring(0, 1500)}
Data: ${tableToText().substring(0, 500)}

Kesimpulan: 2-3 paragraf, ringkas, menjawab tujuan praktikum.
JANGAN tulis Pembahasan. HANYA Kesimpulan. TANPA header "KESIMPULAN:" di awal.`);
    upd("kesimpulan", kesmResult.replace(/^KESIMPULAN[:\s]*/i, "").trim());
    setLoading(false);
  };

  // ============ REVISION ENGINE ============
  const revisiPembahasan = async () => {
    if (!data.revisiInstruksi?.trim()) { alert("Tulis instruksi revisi dulu!"); return; }
    setLoading(true); setLoadingMsg("Merevisi Pembahasan...");
    const revised = await callGemini(SYS, `REVISI bagian PEMBAHASAN berikut berdasarkan instruksi user.

PEMBAHASAN SAAT INI:
${data.pembahasan}

INSTRUKSI REVISI USER:
${data.revisiInstruksi}

KONTEKS DATA:
${tableToText().substring(0, 800)}
${data.enableAnalisis ? `Analisis: ${analisisCleanText().substring(0, 500)}` : ""}
Referensi: ${refContext().substring(0, 800)}

RULES:
- Perbaiki HANYA bagian yang diminta user, jangan ubah seluruh teks jika tidak perlu
- Pertahankan gaya narasi "Pada praktikum kali ini..."
- Tambahkan/perbaiki sesuai instruksi
- TANPA header "PEMBAHASAN:" di awal
- Output: teks pembahasan yang sudah direvisi LENGKAP (bukan hanya bagian yang diubah)`);
    upd("pembahasan", revised.replace(/^PEMBAHASAN[:\s]*/i, "").trim());
    upd("revisiInstruksi", "");
    setLoading(false);
  };

  const revisiKesimpulan = async () => {
    if (!data.revisiInstruksi?.trim()) { alert("Tulis instruksi revisi dulu!"); return; }
    setLoading(true); setLoadingMsg("Merevisi Kesimpulan...");
    const revised = await callGemini(SYS, `REVISI bagian KESIMPULAN berikut berdasarkan instruksi user.

KESIMPULAN SAAT INI:
${data.kesimpulan}

INSTRUKSI REVISI USER:
${data.revisiInstruksi}

Pembahasan terkait: ${data.pembahasan?.substring(0, 800)}

RULES:
- Perbaiki sesuai instruksi, pertahankan format 2-3 paragraf
- TANPA header "KESIMPULAN:" di awal
- Output: teks kesimpulan yang sudah direvisi LENGKAP`);
    upd("kesimpulan", revised.replace(/^KESIMPULAN[:\s]*/i, "").trim());
    upd("revisiInstruksi", "");
    setLoading(false);
  };

  const generateAbstrak = async () => {
    setLoading(true); setLoadingMsg("Generating Abstrak...");
    const result = await callGemini("Tulis abstrak ID & EN, 150-200 kata each. Tanpa markdown.",
      `Abstrak untuk: ${data.judulLaporan}\nPendahuluan: ${data.pendahuluan?.substring(0, 400)}\nHasil: ${data.hasilNaratif?.substring(0, 400)}\nKesimpulan: ${data.kesimpulan?.substring(0, 400)}\n\nFormat: ABSTRAK:\n[ID]\n\nABSTRACT:\n[EN]\n\nKata Kunci: [5]\nKeywords: [5]`);
    upd("abstrak", result); setLoading(false);
  };

  // ============ DOCX GENERATOR V3.2 — Full Rewrite ============
  // Fixes: Logo alpha, Roman numerals, conditional sections, clean APA, math objects, abstrak layout
  const generateDocx = async () => {
    setExporting(true);
    try {
      const dx = await import("docx");
      const { Document: Doc, Packer: Pkr, Paragraph: P, TextRun: T, Table: Tbl, TableRow: TR, TableCell: TC,
        ImageRun: IR, Header: Hdr, Footer: Ftr, AlignmentType: A, HeadingLevel: HL, Math: Mt, MathRun: MR,
        BorderStyle: BS, WidthType: W, ShadingType: ST, PageNumber: PN, SectionType: SecT } = dx;

      // ---- Logo: fix alpha channel by drawing on white canvas ----
      const loadLogo = async () => {
        const src = customLogo ? customLogo.preview : UNAIR_LOGO;
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(blob => {
              const reader = new FileReader();
              reader.onload = () => resolve(new Uint8Array(reader.result));
              reader.readAsArrayBuffer(blob);
            }, "image/png");
          };
          img.onerror = () => resolve(null);
          img.src = src;
        });
      };
      const logoBytes = await loadLogo();

      // ---- Helpers ----
      const bdr = { style: BS.SINGLE, size: 1, color: "000000" };
      const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr };
      const FONT = "Times New Roman";
      const SZ = 24; // 12pt = size 24 in half-points

      // Clean text: strip tier markers from AI-generated content
      const cleanText = (txt) => (txt || "").replace(/\[✅ Full-text\]|\[📋 Abstract\]|\[⚠️ Metadata[- ]only\]/g, "").replace(/\s{2,}/g, " ").trim();

      const mkT = (text, opts = {}) => new T({ text, font: FONT, size: opts.size || SZ, bold: opts.bold, italics: opts.italics, ...(opts.color ? { color: opts.color } : {}) });

      const mkPara = (text, opts = {}) => new P({
        children: [mkT(cleanText(text), opts)],
        spacing: { after: opts.after ?? 120, before: opts.before ?? 0, line: opts.line ?? 276 },
        alignment: opts.align || A.JUSTIFIED,
        indent: opts.indent ? { firstLine: 480 } : undefined,
      });

      // Section heading with Roman numeral
      const mkSecH = (roman, title) => new P({
        children: [mkT(`${roman}. ${title}`, { bold: true })],
        spacing: { before: 280, after: 140 },
        alignment: A.CENTER,
      });

      // Sub-heading (e.g. A. EIT)
      const mkSubH = (text) => new P({
        children: [mkT(text, { bold: true })],
        spacing: { before: 200, after: 80 },
        alignment: A.LEFT,
      });

      // Parse long text into paragraphs, handle A-E sub-sections
      const mkParas = (txt) => {
        if (!txt) return [];
        const cleaned = cleanText(txt);
        return cleaned.split("\n\n").filter(t => t.trim()).flatMap(t => {
          const tr = t.trim();
          if (/^[A-E]\.\s/.test(tr)) {
            const lines = tr.split("\n");
            return [mkSubH(lines[0]), ...lines.slice(1).filter(l => l.trim()).map(l => mkPara(l.trim(), { indent: true }))];
          }
          return [mkPara(tr, { indent: true })];
        });
      };

      // Build table
      const mkTable = (tbl) => {
        const ncols = tbl.headers.length;
        const cw = Math.floor(9360 / ncols);
        return [
          new P({ children: [mkT(tbl.title || "Tabel", { bold: true, size: 20 })], spacing: { before: 200, after: 80 }, alignment: A.CENTER }),
          new Tbl({
            width: { size: 9360, type: W.DXA }, columnWidths: tbl.headers.map(() => cw),
            rows: [
              new TR({ children: tbl.headers.map(h => new TC({ borders, width: { size: cw, type: W.DXA }, shading: { fill: "D9E2F3", type: ST.CLEAR }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new P({ children: [mkT(h, { bold: true, size: 18 })], alignment: A.CENTER })] })) }),
              ...tbl.rows.map(row => new TR({ children: row.map((c, ci) => new TC({ borders, width: { size: cw, type: W.DXA }, margins: { top: 30, bottom: 30, left: 80, right: 80 }, children: [new P({ children: [mkT(c || "", { size: 18 })], alignment: ci === 0 ? A.CENTER : A.LEFT })] })) }))
            ]
          }),
          new P({ spacing: { after: 160 }, children: [] }),
        ];
      };

      // Math equation object from text string
      const mkMathPara = (eqStr) => {
        try {
          return new P({
            children: [new Mt({ children: [new MR(eqStr)] })],
            spacing: { before: 80, after: 80 },
            alignment: A.CENTER,
          });
        } catch {
          // Fallback to plain text if Math fails
          return mkPara(eqStr, { align: A.CENTER });
        }
      };

      // Clean APA format (no tier markers, no italics markers)
      const cleanAPA = (r) => `${r.authors} (${r.year}). ${r.title}. ${r.journal}${r.doi ? `. https://doi.org/${r.doi}` : ""}`;

      // ============ BUILD COVER PAGE (match scratch format) ============
      const coverChildren = [];

      // LAPORAN
      coverChildren.push(new P({ children: [mkT("LAPORAN", { bold: true })], alignment: A.CENTER, spacing: { after: 0 } }));
      // EKSPERIMEN TEKNIK BIOMEDIS II (or mata kuliah)
      coverChildren.push(new P({ children: [mkT(data.mataKuliah.toUpperCase(), { bold: true })], alignment: A.CENTER, spacing: { after: 120 } }));
      // Judul in quotes
      coverChildren.push(new P({ children: [mkT(`"${data.judulLaporan}"`, { bold: true })], alignment: A.CENTER, spacing: { after: 60 } }));
      // Horizontal line separator (match scratch format)
      coverChildren.push(new P({ children: [], spacing: { after: 40 }, border: { bottom: { style: BS.SINGLE, size: 6, color: "000000", space: 1 } } }));
      // Pelaksanaan info
      if (data.tanggalPraktikum) coverChildren.push(new P({ children: [mkT(`Pelaksanaan Praktikum: ${data.tanggalPraktikum}`)], alignment: A.CENTER, spacing: { after: 200 } }));
      // Logo
      if (logoBytes) {
        coverChildren.push(new P({ alignment: A.CENTER, children: [new IR({ type: "png", data: logoBytes, transformation: { width: 188, height: 176 }, altText: { title: "Logo", description: "Logo Universitas", name: "Logo" } })], spacing: { before: 200, after: 200 } }));
      }
      // Oleh:
      coverChildren.push(new P({ children: [mkT("Oleh :")], alignment: A.CENTER, spacing: { before: 100, after: 80 } }));
      // Nama, NIM, Kelompok
      coverChildren.push(new P({ children: [mkT(`Nama : ${data.nama}`)], alignment: A.CENTER, spacing: { after: 40 } }));
      coverChildren.push(new P({ children: [mkT(`NIM : ${data.nim}`, { bold: true })], alignment: A.CENTER, spacing: { after: 40 } }));
      coverChildren.push(new P({ children: [mkT(`Kelompok : ${data.kelompok}  /  Kelas : ${data.kelas}`)], alignment: A.CENTER, spacing: { after: 160 } }));
      // Dosen & Asisten
      coverChildren.push(new P({ children: [mkT("Dosen Pengampu :")], alignment: A.CENTER, spacing: { after: 20 } }));
      coverChildren.push(new P({ children: [mkT(data.dosenPengampu || "___")], alignment: A.CENTER, spacing: { after: 80 } }));
      coverChildren.push(new P({ children: [mkT("Asisten Dosen :")], alignment: A.CENTER, spacing: { after: 20 } }));
      coverChildren.push(new P({ children: [mkT(data.asisten || "___")], alignment: A.CENTER, spacing: { after: 200 } }));
      // Footer: PRODI, FAKULTAS, UNIVERSITAS, TAHUN (bold)
      [`PROGRAM STUDI ${(data.prodi || "").toUpperCase()}`, (data.fakultas || "").toUpperCase(), (data.universitas || "").toUpperCase(), data.tahun || "2026"].forEach(t =>
        coverChildren.push(new P({ children: [mkT(t, { bold: true })], alignment: A.CENTER, spacing: { after: 20 } }))
      );

      // ============ BUILD ABSTRAK SECTION (single column, before 2-column content) ============
      const abstrakChildren = [];
      abstrakChildren.push(new P({ children: [mkT("ABSTRAK", { bold: true })], alignment: A.CENTER, spacing: { before: 200, after: 140 } }));
      const abParts = (data.abstrak || "").split(/ABSTRACT:/i);
      const absID = cleanText((abParts[0] || "").replace(/ABSTRAK:/i, ""));
      const absEN = cleanText(abParts[1] || "");
      // ID abstract
      const kwIdMatch = absID.match(/Kata Kunci:\s*(.+)/i);
      mkParas(kwIdMatch ? absID.substring(0, kwIdMatch.index).trim() : absID).forEach(p => abstrakChildren.push(p));
      if (kwIdMatch) abstrakChildren.push(new P({ children: [mkT("Kata Kunci: ", { bold: true, italics: true, size: 22 }), mkT(kwIdMatch[1], { italics: true, size: 22 })], spacing: { after: 240 } }));
      // EN abstract
      if (absEN) {
        abstrakChildren.push(new P({ children: [mkT("ABSTRACT", { bold: true })], alignment: A.CENTER, spacing: { before: 200, after: 140 } }));
        const kwEnMatch = absEN.match(/Keywords:\s*(.+)/i);
        const enBody = kwEnMatch ? absEN.substring(0, kwEnMatch.index).trim() : absEN;
        enBody.split("\n\n").filter(t => t.trim()).forEach(t => abstrakChildren.push(mkPara(t.trim(), { indent: true, italics: true })));
        if (kwEnMatch) abstrakChildren.push(new P({ children: [mkT("Keywords: ", { bold: true, italics: true, size: 22 }), mkT(kwEnMatch[1], { italics: true, size: 22 })], spacing: { after: 200 } }));
      }

      // ============ BUILD MAIN CONTENT (2-column, Roman numerals, conditional) ============
      const hasAnalisis = data.enableAnalisis && (data.analisisBlocks || []).some(b => b.equation || b.hasil);
      // Roman numeral counter
      const ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
      let romIdx = 0;

      const cc = [];

      // I. PENDAHULUAN
      cc.push(mkSecH(ROM[romIdx++], "PENDAHULUAN"));
      mkParas(data.pendahuluan).forEach(p => cc.push(p));

      // II. STUDI PUSTAKA
      cc.push(mkSecH(ROM[romIdx++], "STUDI PUSTAKA"));
      mkParas(data.studiPustaka).forEach(p => cc.push(p));

      // III. ALAT DAN BAHAN
      cc.push(mkSecH(ROM[romIdx++], "ALAT DAN BAHAN"));
      mkParas(data.alatBahan).forEach(p => cc.push(p));

      // IV. PROSEDUR PELAKSANAAN
      cc.push(mkSecH(ROM[romIdx++], "PROSEDUR PELAKSANAAN"));
      mkParas(data.prosedur).forEach(p => cc.push(p));

      // V. HASIL PENGAMATAN
      cc.push(mkSecH(ROM[romIdx++], "HASIL PENGAMATAN"));
      if (data.hasilNaratif) mkParas(data.hasilNaratif).forEach(p => cc.push(p));
      (data.hasilTabels || []).forEach(t => { if (t.rows.some(r => r.some(c => c))) mkTable(t).forEach(el => cc.push(el)); });

      // VI. ANALISIS (conditional — only if enabled)
      if (hasAnalisis) {
        cc.push(mkSecH(ROM[romIdx++], "ANALISIS"));
        (data.analisisBlocks || []).forEach((bl, i) => {
          if (!bl.equation && !bl.hasil) return;
          cc.push(mkSubH(`Analisis ${i + 1}`));
          // Equation as Math object
          if (bl.equation) {
            cc.push(mkMathPara(bl.equation));
          }
          // Clean result (variables + final answer)
          if (bl.hasil) {
            cleanText(bl.hasil).split("\n").filter(l => l.trim()).forEach(line => {
              // Try to detect equation-like lines and render as math
              if (/^(Rumus|Variabel|Hasil|[A-Za-z_]+\s*=)/i.test(line.trim())) {
                cc.push(mkPara(line.trim(), { indent: true }));
              } else {
                cc.push(mkPara(line.trim(), { indent: true }));
              }
            });
          }
          // Structured tables
          if (bl.resultTables?.length) bl.resultTables.forEach(rt => { if (rt.headers?.length) mkTable(rt).forEach(el => cc.push(el)); });
          if (bl.keterangan) cc.push(mkPara(`Keterangan: ${bl.keterangan}`, { indent: true, italics: true }));
        });
      }

      // VII (or VI). PEMBAHASAN
      cc.push(mkSecH(ROM[romIdx++], "PEMBAHASAN"));
      mkParas(data.pembahasan).forEach(p => cc.push(p));

      // VIII (or VII). KESIMPULAN
      cc.push(mkSecH(ROM[romIdx++], "KESIMPULAN"));
      mkParas(data.kesimpulan).forEach(p => cc.push(p));

      // IX (or VIII). REFERENSI — clean APA, no tier markers
      cc.push(mkSecH(ROM[romIdx++], "REFERENSI"));
      (data.selectedRefs || []).forEach((r, i) => {
        cc.push(new P({
          children: [mkT(`[${i + 1}] ${cleanAPA(r)}`, { size: 20 })],
          spacing: { after: 80 },
          indent: { left: 480, hanging: 480 },
        }));
      });

      // LAMPIRAN
      cc.push(new P({ children: [mkT("LAMPIRAN", { bold: true })], alignment: A.CENTER, spacing: { before: 400, after: 120 } }));
      cc.push(mkPara("(Lampiran dapat ditambahkan secara manual)", { align: A.CENTER, italics: true, size: 20 }));

      // ============ ASSEMBLE DOCUMENT ============
      const pageA4 = { size: { width: 11906, height: 16838 } };
      const defaultMargin = { top: 1440, right: 1440, bottom: 1440, left: 1440 };

      const doc = new Doc({
        styles: { default: { document: { run: { font: FONT, size: SZ } } } },
        sections: [
          // Section 1: Cover (single column)
          { properties: { page: { ...pageA4, margin: defaultMargin } }, children: coverChildren },
          // Section 2: Abstrak (single column, new page)
          { properties: { page: { ...pageA4, margin: defaultMargin }, type: SecT.NEXT_PAGE }, children: abstrakChildren },
          // Section 3: Main content (2 columns, new page)
          {
            properties: {
              page: { ...pageA4, margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 } },
              column: { count: 2, space: 480, equalWidth: true, separate: false },
              type: SecT.NEXT_PAGE,
            },
            headers: { default: new Hdr({ children: [new P({ children: [mkT(`Laporan Praktikum — ${data.mataKuliah}`, { italics: true, size: 16, color: "666666" })], alignment: A.RIGHT })] }) },
            footers: { default: new Ftr({ children: [new P({ children: [mkT("Halaman ", { size: 18 }), new T({ children: [PN.CURRENT], font: FONT, size: 18 })], alignment: A.CENTER })] }) },
            children: cc,
          },
        ],
      });

      const blob = await Pkr.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laprak_${data.topikPraktikum?.replace(/\s+/g, "_") || "draft"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error("DOCX Error:", err); alert("Error generating .docx: " + err.message); }
    setExporting(false);
  };

  // ============ STEP RENDERS ============
  const stepNames = ["Profil & Topik", "Referensi & Lit. Review", "Data & Analisis", "AI Agent & Feedback", "Review & Export"];
  const done = [!!(data.nama && data.nim && data.mataKuliah && data.topikPraktikum && data.judulLaporan), !!(data.pendahuluan && data.studiPustaka), !!(data.alatBahan && data.prosedur && (data.hasilNaratif || (data.hasilTabels || []).some(t => t.rows.some(r => r.some(c => c))))), !!(data.pembahasan && data.kesimpulan), !!(data.abstrak)];

  const Step1 = () => (<>
    <Card title="Profil Mahasiswa" icon="👤" gold>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={s.grid2}>
          <div><label style={s.label}>Nama Lengkap</label><DInput value={data.nama} onCommit={v => upd("nama", v)} placeholder="" /></div>
          <div><label style={s.label}>NIM</label><DInput value={data.nim} onCommit={v => upd("nim", v)} placeholder="" /></div>
        </div>
        <div style={s.grid2}>
          <div><label style={s.label}>Kelompok</label><DInput value={data.kelompok} onCommit={v => upd("kelompok", v)} placeholder="" /></div>
          <div><label style={s.label}>Kelas</label><DInput value={data.kelas} onCommit={v => upd("kelas", v)} placeholder="" /></div>
        </div>
        <div><label style={s.label}>Program Studi</label><DInput value={data.prodi} onCommit={v => upd("prodi", v)} placeholder="" /></div>
        <div><label style={s.label}>Fakultas</label><DInput value={data.fakultas} onCommit={v => upd("fakultas", v)} placeholder="" /></div>
        <div style={s.grid2}>
          <div><label style={s.label}>Universitas</label><DInput value={data.universitas} onCommit={v => upd("universitas", v)} placeholder="" /></div>
          <div><label style={s.label}>Tahun</label><DInput value={data.tahun} onCommit={v => upd("tahun", v)} placeholder="" /></div>
        </div>
      </div>
    </Card>
    <Card title="Logo Universitas" icon="🏛️" gold>
      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px" }}>Upload logo kampus untuk cover page (.png/.jpg).</p>
      <input ref={logoUpRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Btn variant="secondary" onClick={() => logoUpRef.current?.click()}>📷 Upload Logo</Btn>
        {customLogo && (
          <div style={{ position: "relative" }}>
            <img src={customLogo.preview} alt="Logo" style={{ height: 60, borderRadius: 6, border: "1px solid " + C.border }} />
            <button
              onClick={() => setCustomLogo(null)}
              style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: C.red, color: "#fff", border: "none", fontSize: 8, cursor: "pointer" }}
            >✕</button>
          </div>
        )}
        {!customLogo && <span style={{ fontSize: 10, color: C.muted }}>Belum ada logo</span>}
      </div>
    </Card>
    <Card title="Detail Praktikum" icon="🔬" gold><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[["mataKuliah", "Mata Kuliah", "Eksperimen Teknik Biomedis II"], ["topikPraktikum", "Topik", "Biokompatibilitas Material"], ["judulLaporan", "Judul", "Judul lengkap"]].map(([k, l, p]) => <div key={k}><label style={s.label}>{l}</label><DInput value={data[k]} onCommit={v => upd(k, v)} placeholder={p} /></div>)}
      <div style={s.grid2}><div><label style={s.label}>Tanggal</label><DInput type="date" value={data.tanggalPraktikum} onCommit={v => upd("tanggalPraktikum", v)} /></div><div><label style={s.label}>Dosen Pengampu</label><DInput value={data.dosenPengampu} onCommit={v => upd("dosenPengampu", v)} /></div></div>
      <div><label style={s.label}>Asisten Dosen</label><DInput value={data.asisten} onCommit={v => upd("asisten", v)} /></div>
    </div></Card>
  </>);

  const Step2Rest = () => (<>
    <Card title="Pendahuluan" icon="📝" gold action={<Btn onClick={generateStep2} disabled={loading || !data.topikPraktikum}>{loading ? "⏳ Generating..." : "🤖 Generate AI"}</Btn>}><DTextarea value={data.pendahuluan} onCommit={v => upd("pendahuluan", v)} placeholder="Generate atau tulis manual..." /></Card>
    <Card title="Studi Pustaka (A-E)" icon="📖" gold><DTextarea value={data.studiPustaka} onCommit={v => upd("studiPustaka", v)} style={{ minHeight: 180 }} placeholder="Di-generate bersama Pendahuluan..." /></Card>
  </>);

  const Step3 = () => (<>
    <Card title="Alat & Bahan" icon="🧪" gold><DTextarea value={data.alatBahan} onCommit={v => upd("alatBahan", v)} placeholder="Naratif..." /></Card>
    <Card title="Prosedur" icon="📋" gold><DTextarea value={data.prosedur} onCommit={v => upd("prosedur", v)} style={{ minHeight: 140 }} placeholder="Langkah-langkah..." /></Card>
    <Card title="Hasil Pengamatan — Tabel" icon="📊" gold action={<Btn variant="ghost" onClick={() => upd("hasilTabels", [...(data.hasilTabels || []), { title: `Tabel ${(data.hasilTabels || []).length + 1}`, headers: ["No", "Parameter", "Nilai", "Satuan"], rows: [["1", "", "", ""]] }])}>+ Tambah Tabel</Btn>}>
      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>Data IMMUTABLE. Validation Layer akan cek outlier otomatis.</p>
      {(data.hasilTabels || []).map((tbl, ti) => (<div key={ti} style={{ marginBottom: 16, background: "rgba(255,255,255,.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <DInput value={tbl.title} onCommit={v => { const ts = [...data.hasilTabels]; ts[ti] = { ...ts[ti], title: v }; upd("hasilTabels", ts); }} style={{ fontWeight: 700, fontSize: 13, background: "transparent", border: "none", borderBottom: `1px solid ${C.inputB}`, borderRadius: 0, padding: "4px 0", color: C.gold }} />
          {(data.hasilTabels || []).length > 1 && <button onClick={() => upd("hasilTabels", data.hasilTabels.filter((_, i) => i !== ti))} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 12 }}>🗑️</button>}
        </div>
        <TableBuilder value={tbl} onChange={v => { const ts = [...data.hasilTabels]; ts[ti] = { ...ts[ti], ...v }; upd("hasilTabels", ts); }} />
      </div>))}
    </Card>
    <Card title="Naratif" icon="📝" gold><DTextarea value={data.hasilNaratif} onCommit={v => upd("hasilNaratif", v)} placeholder="Deskripsi tambahan..." /></Card>
    <Card title="Foto Hasil" icon="📷" gold>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display: "none" }} />
      <Btn variant="secondary" onClick={() => fileRef.current?.click()}>+ Foto</Btn>
      {data.fotoResults.length > 0 && <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>{data.fotoResults.map((f, i) => <div key={i} style={{ position: "relative" }}><img src={f.preview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12, border: `1px solid ${C.border}` }} /><button onClick={() => setData(p => ({ ...p, fotoResults: p.fotoResults.filter((_, x) => x !== i) }))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: C.red, color: "#fff", border: "none", fontSize: 9, cursor: "pointer" }}>✕</button></div>)}</div>}
    </Card>
    <Card title="Analisis Matematis" icon="🧮" gold action={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {data.enableAnalisis && <Btn variant="ghost" onClick={() => upd("analisisBlocks", [...(data.analisisBlocks || []), { equation: "", instruksi: "", fotoRumus: null, hasil: "", workingSheet: "", keterangan: "", deterministicResult: false, resultTables: [] }])}>+ Tambah</Btn>}
      <label style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><input type="checkbox" checked={data.enableAnalisis} onChange={e => upd("enableAnalisis", e.target.checked)} style={{ accentColor: C.accent }} />Aktifkan</label>
    </div>}>
      {data.enableAnalisis ? <div><p style={{ fontSize: 11, color: C.muted, margin: "0 0 12px" }}>🔧 Deterministic Engine: AI generate JS code → eksekusi di browser → angka dijamin akurat. Clean Result masuk laporan, Working Sheet untuk verifikasi.</p>
        {(data.analisisBlocks || []).map((blk, bi) => <AnalisisBlock key={bi} index={bi} value={blk} total={(data.analisisBlocks || []).length} allTabels={data.hasilTabels}
          onChange={v => { const bs = [...data.analisisBlocks]; bs[bi] = { ...v, prevResult: bi > 0 ? data.analisisBlocks[bi - 1]?.hasil : "" }; upd("analisisBlocks", bs); }}
          onRemove={() => upd("analisisBlocks", data.analisisBlocks.filter((_, i) => i !== bi))} />)}
      </div> : <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Opsional. Aktifkan untuk perhitungan deterministik.</p>}
    </Card>
  </>);

  const Step4 = () => (<>
    {warnings.length > 0 && <Card title="⚠️ Validation Warnings" icon="" gold>
      <p style={{ fontSize: 11, color: C.yellow, margin: "0 0 8px" }}>Pre-analysis check menemukan data yang perlu diperhatikan:</p>
      {warnings.map((w, i) => <div key={i} style={{ background: "rgba(232,168,48,.08)", border: "1px solid rgba(232,168,48,.2)", borderRadius: 12, padding: 8, marginBottom: 4, fontSize: 11, color: C.yellow }}>{w.tabel} — Baris {w.row}, Kolom {w.col}: {w.msg}</div>)}
      <p style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Data tetap IMMUTABLE. Konfirmasi apakah ini benar atau typo sebelum lanjut.</p>
    </Card>}

    <Card title="Stage 1 — Pre-Feedback (Arahan Awal)" icon="⭐" gold>
      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>Tulis arahan SEBELUM AI memproses — apa yang harus difokuskan dalam pembahasan? AI akan memprioritaskan ini.</p>
      <DTextarea value={data.preFeedback} onCommit={v => upd("preFeedback", v)} style={{ minHeight: 80 }} placeholder='Contoh: "Fokuskan pada pengaruh suhu terhadap swelling ratio, bahas anomali sampel 3 karena alat kurang presisi, bandingkan dengan paper Zhang et al."' />
    </Card>

    <Card title="Stage 2 — AI Research Agent" icon="🔬" gold action={<Btn onClick={generateSummary} disabled={loading}>{loading && !data.summaryFindings ? "⏳ Analyzing..." : "🤖 Run Agent"}</Btn>}>
      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>Validation → Vision → Literature comparison → Summary (memprioritaskan arahan kamu di Stage 1)</p>
      {data.summaryFindings && <div style={{ background: "rgba(45,127,249,.06)", border: "1px solid rgba(45,127,249,.15)", borderRadius: 12, padding: 14, marginTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>📋 SUMMARY OF FINDINGS</span><ConfidenceBadge data={data} /></div><div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{data.summaryFindings}</div></div>}
    </Card>

    {data.summaryFindings && <>
      <Card title="Stage 3 — Post-Feedback (Konteks Lapangan)" icon="💬" gold>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>Setelah lihat Summary, ada konteks tambahan? "Elektroda goyang", "Suhu ruangan naik 2°C", dll.</p>
        <DTextarea value={data.userFeedback} onCommit={v => upd("userFeedback", v)} style={{ minHeight: 80 }} placeholder="Opsional — tambahan konteks setelah lihat summary..." />
      </Card>
      <Card title="Stage 4 — Generate" icon="⚡" gold action={<Btn onClick={generatePembahasan} disabled={loading}>{loading ? "⏳ Drafting..." : "🤖 Generate Pembahasan"}</Btn>}>
        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Pembahasan + Kesimpulan dari Pre-Feedback + Summary + Post-Feedback.</p>
      </Card>
    </>}

    {data.pembahasan && <>
      <Card title="Pembahasan (Draft)" icon="📝" gold action={<ConfidenceBadge data={data} />}>
        <DTextarea value={data.pembahasan} onCommit={v => upd("pembahasan", v)} style={{ minHeight: 200 }} />
      </Card>
      <Card title="Kesimpulan (Draft)" icon="✅" gold>
        <DTextarea value={data.kesimpulan} onCommit={v => upd("kesimpulan", v)} />
      </Card>

      <Card title="Stage 5 — Revisi" icon="🔄" gold>
        <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>Tidak puas dengan draft? Tulis instruksi revisi spesifik, lalu pilih bagian mana yang mau direvisi.</p>
        <DTextarea value={data.revisiInstruksi} onCommit={v => upd("revisiInstruksi", v)} style={{ minHeight: 70 }} placeholder='Contoh: "Paragraf 2 kurang membahas error source", "Tambahkan perbandingan dengan paper Yoon et al.", "Kesimpulan terlalu panjang, ringkas jadi 2 paragraf"' />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn variant="primary" onClick={revisiPembahasan} disabled={loading || !data.revisiInstruksi?.trim()}>{loading ? "⏳" : "🔄 Revisi Pembahasan"}</Btn>
          <Btn variant="secondary" onClick={revisiKesimpulan} disabled={loading || !data.revisiInstruksi?.trim()}>{loading ? "⏳" : "🔄 Revisi Kesimpulan"}</Btn>
        </div>
      </Card>
    </>}
  </>);

  const Step5 = () => (<>
    <Card title="Abstrak" icon="📄" gold action={<Btn onClick={generateAbstrak} disabled={loading || !data.kesimpulan}>{loading ? "⏳" : "🤖 Generate"}</Btn>}><DTextarea value={data.abstrak} onCommit={v => upd("abstrak", v)} style={{ minHeight: 140 }} placeholder="Generate setelah pembahasan..." /></Card>
    <Card title="Referensi (APA 7th)" icon="📚" gold>{!data.selectedRefs.length ? <p style={{ color: C.muted, fontSize: 12 }}>Step 2.</p> : data.selectedRefs.map((r, i) => <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 11, color: C.text, marginBottom: 6, lineHeight: 1.6 }}><span style={{ fontSize: 9, color: tierColor(r.tier), fontWeight: 700, flexShrink: 0 }}>{tierBadge(r.tier)}</span><span style={{ paddingLeft: 16, textIndent: -16 }}>[{i + 1}] {formatAPA(r)}</span></div>)}</Card>
    <Card title="Checklist" icon="✅" gold action={<ConfidenceBadge data={data} />}>
      {[["Profil", !!(data.nama && data.nim && data.prodi && data.universitas)], ["Detail Praktikum", !!(data.mataKuliah && data.topikPraktikum && data.judulLaporan)], ["Pendahuluan", !!data.pendahuluan], ["Studi Pustaka", !!data.studiPustaka], ["Alat & Bahan", !!data.alatBahan], ["Prosedur", !!data.prosedur], ["Hasil", !!(data.hasilNaratif || (data.hasilTabels || []).some(t => t.rows.some(r => r.some(c => c))))], ["Analisis", !data.enableAnalisis || (data.analisisBlocks || []).some(b => b.hasil)], ["Pembahasan", !!data.pembahasan], ["Kesimpulan", !!data.kesimpulan], ["Abstrak", !!data.abstrak], ["Ref ≥ 3", data.selectedRefs.length >= 3]].map(([l, ok], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 12 }}><span style={{ color: ok ? C.green : C.red }}>{ok ? "✅" : "❌"}</span><span style={{ color: ok ? C.text : C.muted }}>{l}</span></div>)}
    </Card>
    <Card title="Export" icon="📥" gold>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Clean Report only — Working Sheet & Confidence Score TIDAK masuk .docx.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn variant="gold" onClick={generateDocx} disabled={exporting}>{exporting ? "⏳ Building .docx..." : "📥 Download .docx (Final)"}</Btn>
        <Btn variant="ghost" onClick={() => {
          const t = [
            `LAPORAN PRAKTIKUM\n${data.judulLaporan}`, `Mata Kuliah: ${data.mataKuliah}\nTanggal: ${data.tanggalPraktikum}`,
            `\nABSTRAK\n${data.abstrak}`, `\nPENDAHULUAN\n${data.pendahuluan}`, `\nSTUDI PUSTAKA\n${data.studiPustaka}`,
            `\nALAT & BAHAN\n${data.alatBahan}`, `\nPROSEDUR\n${data.prosedur}`, `\nHASIL\n${data.hasilNaratif}\n${tableToText()}`,
            data.enableAnalisis ? `\nANALISIS\n${analisisCleanText()}` : "", `\nPEMBAHASAN\n${data.pembahasan}`, `\nKESIMPULAN\n${data.kesimpulan}`,
            `\nREFERENSI\n${data.selectedRefs.map((r, i) => `[${i + 1}] ${formatAPA(r)}`).join("\n")}`].filter(Boolean).join("\n");
          const b = new Blob([t], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `Laprak_${data.topikPraktikum?.replace(/\s+/g, "_") || "draft"}.txt`; a.click(); URL.revokeObjectURL(u);
        }}>📄 .txt</Btn>
        <Btn variant="ghost" onClick={() => { const d = JSON.stringify(data, (k, v) => k === "fotoResults" ? [] : v, 2); const b = new Blob([d], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "laprak-v3-data.json"; a.click(); URL.revokeObjectURL(u); }}>💾 .json</Btn>
      </div>
    </Card>
  </>);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Nunito', 'DM Sans', system-ui, sans-serif" }}>
      <style>{shimmer}{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');`}</style>
      <div style={{ background: C.card, padding: "14px 20px", borderBottom: `2px solid ${C.accent}30`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7c5ce7, #00bfa6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900 }}>M</div>
        <div style={{ flex: 1 }}><h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Laprak AI <span style={{ fontSize: 10, color: C.accent }}>V3.2</span></h1><p style={{ fontSize: 9, color: C.gold, margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>Deterministic • HITL Agent • Moku</p></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 10, color: C.green, background: "rgba(13,186,115,.1)", padding: "3px 8px", borderRadius: 10 }}>{saved}</span>}
          <button onClick={saveToHistory} style={{ background: "rgba(255,255,255,.08)", border: "none", color: C.text, cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }} title="Simpan ke History">💾 Simpan</button>
          <button onClick={() => { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")); setShowHistory(true); }} style={{ background: "rgba(255,255,255,.08)", border: "none", color: C.text, cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>📂 History</button>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowHistory(false)}>
          <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>📂 Laprak History</span>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: C.muted, fontSize: 13 }}>Belum ada history. Klik 💾 Simpan setelah mengisi laprak.</div>
            ) : history.map(h => (
              <div key={h.id} style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 8, background: C.card2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{h.title}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{h.mataKuliah} • {new Date(h.savedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                    {h.snippet && <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{h.snippet.substring(0, 100)}...</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
                    <button onClick={() => { setData(prev => ({ ...prev, ...h.data })); setShowHistory(false); setSaved("Loaded ✓"); setTimeout(() => setSaved(""), 1500); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.accent}`, background: C.accent + "15", color: C.accent, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Buka</button>
                    <button onClick={() => { const upd = history.filter(x => x.id !== h.id); setHistory(upd); localStorage.setItem(HISTORY_KEY, JSON.stringify(upd)); }} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.red}20`, background: "transparent", color: C.red, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading && <div style={{ padding: "0 20px" }}><div style={{ height: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.gold}, ${C.accent})`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 2 }} /><div style={{ textAlign: "center", fontSize: 11, color: C.accent, padding: "6px 0", animation: "pulse 1.5s infinite" }}>{loadingMsg}</div></div>}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 14px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map(n => <div key={n} style={{ display: "flex", alignItems: "center", gap: 3 }}><div onClick={() => changeStep(n)} title={stepNames[n - 1]} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", background: step === n ? C.accent : done[n - 1] ? C.green : "rgba(255,255,255,.04)", color: step === n || done[n - 1] ? "#fff" : C.muted, border: `2px solid ${step === n ? C.accent : done[n - 1] ? C.green : C.border}`, boxShadow: step === n ? "0 0 12px rgba(45,127,249,.3)" : "none" }}>{n}</div>{n < 5 && <div style={{ width: 16, height: 2, background: done[n - 1] ? C.green : C.border }} />}</div>)}
        </div>
        <div style={{ textAlign: "center", marginBottom: 18 }}><span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{step}. {stepNames[step - 1]}</span></div>
        <div style={{ display: step === 2 ? "block" : "none" }}><RefManager selectedRefs={data.selectedRefs} onRefsChange={refs => upd("selectedRefs", refs)} /></div>
        {step === 1 && Step1()}
        {step === 2 && Step2Rest()}
        {step === 3 && Step3()}
        {step === 4 && Step4()}
        {step === 5 && Step5()}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingBottom: 30 }}>
          <Btn variant="secondary" disabled={step === 1} onClick={() => changeStep(step - 1)} style={{ opacity: step === 1 ? .3 : 1 }}>← Back</Btn>
          {step < 5 ? <Btn onClick={() => changeStep(step + 1)}>Next →</Btn> : <Btn variant="gold" disabled>Selesai ✓</Btn>}
        </div>
      </div>
    </div>
  );
}