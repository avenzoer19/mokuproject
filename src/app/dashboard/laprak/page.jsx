"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

// ============ CONSTANTS ============
const STORAGE_KEY = "laprak-ai-v3";
const UNAIR_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAACzY+a1AAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAACpLklEQVR42u";
const shimmer = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`;

// ============ GEMINI API ============
async function callGemini(apiKey, systemPrompt, userMessage, images = [], docs = []) {
  if (!apiKey) return "Error: API Key belum diisi.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const parts = [{ text: `${systemPrompt}\n\nUser Request:\n${userMessage}` }];
  images.forEach(img => parts.push({ inlineData: { mimeType: img.type, data: img.data } }));
  docs.forEach(doc => parts.push({ inlineData: { mimeType: doc.type, data: doc.data } }));
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts }] }) });
    const d = await res.json();
    if (d.error) return `Error: ${d.error.message}`;
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "Error: Tidak ada respons.";
  } catch (e) { return `Error koneksi: ${e.message}`; }
}

async function searchCrossRef(query, rows = 5) {
  try {
    const r = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${rows}&filter=from-pub-date:2021&sort=relevance`);
    const d = await r.json();
    return (d.message?.items || []).map(i => ({
      title: i.title?.[0] || "Untitled", authors: (i.author || []).map(a => `${a.family||""}, ${a.given?.[0]||""}.`).slice(0,3).join(", "),
      year: i.published?.["date-parts"]?.[0]?.[0] || "n.d.", doi: i.DOI || "", journal: i["container-title"]?.[0] || "",
      abstract: i.abstract || "", tier: i.abstract ? "abstract" : "metadata", source: "CrossRef",
    }));
  } catch { return []; }
}

const formatAPA = r => `${r.authors} (${r.year}). ${r.title}. ${r.journal}${r.doi ? `. https://doi.org/${r.doi}` : ""}`;
const tierBadge = t => t === "fulltext" ? "✅ Full-text" : t === "abstract" ? "📋 Abstract" : "⚠️ Metadata";

// ============ VALIDATION LAYER ============
function validateData(tabels) {
  const warnings = [];
  (tabels || []).forEach((tbl) => {
    tbl.rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (ci === 0) return;
        const num = parseFloat(cell);
        if (isNaN(num) || !cell) return;
        const colVals = tbl.rows.map(r => parseFloat(r[ci])).filter(v => !isNaN(v));
        if (colVals.length < 3) return;
        const mean = colVals.reduce((a, b) => a + b, 0) / colVals.length;
        const sd = Math.sqrt(colVals.reduce((a, b) => a + (b - mean) ** 2, 0) / colVals.length);
        if (sd > 0 && Math.abs(num - mean) > 5 * sd) {
          warnings.push({ tabel: tbl.title, row: ri + 1, col: tbl.headers[ci], value: num, msg: `Nilai ${num} menyimpang >5σ dari mean (${mean.toFixed(2)} ± ${sd.toFixed(2)})` });
        }
        if (num < 0 && colVals.filter(v => v >= 0).length > colVals.length * 0.8) {
          warnings.push({ tabel: tbl.title, row: ri + 1, col: tbl.headers[ci], value: num, msg: `Nilai negatif (${num}) di kolom yang mayoritas positif — kemungkinan typo?` });
        }
      });
    });
  });
  return warnings;
}

// ============ CONFIDENCE SCORE ============
function calcConfidence(data) {
  const reasons = []; let score = 100;
  (data.hasilTabels || []).forEach(tbl => { tbl.rows.forEach(row => { row.forEach((cell, ci) => { if (ci === 0) return; const colVals = tbl.rows.map(r => parseFloat(r[ci])).filter(v => !isNaN(v)); if (colVals.length < 2) return; const mean = colVals.reduce((a, b) => a + b, 0) / colVals.length; const cv = mean !== 0 ? (Math.sqrt(colVals.reduce((a, b) => a + (b - mean) ** 2, 0) / colVals.length) / Math.abs(mean)) * 100 : 0; if (cv > 50) { score -= 5; reasons.push(`High variance in ${tbl.title} col ${tbl.headers[ci]} (CV=${cv.toFixed(0)}%)`); } }); }); });
  const refs = data.selectedRefs || []; const ftCount = refs.filter(r => r.tier === "fulltext").length; const metaCount = refs.filter(r => r.tier === "metadata").length;
  if (refs.length === 0) { score -= 20; reasons.push("No references"); } else if (ftCount === 0 && metaCount > 0) { score -= 10; reasons.push(`${metaCount} metadata-only refs`); }
  if (refs.length < 3) { score -= 5; reasons.push("Less than 3 references"); }
  if (data.enableAnalisis && (data.analisisBlocks || []).some(b => b.hasil) && !(data.analisisBlocks || []).some(b => b.deterministicResult)) { score -= 10; reasons.push("Not verified by Deterministic Engine"); }
  if (!data.pembahasan) { score -= 15; reasons.push("No pembahasan"); }
  if (!data.abstrak) { score -= 5; reasons.push("No abstrak"); }
  return { score: Math.max(0, Math.min(100, score)), reasons: [...new Set(reasons)] };
}

// ============ DETERMINISTIC MATH ENGINE ============
async function runDeterministicCalc(apiKey, equation, instruksi, tabelData, prevResult) {
  const codePrompt = `Kamu adalah code generator. Tugas: HANYA tulis JavaScript function yang menghitung berdasarkan rumus dan data.\n\nRUMUS: ${equation}\nINSTRUKSI: ${instruksi || "Hitung sesuai rumus"}\nDATA: ${tabelData}\n${prevResult ? `HASIL SEBELUMNYA: ${prevResult}` : ""}\n\nRULES:\n- Output HANYA JavaScript code, TANPA penjelasan, TANPA markdown backticks\n- Function harus bernama 'calculate' dan return object: { cleanResult: "string ringkas", workingSheet: "string detail step-by-step", tables: [{title,headers,rows}] }\n- Parse data string jadi angka, hitung dengan presisi penuh`;
  const jsCode = await callGemini(apiKey, "Kamu code generator JavaScript. Output HANYA code tanpa backticks/markdown.", codePrompt);
  try { const cleanCode = jsCode.replace(/```javascript|```js|```/g, "").trim(); const fn = new Function(cleanCode + "\nreturn calculate();"); const result = fn(); return { success: true, ...result }; }
  catch (e) { return { success: false, cleanResult: `Error: ${e.message}`, workingSheet: `Code:\n${jsCode}\n\nError: ${e.message}`, tables: [] }; }
}

// ============ MOKU-THEMED UI COMPONENTS ============
function DInput({ value: ev, onCommit, style: es, ...props }) {
  const t = useTheme();
  const si = { width: "100%", padding: "9px 13px", background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Nunito',system-ui,sans-serif" };
  const [l, setL] = useState(ev || ""); const f = useRef(false);
  useEffect(() => { if (!f.current) setL(ev || ""); }, [ev]);
  return <input style={{ ...si, ...es }} value={l} onChange={e => setL(e.target.value)} onFocus={() => { f.current = true; }} onBlur={() => { f.current = false; onCommit(l); }} {...props} />;
}

function DTextarea({ value: ev, onCommit, style: es, ...props }) {
  const t = useTheme();
  const si = { width: "100%", padding: "10px 13px", background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 13, outline: "none", minHeight: 110, resize: "vertical", boxSizing: "border-box", fontFamily: "'Nunito',system-ui,sans-serif", lineHeight: 1.6 };
  const [l, setL] = useState(ev || ""); const f = useRef(false);
  useEffect(() => { if (!f.current) setL(ev || ""); }, [ev]);
  return <textarea style={{ ...si, ...es }} value={l} onChange={e => setL(e.target.value)} onFocus={() => { f.current = true; }} onBlur={() => { f.current = false; onCommit(l); }} {...props} />;
}

function Card({ title, icon, children, action }) {
  const t = useTheme();
  return (<div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "20px 22px", marginBottom: 14, animation: "fadeIn .3s ease", boxShadow: t.shadow }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: title ? 14 : 0, flexWrap: "wrap", gap: 8 }}>{title && <h3 style={{ color: t.text, margin: 0, fontSize: 15, fontWeight: 800 }}>{icon} {title}</h3>}{action}</div>{children}</div>);
}

function Btn({ children, variant = "primary", style: es, ...props }) {
  const t = useTheme();
  const base = { padding: "8px 18px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .15s", fontFamily: "'Nunito',system-ui,sans-serif" };
  const v = { primary: { background: t.primary, color: "#fff" }, secondary: { background: "transparent", color: t.primary, border: `1.5px solid ${t.primary}` }, success: { background: t.green, color: "#fff" }, gold: { background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, color: "#fff" }, danger: { background: t.red, color: "#fff" }, ghost: { background: t.bg2, color: t.sub, border: `1px solid ${t.border}` } };
  return <button style={{ ...base, ...v[variant], ...es }} {...props}>{children}</button>;
}

function ConfidenceBadge({ data }) {
  const t = useTheme();
  const { score, reasons } = calcConfidence(data);
  const [open, setOpen] = useState(false);
  const color = score >= 80 ? t.green : score >= 60 ? t.amber : t.red;
  return (<div style={{ position: "relative", display: "inline-block" }}><div onClick={() => setOpen(!open)} style={{ background: `${color}15`, border: `1.5px solid ${color}30`, borderRadius: 10, padding: "4px 10px", cursor: "pointer", fontSize: 10, color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>🔍 Audit: {score}%</div>
    {open && reasons.length > 0 && (<div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 12, padding: 10, minWidth: 250, zIndex: 10, fontSize: 10, color: t.sub, boxShadow: t.shadow }}><div style={{ fontWeight: 800, color: t.text, marginBottom: 6 }}>Breakdown:</div>{reasons.map((r, i) => <div key={i} style={{ marginBottom: 3 }}>• {r}</div>)}<div style={{ marginTop: 6, fontSize: 9, color: t.dim, fontStyle: "italic" }}>Internal only</div></div>)}</div>);
}

// ============ TABLE BUILDER ============
function TableBuilder({ value, onChange }) {
  const t = useTheme();
  const si = { width: "100%", padding: "4px 6px", background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "'Nunito',system-ui,sans-serif" };
  const [mode, setMode] = useState("build"); const [pasteText, setPasteText] = useState(""); const [local, setLocal] = useState(value); const isFocused = useRef(false);
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
    {mode === "paste" ? (<div><p style={{ fontSize: 11, color: t.sub, margin: "0 0 8px" }}>Paste dari Excel (tab-separated). Baris 1 = header.</p><textarea style={{ width: "100%", padding: "10px", background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 12, minHeight: 80, outline: "none", fontFamily: "inherit" }} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste..." /><Btn variant="success" onClick={parsePaste} style={{ marginTop: 8 }}>✓ Parse</Btn></div>) : (
    <div><div style={{ overflowX: "auto", marginBottom: 8 }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}><thead><tr><th style={{ padding: "4px", color: t.dim, fontSize: 10, width: 24 }}>#</th>
    {local.headers.map((h, i) => (<th key={i} style={{ padding: 3, position: "relative" }}><input style={{ ...si, fontWeight: 700, textAlign: "center" }} value={h} onChange={e => updHdr(i, e.target.value)} onFocus={() => { isFocused.current = true; }} onBlur={flush} />{local.headers.length > 1 && <button onClick={() => rmCol(i)} style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: t.red, color: "#fff", border: "none", fontSize: 8, cursor: "pointer" }}>✕</button>}</th>))}
    <th style={{ width: 24 }}></th></tr></thead><tbody>
    {local.rows.map((row, ri) => (<tr key={ri}><td style={{ color: t.dim, fontSize: 10, textAlign: "center" }}>{ri + 1}</td>
    {row.map((cell, ci) => (<td key={ci} style={{ padding: 2 }}><input style={si} value={cell} onChange={e => updCell(ri, ci, e.target.value)} onFocus={() => { isFocused.current = true; }} onBlur={flush} /></td>))}
    <td><button onClick={() => rmRow(ri)} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 11 }}>✕</button></td></tr>))}
    </tbody></table></div><div style={{ display: "flex", gap: 6 }}><Btn variant="ghost" onClick={addRow}>+ Baris</Btn><Btn variant="ghost" onClick={addCol}>+ Kolom</Btn></div></div>)}
  </div>);
}

// ============ ANALISIS BLOCK ============
function AnalisisBlock({ index, value, total, onChange, onRemove, apiKey, allTabels }) {
  const t = useTheme();
  const fRef = useRef(null); const [calculating, setCalculating] = useState(false); const [showWorking, setShowWorking] = useState(false);
  const handleFoto = (e) => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => { onChange({ ...value, fotoRumus: { name: file.name, type: file.type, data: ev.target.result.split(",")[1], preview: ev.target.result } }); }; r.readAsDataURL(file); };
  const autoCalc = async () => { if (!apiKey) { alert("API Key belum diisi!"); return; } setCalculating(true); const tabelData = (allTabels || []).map(t => `${t.title}:\n${t.headers.join(" | ")}\n${t.rows.map(r => r.join(" | ")).join("\n")}`).join("\n\n"); const result = await runDeterministicCalc(apiKey, value.equation, value.instruksi, tabelData, index > 0 ? value.prevResult : ""); onChange({ ...value, hasil: result.cleanResult || "", workingSheet: result.workingSheet || "", deterministicResult: true, resultTables: result.tables || [] }); setCalculating(false); };
  return (
    <div style={{ background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.primary }}>📐 Analisis {index + 1}{index > 0 ? ` (chain dari #${index})` : ""}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{value.deterministicResult && <span style={{ fontSize: 9, color: t.green, background: t.greenBg, padding: "2px 6px", borderRadius: 6 }}>✓ JS-Verified</span>}{total > 1 && <button onClick={onRemove} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 11 }}>🗑️</button>}</div>
      </div>
      <div style={{ marginBottom: 8 }}><label style={{ display: "block", fontSize: 10, fontWeight: 700, color: t.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Foto Rumus (opsional)</label><input ref={fRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} /><div style={{ display: "flex", gap: 8, alignItems: "center" }}><Btn variant="ghost" onClick={() => fRef.current?.click()} style={{ fontSize: 10, padding: "4px 10px" }}>📷 Upload</Btn>{value.fotoRumus && (<div style={{ position: "relative" }}><img src={value.fotoRumus.preview} alt="" style={{ height: 45, borderRadius: 8, border: `1px solid ${t.border}` }} /><button onClick={() => onChange({ ...value, fotoRumus: null })} style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: t.red, color: "#fff", border: "none", fontSize: 8, cursor: "pointer" }}>✕</button></div>)}</div></div>
      <div style={{ marginBottom: 8 }}><label style={{ display: "block", fontSize: 10, fontWeight: 700, color: t.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Rumus / Equation</label><DInput value={value.equation} onCommit={v => onChange({ ...value, equation: v })} placeholder="Z = V/I, k = 1 + 3.322·log(n)" /></div>
      <div style={{ marginBottom: 8 }}><label style={{ display: "block", fontSize: 10, fontWeight: 700, color: t.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Instruksi Perhitungan</label><DInput value={value.instruksi || ""} onCommit={v => onChange({ ...value, instruksi: v })} placeholder="Hitung mean, lalu Sturges..." /></div>
      <div style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><label style={{ fontSize: 10, fontWeight: 700, color: t.dim, textTransform: "uppercase", letterSpacing: 1 }}>Clean Result</label><Btn variant="primary" onClick={autoCalc} disabled={calculating} style={{ padding: "4px 12px", fontSize: 10 }}>{calculating ? "⏳ Computing..." : "🔧 Deterministic Calculate"}</Btn></div><DTextarea value={value.hasil} onCommit={v => onChange({ ...value, hasil: v })} style={{ minHeight: 60 }} placeholder="Klik Deterministic Calculate..." /></div>
      {value.workingSheet && (<div style={{ marginBottom: 8 }}><button onClick={() => setShowWorking(!showWorking)} style={{ background: "none", border: "none", color: t.primary, cursor: "pointer", fontSize: 11, padding: 0 }}>{showWorking ? "▼" : "▶"} Working Sheet</button>{showWorking && <div style={{ background: t.bg, borderRadius: 10, padding: 10, marginTop: 6, fontSize: 11, color: t.sub, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", fontFamily: "monospace" }}>{value.workingSheet}</div>}</div>)}
      {value.resultTables?.length > 0 && value.resultTables.map((rt, rti) => (<div key={rti} style={{ marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 700, color: t.amber, marginBottom: 4 }}>{rt.title || `Tabel Hasil ${rti+1}`}</div><div style={{ overflowX: "auto", fontSize: 11 }}><table style={{ borderCollapse: "collapse", width: "100%" }}><thead><tr>{(rt.headers||[]).map((h,i) => <th key={i} style={{ padding: "4px 8px", background: t.primaryBg, border: `1px solid ${t.border}`, color: t.text, fontSize: 10 }}>{h}</th>)}</tr></thead><tbody>{(rt.rows||[]).map((row,ri) => <tr key={ri}>{row.map((c,ci) => <td key={ci} style={{ padding: "3px 8px", border: `1px solid ${t.border}`, color: t.text, fontSize: 10 }}>{c}</td>)}</tr>)}</tbody></table></div></div>))}
      <div><label style={{ display: "block", fontSize: 10, fontWeight: 700, color: t.dim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Keterangan</label><DInput value={value.keterangan} onCommit={v => onChange({ ...value, keterangan: v })} placeholder="Interpretasi singkat..." /></div>
    </div>
  );
}

// ============ REF MANAGER ============
function RefManager({ selectedRefs, onRefsChange, apiKey }) {
  const t = useTheme();
  const [query, setQuery] = useState(""); const [results, setResults] = useState([]); const [busy, setBusy] = useState(false);
  const [localRefs, setLocalRefs] = useState(selectedRefs || []); const [uploading, setUploading] = useState(false); const [uploadMsg, setUploadMsg] = useState("");
  const onRefsRef = useRef(onRefsChange); onRefsRef.current = onRefsChange; const pdfRef = useRef(null);
  const prevLen = useRef(selectedRefs?.length);
  useEffect(() => { if (selectedRefs?.length !== prevLen.current) { setLocalRefs(selectedRefs || []); prevLen.current = selectedRefs?.length; } }, [selectedRefs]);
  const doSearch = async () => { if (!query.trim()) return; setBusy(true); setResults(await searchCrossRef(query)); setBusy(false); };
  const handleAdd = (r) => { if (localRefs.find(x => x.doi === r.doi && x.title === r.title)) return; const next = [...localRefs, r]; setLocalRefs(next); onRefsRef.current(next); };
  const handleRemove = (i) => { const next = localRefs.filter((_, x) => x !== i); setLocalRefs(next); onRefsRef.current(next); };
  const tierColor = tt => tt === "fulltext" ? t.green : tt === "abstract" ? t.amber : t.red;

  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files); if (!files.length || !apiKey) { if (!apiKey) alert("API Key belum diisi!"); return; }
    setUploading(true); let accumulated = [...localRefs];
    for (let fi = 0; fi < files.length; fi++) {
      const file = files[fi]; setUploadMsg(`Reading PDF ${fi+1}/${files.length}: ${file.name}...`);
      try {
        const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = ev => resolve(ev.target.result.split(",")[1]); reader.onerror = () => reject(new Error("Read failed")); reader.readAsDataURL(file); });
        const extracted = await callGemini(apiKey, `You are an academic paper analyzer. Read this PDF thoroughly. Extract information into a JSON object.\n\nCRITICAL JSON RULES:\n- Return ONLY the JSON object, nothing else\n- NO markdown backticks\n- Use double quotes for all keys and string values\n- ESCAPE all double quotes inside values with backslash\n- Keep each value as a SINGLE LINE string\n\nJSON format:\n{"title":"paper title","authors":"Author1, A.","year":"2024","journal":"Journal Name","doi":"DOI or empty","abstract":"full abstract","introduction":"3-5 sentence summary","methodology":"detailed methods","results":"key results with numbers","discussion":"main points","conclusions":"main conclusions","keyFindings":"5-8 specific findings","relevantData":"key quantitative data","limitations":"limitations mentioned"}`, "Extract all scientific content from this paper PDF as valid JSON.", [{ type: "application/pdf", data: base64 }]);
        if (extracted.startsWith("Error")) { alert(`Gemini error: ${extracted}`); continue; }
        let meta = null;
        try { const clean = extracted.replace(/```json|```/g, "").trim(); const m = clean.match(/\{[\s\S]*\}/); if (m) meta = JSON.parse(m[0]); } catch (e1) { try { const fixed = extracted.replace(/```json|```/g, "").trim().replace(/\{[\s\S]*\}/, m => m.replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ')); const m2 = fixed.match(/\{[\s\S]*\}/); if (m2) meta = JSON.parse(m2[0]); } catch (e2) { try { const getText = (key) => { const m = extracted.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)); return m ? m[1].replace(/\\n/g, ' ') : ""; }; meta = { title: getText("title"), authors: getText("authors"), year: getText("year"), journal: getText("journal"), doi: getText("doi"), abstract: getText("abstract"), introduction: getText("introduction"), methodology: getText("methodology"), results: getText("results"), discussion: getText("discussion"), conclusions: getText("conclusions"), keyFindings: getText("keyFindings"), relevantData: getText("relevantData"), limitations: getText("limitations") }; if (!meta.title) meta = null; } catch {} } }
        if (meta) { const ref = { title: meta.title || file.name.replace(".pdf",""), authors: meta.authors || "Unknown", year: meta.year || "n.d.", journal: meta.journal || "", doi: meta.doi || "", abstract: meta.abstract || "", introduction: meta.introduction || "", methodology: meta.methodology || "", results: meta.results || "", discussion: meta.discussion || "", conclusions: meta.conclusions || "", keyFindings: meta.keyFindings || "", relevantData: meta.relevantData || "", limitations: meta.limitations || "", tier: "fulltext", source: "PDF Upload" }; accumulated = [...accumulated, ref]; setLocalRefs(accumulated); onRefsRef.current(accumulated); } else { alert(`Gagal parse: ${file.name}`); }
      } catch (err) { alert(`Error: ${err.message}`); }
    }
    setUploading(false); setUploadMsg(""); if (pdfRef.current) pdfRef.current.value = "";
  };

  return (<>
    <Card title="Referensi Jurnal" icon="🔍" action={<div style={{ display: "flex", gap: 6, alignItems: "center" }}><input ref={pdfRef} type="file" accept=".pdf" multiple onChange={handlePdfUpload} style={{ display: "none" }} /><Btn variant="secondary" onClick={() => pdfRef.current?.click()} disabled={uploading} style={{ fontSize: 10, padding: "4px 10px" }}>{uploading ? `⏳ ${uploadMsg}` : "📄 Upload PDF"}</Btn></div>}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}><input style={{ flex: 1, padding: "9px 13px", background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search CrossRef..." onKeyDown={e => e.key === "Enter" && doSearch()} /><Btn onClick={doSearch} disabled={busy}>{busy ? "⏳" : "Cari"}</Btn></div>
      {results.map((r, i) => { const added = localRefs.some(x => x.doi === r.doi); return (<div key={i} style={{ background: added ? t.greenBg : t.bg2, border: `1px solid ${added ? t.green : t.border}20`, borderRadius: 10, padding: 10, marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 3, flex: 1 }}>{r.title}</div><span style={{ fontSize: 9, color: tierColor(r.tier), fontWeight: 700, flexShrink: 0 }}>{tierBadge(r.tier)}</span></div><div style={{ fontSize: 10, color: t.sub }}>{r.authors} ({r.year}) — {r.journal}</div>{added ? <span style={{ fontSize: 10, color: t.green, fontWeight: 600 }}>✓ Added</span> : <Btn variant="success" onClick={() => handleAdd(r)} style={{ padding: "3px 10px", fontSize: 10, marginTop: 4 }}>+ Tambah</Btn>}</div>); })}
    </Card>
    <Card title={`Referensi Terpilih (${localRefs.length})`} icon="📚">
      {!localRefs.length && <p style={{ color: t.sub, fontSize: 12 }}>Cari di CrossRef atau upload PDF.</p>}
      {localRefs.map((r, i) => (<div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: t.primaryBg, border: `1px solid ${t.primary}15`, borderRadius: 10, padding: 8, marginBottom: 5 }}><span style={{ fontSize: 9, color: tierColor(r.tier), fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{tierBadge(r.tier)}</span><div style={{ flex: 1, fontSize: 11, color: t.text, lineHeight: 1.5 }}>[{i+1}] {formatAPA(r)}</div><button onClick={() => handleRemove(i)} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>✕</button></div>))}
    </Card>
  </>);
}

// ===== PART 2 STARTS BELOW — PASTE nextjs-laprak-part2.jsx CONTENT HERE =====
// ============ MAIN APP — MOKU THEMED ============
export default function LaprakAI() {
  const t = useTheme();
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [customLogo, setCustomLogo] = useState(null);
  const logoUpRef = useRef(null);
  const [data, setData] = useState({
    nama: "", nim: "", kelompok: "", kelas: "", prodi: "", fakultas: "", universitas: "", tahun: "2026",
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
  const fileRef = useRef(null);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const saveToStorage = useCallback(async (d) => { try { const o = { ...(d || dataRef.current) }; delete o.fotoResults; if (o.selectedRefs) o.selectedRefs = o.selectedRefs.map(r => { const { pdfData, ...rest } = r; return rest; }); localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); setSaved("✓"); setTimeout(() => setSaved(""), 1200); } catch {} }, []);
  useEffect(() => { try { const s = localStorage.getItem(STORAGE_KEY); if (s) setData(p => ({ ...p, ...JSON.parse(s) })); const k = localStorage.getItem("laprak-api-key"); if (k) setApiKey(k); } catch {} }, []);
  const changeStep = useCallback((n) => { saveToStorage(); setStep(n); }, [saveToStorage]);
  const upd = useCallback((k, v) => { setData(prev => ({ ...prev, [k]: v })); }, []);
  const saveApiKey = (k) => { setApiKey(k); try { localStorage.setItem("laprak-api-key", k); } catch {} };
  const handlePhoto = (e) => { Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload = ev => { setData(prev => ({ ...prev, fotoResults: [...prev.fotoResults, { name: f.name, type: f.type, data: ev.target.result.split(",")[1], preview: ev.target.result }] })); }; r.readAsDataURL(f); }); };
  const handleLogoUpload = (e) => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => setCustomLogo({ preview: ev.target.result, data: ev.target.result.split(",")[1], type: file.type }); r.readAsDataURL(file); };
  const tableToText = () => (data.hasilTabels || []).map((t) => { if (!t.rows.some(r => r.some(c => c))) return ""; return `${t.title}:\n${t.headers.join(" | ")}\n${t.rows.map(r => r.join(" | ")).join("\n")}`; }).filter(Boolean).join("\n\n");
  const analisisCleanText = () => { if (!data.enableAnalisis) return ""; return (data.analisisBlocks || []).map((b, i) => { const p = []; if (b.equation) p.push(`Rumus: ${b.equation}`); if (b.hasil) p.push(b.hasil); if (b.keterangan) p.push(`Keterangan: ${b.keterangan}`); return p.length ? `Analisis ${i+1}:\n${p.join("\n")}` : ""; }).filter(Boolean).join("\n\n"); };
  const refContext = () => (data.selectedRefs || []).map(r => { let ctx = `- ${r.authors} (${r.year}). ${r.title}. ${r.journal} [${tierBadge(r.tier)}]`; if (r.tier === "fulltext") { if (r.abstract) ctx += `\n  Abstract: ${r.abstract}`; if (r.methodology) ctx += `\n  Methodology: ${r.methodology}`; if (r.results) ctx += `\n  Results: ${r.results}`; if (r.conclusions) ctx += `\n  Conclusions: ${r.conclusions}`; if (r.keyFindings) ctx += `\n  Key Findings: ${r.keyFindings}`; } else { if (r.abstract) ctx += `\n  Abstract: ${r.abstract.substring(0, 400)}`; } return ctx; }).join("\n\n");

  const SYS = `Kamu asisten akademik. Bahasa Indonesia akademik formal. TANPA markdown (##, **, dll). Teks paragraf biasa. Data user IMMUTABLE. JUJUR tentang level pengetahuan referensi.`;

  // AI GENERATE FUNCTIONS
  const generateStep2 = async () => { setLoading(true); setLoadingMsg("Generating Pendahuluan..."); const pend = await callGemini(apiKey, SYS, `Buatkan HANYA PENDAHULUAN untuk:\n- Mata Kuliah: ${data.mataKuliah}, Topik: ${data.topikPraktikum}, Judul: ${data.judulLaporan}\n3-4 paragraf. Referensi: ${refContext() || "Belum ada."}\nTANPA header.`); upd("pendahuluan", pend.replace(/^PENDAHULUAN[:\s]*/i, "").trim()); setLoadingMsg("Generating Studi Pustaka..."); const sp = await callGemini(apiKey, SYS, `Buatkan HANYA STUDI PUSTAKA untuk:\n- ${data.topikPraktikum}, ${data.judulLaporan}\n5 sub-bab (A-E). Referensi: ${refContext()}\nFormat: A. [Judul]\n[teks]\n...sampai E.`); upd("studiPustaka", sp.replace(/^STUDI PUSTAKA[:\s]*/i, "").trim()); setLoading(false); };

  const generateSummary = async () => { setLoading(true); setLoadingMsg("Running validation..."); const w = validateData(data.hasilTabels); setWarnings(w); setLoadingMsg("Agent analyzing..."); const imgs = data.fotoResults.slice(0, 4).map(f => ({ type: f.type, data: f.data })); let visionDesc = ""; if (imgs.length > 0) { setLoadingMsg("Vision AI..."); visionDesc = await callGemini(apiKey, "Deskripsikan detail ilmiah gambar hasil praktikum.", `Topik: "${data.topikPraktikum}":`, imgs); } const result = await callGemini(apiKey, SYS, `Research Agent:\n${data.preFeedback ? `⭐ ARAHAN USER: ${data.preFeedback}\n` : ""}DATA:\n${tableToText()}\n${data.hasilNaratif}\n${data.enableAnalisis ? analisisCleanText() : ""}\n${visionDesc ? `Visual: ${visionDesc}` : ""}\n${w.length ? `⚠️ WARNINGS:\n${w.map(x => x.msg).join("\n")}` : ""}\nReferensi: ${refContext()}\n\nOutput SUMMARY OF FINDINGS.`); upd("summaryFindings", result); setLoading(false); };

  const generatePembahasan = async () => { setLoading(true); setLoadingMsg("Drafting Pembahasan..."); const pemb = await callGemini(apiKey, SYS, `Buat PEMBAHASAN:\nTopik: ${data.topikPraktikum}, Judul: ${data.judulLaporan}\nData: ${tableToText()}\n${data.enableAnalisis ? analisisCleanText() : ""}\nSummary: ${data.summaryFindings}\n${data.preFeedback ? `⭐ ARAHAN: ${data.preFeedback}` : ""}\n${data.userFeedback ? `💬 FEEDBACK: ${data.userFeedback}` : ""}\nReferensi: ${refContext()}\nMulai "Pada praktikum kali ini..."`); upd("pembahasan", pemb.replace(/^PEMBAHASAN[:\s]*/i, "").trim()); setLoadingMsg("Drafting Kesimpulan..."); const kesl = await callGemini(apiKey, SYS, `Buat KESIMPULAN:\n${data.topikPraktikum}\nPembahasan: ${pemb.substring(0, 1500)}\nData: ${tableToText().substring(0, 500)}\n2-3 paragraf.`); upd("kesimpulan", kesl.replace(/^KESIMPULAN[:\s]*/i, "").trim()); setLoading(false); };

  const revisiPembahasan = async () => { if (!data.revisiInstruksi?.trim()) return; setLoading(true); setLoadingMsg("Merevisi Pembahasan..."); const r = await callGemini(apiKey, SYS, `REVISI PEMBAHASAN:\n\n${data.pembahasan}\n\nINSTRUKSI: ${data.revisiInstruksi}\nDATA: ${tableToText().substring(0, 800)}\nRef: ${refContext().substring(0, 800)}\n\nOutput: teks revisi LENGKAP.`); upd("pembahasan", r.replace(/^PEMBAHASAN[:\s]*/i, "").trim()); upd("revisiInstruksi", ""); setLoading(false); };
  const revisiKesimpulan = async () => { if (!data.revisiInstruksi?.trim()) return; setLoading(true); setLoadingMsg("Merevisi Kesimpulan..."); const r = await callGemini(apiKey, SYS, `REVISI KESIMPULAN:\n\n${data.kesimpulan}\n\nINSTRUKSI: ${data.revisiInstruksi}\nPembahasan: ${data.pembahasan?.substring(0, 800)}\nOutput: revisi LENGKAP.`); upd("kesimpulan", r.replace(/^KESIMPULAN[:\s]*/i, "").trim()); upd("revisiInstruksi", ""); setLoading(false); };
  const generateAbstrak = async () => { setLoading(true); setLoadingMsg("Generating Abstrak..."); const r = await callGemini(apiKey, "Tulis abstrak ID & EN, 150-200 kata. Tanpa markdown.", `Abstrak untuk: ${data.judulLaporan}\nPendahuluan: ${data.pendahuluan?.substring(0, 400)}\nHasil: ${data.hasilNaratif?.substring(0, 400)}\nKesimpulan: ${data.kesimpulan?.substring(0, 400)}\n\nFormat: ABSTRAK:\n[ID]\n\nABSTRACT:\n[EN]\n\nKata Kunci: [5]\nKeywords: [5]`); upd("abstrak", r); setLoading(false); };

  // DOCX (export as .txt for now — full docx requires CDN import)
  const exportTxt = () => { const content = [`LAPORAN PRAKTIKUM\n${data.judulLaporan}`, `${data.nama} | ${data.nim}\n${data.prodi} | ${data.universitas}`, `\nABSTRAK\n${data.abstrak}`, `\nPENDAHULUAN\n${data.pendahuluan}`, `\nSTUDI PUSTAKA\n${data.studiPustaka}`, `\nALAT & BAHAN\n${data.alatBahan}`, `\nPROSEDUR\n${data.prosedur}`, `\nHASIL\n${data.hasilNaratif}\n${tableToText()}`, data.enableAnalisis ? `\nANALISIS\n${analisisCleanText()}` : "", `\nPEMBAHASAN\n${data.pembahasan}`, `\nKESIMPULAN\n${data.kesimpulan}`, `\nREFERENSI\n${data.selectedRefs.map((r,i) => `[${i+1}] ${formatAPA(r)}`).join("\n")}`].filter(Boolean).join("\n"); const b = new Blob([content], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `Laprak_${data.topikPraktikum?.replace(/\s+/g,"_")||"draft"}.txt`; a.click(); };

  const stepNames = ["Profil & Topik", "Referensi & Lit. Review", "Data & Analisis", "AI Agent & Feedback", "Review & Export"];
  const done = [!!(data.nama && data.nim && data.mataKuliah && data.topikPraktikum && data.judulLaporan), !!(data.pendahuluan && data.studiPustaka), !!(data.alatBahan && data.prosedur && (data.hasilNaratif || (data.hasilTabels||[]).some(t => t.rows.some(r => r.some(c => c))))), !!(data.pembahasan && data.kesimpulan), !!(data.abstrak)];
  const LBL = { display: "block", fontSize: 10, fontWeight: 700, color: t.dim, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1.2 };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'Nunito','DM Sans',system-ui,sans-serif" }}>
      <style>{shimmer}{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: t.card, padding: "14px 20px", borderBottom: `2px solid ${t.primary}30`, display: "flex", alignItems: "center", gap: 14, boxShadow: t.shadow }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontWeight: 900 }}>M</div>
        <div style={{ flex: 1 }}><h1 style={{ fontSize: 17, fontWeight: 800, color: t.text, margin: 0 }}>Laprak AI <span style={{ fontSize: 10, color: t.primary }}>V3.2</span></h1><p style={{ fontSize: 9, color: t.dim, margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>Deterministic • HITL Agent • {data.prodi || "Multi-Jurusan"}</p></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 10, color: t.green, background: t.greenBg, padding: "3px 8px", borderRadius: 8 }}>{saved}</span>}
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.sub, width: 30, height: 30, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>⚙️</button>
        </div>
      </div>

      {showSettings && <div style={{ background: t.card, borderBottom: `1px solid ${t.border}`, padding: "10px 20px" }}><label style={LBL}>Gemini API Key</label><div style={{ display: "flex", gap: 6 }}><DInput style={{ flex: 1, fontFamily: "monospace", fontSize: 11 }} type="password" value={apiKey} onCommit={v => saveApiKey(v)} placeholder="AIzaSy..." /><span style={{ fontSize: 10, color: apiKey ? t.green : t.red, alignSelf: "center" }}>{apiKey ? "✓" : "✕"}</span></div></div>}
      {loading && <div style={{ padding: "0 20px" }}><div style={{ height: 3, background: `linear-gradient(90deg, ${t.primary}, ${t.teal}, ${t.primary})`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 2 }} /><div style={{ textAlign: "center", fontSize: 11, color: t.primary, padding: "6px 0", animation: "pulse 1.5s infinite" }}>{loadingMsg}</div></div>}

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 14px" }}>
        {/* Steps */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[1,2,3,4,5].map(n => <div key={n} style={{ display: "flex", alignItems: "center", gap: 3 }}><div onClick={() => changeStep(n)} title={stepNames[n-1]} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", background: step === n ? t.primary : done[n-1] ? t.green : t.bg2, color: step === n || done[n-1] ? "#fff" : t.sub, border: `2px solid ${step === n ? t.primary : done[n-1] ? t.green : t.border}`, boxShadow: step === n ? `0 0 12px ${t.primary}30` : "none" }}>{n}</div>{n < 5 && <div style={{ width: 16, height: 2, background: done[n-1] ? t.green : t.border }} />}</div>)}
        </div>
        <div style={{ textAlign: "center", marginBottom: 18 }}><span style={{ fontSize: 13, fontWeight: 800, color: t.primary }}>{step}. {stepNames[step-1]}</span></div>

        {/* STEP 1: PROFIL */}
        {step === 1 && <>
          <Card title="Profil Mahasiswa" icon="👤">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["nama","Nama"],["nim","NIM"]].map(([k,l]) => <div key={k}><label style={LBL}>{l}</label><DInput value={data[k]} onCommit={v => upd(k,v)} /></div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              {[["kelompok","Kelompok"],["kelas","Kelas"]].map(([k,l]) => <div key={k}><label style={LBL}>{l}</label><DInput value={data[k]} onCommit={v => upd(k,v)} /></div>)}
            </div>
            {[["prodi","Program Studi"],["fakultas","Fakultas"]].map(([k,l]) => <div key={k} style={{ marginTop: 10 }}><label style={LBL}>{l}</label><DInput value={data[k]} onCommit={v => upd(k,v)} /></div>)}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              {[["universitas","Universitas"],["tahun","Tahun"]].map(([k,l]) => <div key={k}><label style={LBL}>{l}</label><DInput value={data[k]} onCommit={v => upd(k,v)} /></div>)}
            </div>
          </Card>
          <Card title="Logo Universitas" icon="🏛️"><input ref={logoUpRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} style={{ display: "none" }} /><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Btn variant="secondary" onClick={() => logoUpRef.current?.click()}>📷 Upload</Btn>{customLogo && <div style={{ position: "relative" }}><img src={customLogo.preview} alt="" style={{ height: 60, borderRadius: 8, border: `1px solid ${t.border}` }} /><button onClick={() => setCustomLogo(null)} style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: t.red, color: "#fff", border: "none", fontSize: 8, cursor: "pointer" }}>✕</button></div>}{!customLogo && <span style={{ fontSize: 10, color: t.dim }}>Default UNAIR</span>}</div></Card>
          <Card title="Detail Praktikum" icon="🔬">{[["mataKuliah","Mata Kuliah"],["topikPraktikum","Topik"],["judulLaporan","Judul"]].map(([k,l]) => <div key={k} style={{ marginBottom: 10 }}><label style={LBL}>{l}</label><DInput value={data[k]} onCommit={v => upd(k,v)} /></div>)}<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div><label style={LBL}>Tanggal</label><DInput type="date" value={data.tanggalPraktikum} onCommit={v => upd("tanggalPraktikum",v)} /></div><div><label style={LBL}>Dosen</label><DInput value={data.dosenPengampu} onCommit={v => upd("dosenPengampu",v)} /></div></div><div style={{ marginTop: 10 }}><label style={LBL}>Asisten</label><DInput value={data.asisten} onCommit={v => upd("asisten",v)} /></div></Card>
        </>}

        {/* STEP 2: REFS */}
        {step === 2 && <>
          <RefManager selectedRefs={data.selectedRefs} onRefsChange={refs => upd("selectedRefs", refs)} apiKey={apiKey} />
          <Card title="Pendahuluan" icon="📝" action={<Btn onClick={generateStep2} disabled={loading || !data.topikPraktikum}>{loading ? "⏳..." : "🤖 Generate"}</Btn>}><DTextarea value={data.pendahuluan} onCommit={v => upd("pendahuluan",v)} placeholder="Generate atau tulis manual..." /></Card>
          <Card title="Studi Pustaka (A-E)" icon="📖"><DTextarea value={data.studiPustaka} onCommit={v => upd("studiPustaka",v)} style={{ minHeight: 180 }} placeholder="Di-generate bersama Pendahuluan..." /></Card>
        </>}

        {/* STEP 3: DATA */}
        {step === 3 && <>
          <Card title="Alat & Bahan" icon="🧪"><DTextarea value={data.alatBahan} onCommit={v => upd("alatBahan",v)} placeholder="Naratif..." /></Card>
          <Card title="Prosedur" icon="📋"><DTextarea value={data.prosedur} onCommit={v => upd("prosedur",v)} style={{ minHeight: 140 }} /></Card>
          <Card title="Hasil — Tabel" icon="📊" action={<Btn variant="ghost" onClick={() => upd("hasilTabels", [...(data.hasilTabels||[]), { title: `Tabel ${(data.hasilTabels||[]).length+1}`, headers: ["No","Parameter","Nilai","Satuan"], rows: [["1","","",""]] }])}>+ Tabel</Btn>}>
            {(data.hasilTabels||[]).map((tbl, ti) => (<div key={ti} style={{ marginBottom: 16, background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><DInput value={tbl.title} onCommit={v => { const ts = [...data.hasilTabels]; ts[ti] = { ...ts[ti], title: v }; upd("hasilTabels", ts); }} style={{ fontWeight: 700, background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, borderRadius: 0, padding: "4px 0", color: t.primary }} />{(data.hasilTabels||[]).length > 1 && <button onClick={() => upd("hasilTabels", data.hasilTabels.filter((_,i) => i!==ti))} style={{ background: "none", border: "none", color: t.red, cursor: "pointer" }}>🗑️</button>}</div><TableBuilder value={tbl} onChange={v => { const ts = [...data.hasilTabels]; ts[ti] = { ...ts[ti], ...v }; upd("hasilTabels", ts); }} /></div>))}
          </Card>
          <Card title="Naratif" icon="📝"><DTextarea value={data.hasilNaratif} onCommit={v => upd("hasilNaratif",v)} placeholder="Deskripsi tambahan..." /></Card>
          <Card title="Foto Hasil" icon="📷"><input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display: "none" }} /><Btn variant="secondary" onClick={() => fileRef.current?.click()}>+ Foto</Btn>{data.fotoResults.length > 0 && <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>{data.fotoResults.map((f, i) => <div key={i} style={{ position: "relative" }}><img src={f.preview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: `1px solid ${t.border}` }} /><button onClick={() => setData(p => ({ ...p, fotoResults: p.fotoResults.filter((_, x) => x!==i) }))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: t.red, color: "#fff", border: "none", fontSize: 9, cursor: "pointer" }}>✕</button></div>)}</div>}</Card>
          <Card title="Analisis Matematis" icon="🧮" action={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>{data.enableAnalisis && <Btn variant="ghost" onClick={() => upd("analisisBlocks", [...(data.analisisBlocks||[]), { equation: "", instruksi: "", fotoRumus: null, hasil: "", workingSheet: "", keterangan: "", deterministicResult: false, resultTables: [] }])}>+ Tambah</Btn>}<label style={{ fontSize: 11, color: t.sub, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><input type="checkbox" checked={data.enableAnalisis} onChange={e => upd("enableAnalisis", e.target.checked)} style={{ accentColor: t.primary }} />Aktifkan</label></div>}>
            {data.enableAnalisis ? <div>{(data.analisisBlocks||[]).map((blk, bi) => <AnalisisBlock key={bi} index={bi} value={blk} total={(data.analisisBlocks||[]).length} apiKey={apiKey} allTabels={data.hasilTabels} onChange={v => { const bs = [...data.analisisBlocks]; bs[bi] = { ...v, prevResult: bi > 0 ? data.analisisBlocks[bi-1]?.hasil : "" }; upd("analisisBlocks", bs); }} onRemove={() => upd("analisisBlocks", data.analisisBlocks.filter((_,i) => i!==bi))} />)}</div> : <p style={{ color: t.sub, fontSize: 12, margin: 0 }}>Opsional — aktifkan untuk math engine.</p>}
          </Card>
        </>}

        {/* STEP 4: AI AGENT */}
        {step === 4 && <>
          {warnings.length > 0 && <Card title="⚠️ Validation Warnings" icon="">{warnings.map((w, i) => <div key={i} style={{ background: t.amberBg, border: `1px solid ${t.amber}25`, borderRadius: 10, padding: 8, marginBottom: 4, fontSize: 11, color: t.amber }}>{w.tabel} — Row {w.row}, Col {w.col}: {w.msg}</div>)}</Card>}
          <Card title="Stage 1 — Pre-Feedback" icon="⭐"><p style={{ fontSize: 11, color: t.sub, margin: "0 0 10px" }}>Arahan SEBELUM AI memproses — apa yang harus difokuskan?</p><DTextarea value={data.preFeedback} onCommit={v => upd("preFeedback",v)} style={{ minHeight: 80 }} placeholder='Contoh: "Fokuskan pengaruh suhu terhadap swelling ratio..."' /></Card>
          <Card title="Stage 2 — AI Research Agent" icon="🔬" action={<Btn onClick={generateSummary} disabled={loading}>{loading && !data.summaryFindings ? "⏳..." : "🤖 Run Agent"}</Btn>}><p style={{ fontSize: 11, color: t.sub, margin: 0 }}>Validation → Vision → Literature → Summary</p>
            {data.summaryFindings && <div style={{ background: t.primaryBg, border: `1px solid ${t.primary}15`, borderRadius: 14, padding: 14, marginTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: t.primary }}>📋 SUMMARY</span><ConfidenceBadge data={data} /></div><div style={{ fontSize: 12, color: t.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{data.summaryFindings}</div></div>}
          </Card>
          {data.summaryFindings && <>
            <Card title="Stage 3 — Post-Feedback" icon="💬"><DTextarea value={data.userFeedback} onCommit={v => upd("userFeedback",v)} style={{ minHeight: 80 }} placeholder="Konteks tambahan setelah lihat summary..." /></Card>
            <Card title="Stage 4 — Generate" icon="⚡" action={<Btn onClick={generatePembahasan} disabled={loading}>{loading ? "⏳..." : "🤖 Generate"}</Btn>}><p style={{ fontSize: 11, color: t.sub, margin: 0 }}>Pembahasan + Kesimpulan</p></Card>
          </>}
          {data.pembahasan && <>
            <Card title="Pembahasan" icon="📝" action={<ConfidenceBadge data={data} />}><DTextarea value={data.pembahasan} onCommit={v => upd("pembahasan",v)} style={{ minHeight: 200 }} /></Card>
            <Card title="Kesimpulan" icon="✅"><DTextarea value={data.kesimpulan} onCommit={v => upd("kesimpulan",v)} /></Card>
            <Card title="Stage 5 — Revisi" icon="🔄"><DTextarea value={data.revisiInstruksi} onCommit={v => upd("revisiInstruksi",v)} style={{ minHeight: 70 }} placeholder='Instruksi revisi...' /><div style={{ display: "flex", gap: 8, marginTop: 10 }}><Btn onClick={revisiPembahasan} disabled={loading || !data.revisiInstruksi?.trim()}>🔄 Revisi Pembahasan</Btn><Btn variant="secondary" onClick={revisiKesimpulan} disabled={loading || !data.revisiInstruksi?.trim()}>🔄 Revisi Kesimpulan</Btn></div></Card>
          </>}
        </>}

        {/* STEP 5: EXPORT */}
        {step === 5 && <>
          <Card title="Abstrak" icon="📄" action={<Btn onClick={generateAbstrak} disabled={loading || !data.kesimpulan}>{loading ? "⏳" : "🤖 Generate"}</Btn>}><DTextarea value={data.abstrak} onCommit={v => upd("abstrak",v)} style={{ minHeight: 140 }} /></Card>
          <Card title="Referensi" icon="📚">{!data.selectedRefs.length ? <p style={{ color: t.sub, fontSize: 12 }}>Tambahkan di Step 2.</p> : data.selectedRefs.map((r, i) => <div key={i} style={{ fontSize: 11, color: t.text, marginBottom: 6, lineHeight: 1.6, paddingLeft: 16, textIndent: -16 }}>[{i+1}] {formatAPA(r)}</div>)}</Card>
          <Card title="Checklist" icon="✅" action={<ConfidenceBadge data={data} />}>{[["Profil", !!(data.nama && data.nim)], ["Detail", !!(data.mataKuliah && data.judulLaporan)], ["Pendahuluan", !!data.pendahuluan], ["Studi Pustaka", !!data.studiPustaka], ["Alat & Bahan", !!data.alatBahan], ["Prosedur", !!data.prosedur], ["Hasil", !!(data.hasilNaratif || (data.hasilTabels||[]).some(t => t.rows.some(r => r.some(c => c))))], ["Analisis", !data.enableAnalisis || (data.analisisBlocks||[]).some(b => b.hasil)], ["Pembahasan", !!data.pembahasan], ["Kesimpulan", !!data.kesimpulan], ["Abstrak", !!data.abstrak], ["Ref ≥ 3", data.selectedRefs.length >= 3]].map(([l, ok], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 12 }}><span style={{ color: ok ? t.green : t.red }}>{ok ? "✅" : "❌"}</span><span style={{ color: ok ? t.text : t.sub }}>{l}</span></div>)}</Card>
          <Card title="Export" icon="📥"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Btn variant="gold" onClick={exportTxt}>📥 Download .txt</Btn><Btn variant="ghost" onClick={() => { const d = JSON.stringify(data, (k,v) => k === "fotoResults" ? [] : v, 2); const b = new Blob([d], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "laprak-v3-data.json"; a.click(); }}>💾 .json</Btn></div><p style={{ fontSize: 10, color: t.dim, marginTop: 8 }}>💡 .docx export akan tersedia setelah integrasi penuh.</p></Card>
        </>}

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingBottom: 30 }}>
          <Btn variant="secondary" disabled={step === 1} onClick={() => changeStep(step-1)} style={{ opacity: step === 1 ? .3 : 1 }}>← Back</Btn>
          {step < 5 ? <Btn onClick={() => changeStep(step+1)}>Next →</Btn> : <Btn variant="gold" disabled>Selesai ✓</Btn>}
        </div>
      </div>
    </div>
  );
}