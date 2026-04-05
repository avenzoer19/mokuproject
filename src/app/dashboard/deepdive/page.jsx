"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { callGemini } from "@/lib/gemini";

const HISTORY_KEY = "laprak-history";

const SKELETON = [
  { id: "abstrak", title: "Abstrak", icon: "📋", desc: "Ringkasan seluruh laporan: latar belakang, tujuan, metode, hasil, kesimpulan." },
  { id: "pendahuluan", title: "Pendahuluan", icon: "📖", desc: "Latar belakang topik, rumusan masalah, dan tujuan percobaan." },
  { id: "studi-pustaka", title: "Studi Pustaka", icon: "📚", desc: "Tinjauan teori dan penelitian sebelumnya yang relevan." },
  { id: "metode", title: "Metode", icon: "🔧", desc: "Alat, bahan, dan langkah-langkah percobaan." },
  { id: "hasil", title: "Hasil", icon: "📊", desc: "Data mentah, tabel, grafik tanpa interpretasi." },
  { id: "pembahasan", title: "Pembahasan", icon: "🔬", desc: "Analisis dan interpretasi hasil, perbandingan dengan teori." },
  { id: "kesimpulan", title: "Kesimpulan", icon: "✅", desc: "Jawaban atas tujuan percobaan, ringkas dan jelas." },
  { id: "daftar-pustaka", title: "Daftar Pustaka", icon: "📎", desc: "Referensi yang digunakan, format APA/IEEE." },
];

export default function DeepDivePage() {
  const t = useTheme();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("why");
  const [loading, setLoading] = useState(false);

  // Laprak history
  const [laprakHistory, setLaprakHistory] = useState([]);
  const [selectedLaprak, setSelectedLaprak] = useState(null);

  // Uploaded file context
  const [uploadedFile, setUploadedFile] = useState(null); // { name, type, data, text }
  const [uploading, setUploading] = useState(false);

  // Why This Result
  const [whyQuestion, setWhyQuestion] = useState("");
  const [whyContext, setWhyContext] = useState("");
  const [whyAnswer, setWhyAnswer] = useState("");

  // Reasoning
  const [reasonChats, setReasonChats] = useState([]);
  const [reasonInput, setReasonInput] = useState("");
  const [reasonTopic, setReasonTopic] = useState("");

  // Skeleton
  const [selectedSection, setSelectedSection] = useState(null);
  const [skeletonAnswer, setSkeletonAnswer] = useState("");

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setLaprakHistory(h);
    } catch { }
  }, []);

  // Build context string from selected laprak or uploaded file
  const buildContext = () => {
    if (selectedLaprak) {
      const d = selectedLaprak.data;
      return `Laporan: ${d.judulLaporan || selectedLaprak.title}\nMata Kuliah: ${d.mataKuliah}\nTopik: ${d.topikPraktikum}\nPendahuluan: ${d.pendahuluan?.substring(0, 500) || ""}\nHasil: ${d.hasilNaratif?.substring(0, 500) || ""}\nPembahasan: ${d.pembahasan?.substring(0, 500) || ""}`;
    }
    if (uploadedFile) return uploadedFile.text || `File: ${uploadedFile.name}`;
    return whyContext;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setSelectedLaprak(null);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsDataURL(file);
      });
      // Extract text content from file via AI
      const text = await callGemini(
        "Ekstrak dan rangkum isi dokumen ini dalam teks biasa. Pertahankan data penting, angka, dan temuan utama.",
        `Nama file: ${file.name}`,
        [{ type: file.type || "application/pdf", data: base64 }]
      );
      setUploadedFile({ name: file.name, type: file.type, data: base64, text });
    } catch (err) {
      setUploadedFile({ name: file.name, type: file.type, data: null, text: `Error: ${err.message}` });
    }
    setUploading(false);
    e.target.value = "";
  };

  const clearContext = () => { setSelectedLaprak(null); setUploadedFile(null); setWhyContext(""); };

  // ============ WHY THIS RESULT ============
  const askWhy = async (q) => {
    const question = q || whyQuestion;
    if (!question.trim()) return;
    setLoading(true);
    const ctx = buildContext();
    const sys = "Kamu adalah dosen ilmu alam yang menjelaskan reasoning ilmiah di balik hasil percobaan. Jawab dalam Bahasa Indonesia, jelas, dan mendalam. Gunakan analogi jika membantu.";
    const resp = await callGemini(sys, `${ctx ? `Konteks:\n${ctx}\n\n` : ""}Pertanyaan: ${question}`);
    setWhyAnswer(resp); setLoading(false);
  };

  // ============ REASONING SIMULATOR ============
  const sendReason = async (msg) => {
    const m = msg || reasonInput;
    if (!m.trim()) return;
    setReasonChats(p => [...p, { role: "user", text: m }]);
    setReasonInput(""); setLoading(true);
    const ctx = buildContext();
    const history = reasonChats.map(c => `${c.role === "user" ? "Student" : "Tutor"}: ${c.text}`).join("\n");
    const sys = `Kamu adalah tutor sains bernama Moku. Kamu sedang berdiskusi tentang "${reasonTopic || "sains"}". ${ctx ? `Konteks materi:\n${ctx}\n\n` : ""}Gayamu: Socratic method — pancing mahasiswa berpikir, jangan langsung kasih jawaban. Tanya balik, beri petunjuk, baru jelaskan. Bahasa Indonesia, ramah, encouraging.`;
    const resp = await callGemini(sys, `${history}\nStudent: ${m}`);
    setReasonChats(p => [...p, { role: "moku", text: resp }]);
    setLoading(false);
  };

  // ============ SKELETON ============
  const explainSection = async (section) => {
    setSelectedSection(section); setSkeletonAnswer(""); setLoading(true);
    const ctx = buildContext();
    const sys = "Kamu adalah dosen pembimbing laporan praktikum. Jelaskan setiap bagian laporan dengan detail: apa isinya, kenapa penting, kesalahan umum, tips menulis yang baik. Bahasa Indonesia.";
    const resp = await callGemini(sys, `${ctx ? `Konteks laporan:\n${ctx}\n\n` : ""}Jelaskan bagian "${section.title}" dalam laporan praktikum:\n${section.desc}\n\nBerikan:\n1. Apa yang harus ada di bagian ini\n2. Kenapa bagian ini penting\n3. Kesalahan umum mahasiswa\n4. Tips menulis yang baik\n5. Contoh kalimat pembuka yang bagus`);
    setSkeletonAnswer(resp); setLoading(false);
  };

  const activeContext = selectedLaprak ? `📄 ${selectedLaprak.title}` : uploadedFile ? `📎 ${uploadedFile.name}` : null;

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🔍 Deep Dive</h1>
          <p style={{ fontSize: 11, color: t.dim, margin: 0 }}>Pahami, bukan cuma hafal</p>
        </div>
      </div>

      {/* Context picker */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16, boxShadow: t.shadow }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.text, marginBottom: 10 }}>📂 Konteks (opsional)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Upload file */}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" onChange={handleFileUpload} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {uploading ? <><span style={{ display: "inline-block", width: 10, height: 10, border: `2px solid ${t.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />Membaca...</> : "📤 Upload File"}
          </button>

          {/* Laprak history picker */}
          {laprakHistory.length > 0 && (
            <select onChange={e => {
              if (!e.target.value) { setSelectedLaprak(null); return; }
              const found = laprakHistory.find(h => h.id === e.target.value);
              setSelectedLaprak(found || null);
              setUploadedFile(null);
            }} style={{ padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", outline: "none" }}
              value={selectedLaprak?.id || ""}>
              <option value="">📄 Pilih Laprak...</option>
              {laprakHistory.map(h => <option key={h.id} value={h.id}>{h.title} ({h.mataKuliah})</option>)}
            </select>
          )}

          {activeContext && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, background: t.primaryBg, border: `1px solid ${t.primary}30` }}>
              <span style={{ fontSize: 11, color: t.primary, fontWeight: 700 }}>{activeContext}</span>
              <button onClick={clearContext} style={{ background: "none", border: "none", color: t.primary, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</button>
            </div>
          )}
        </div>
        {!activeContext && (
          <div style={{ fontSize: 10, color: t.dim, marginTop: 8 }}>Upload file (PDF, Word, PPT, gambar) atau pilih laprak yang sudah disimpan — Moku akan gunakan sebagai konteks jawaban.</div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: t.bg2, borderRadius: 12, padding: 3, marginBottom: 20 }}>
        {[{ id: "why", label: "💡 Why This Result" }, { id: "reasoning", label: "🧠 Reasoning" }, { id: "skeleton", label: "📋 Skeleton" }].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: tab === tb.id ? t.card : "transparent", color: tab === tb.id ? t.primary : t.sub, fontSize: 12, fontWeight: tab === tb.id ? 800 : 600, cursor: "pointer", boxShadow: tab === tb.id ? t.shadow : "none" }}>{tb.label}</button>
        ))}
      </div>

      {/* WHY THIS RESULT */}
      {tab === "why" && (
        <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "20px", boxShadow: t.shadow, animation: "fadeIn .3s ease" }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>💡 Kenapa hasilnya begini?</div>
          {!activeContext && (
            <textarea value={whyContext} onChange={e => setWhyContext(e.target.value)} placeholder="Konteks percobaan (opsional): judul, data, hasil..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 60, marginBottom: 10, boxSizing: "border-box" }} />
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {["Kenapa nilainya tidak sesuai teori?", "Apa sumber error?", "Kenapa grafik berbentuk begini?", "Apa hubungan variabel X dan Y?"].map((q, i) => (
              <button key={i} onClick={() => { setWhyQuestion(q); askWhy(q); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{q}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={whyQuestion} onChange={e => setWhyQuestion(e.target.value)} placeholder="Atau tulis pertanyaan sendiri..." onKeyDown={e => e.key === "Enter" && askWhy()} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <button onClick={() => askWhy()} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{loading ? "..." : "Tanya"}</button>
          </div>
          {whyAnswer && <div style={{ marginTop: 16, padding: "16px", borderRadius: 12, background: t.bg2, border: `1px solid ${t.border}`, fontSize: 13, color: t.sub, lineHeight: 1.8, whiteSpace: "pre-wrap", animation: "fadeIn .3s ease" }}>{whyAnswer}</div>}
        </div>
      )}

      {/* REASONING SIMULATOR */}
      {tab === "reasoning" && (
        <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "20px", boxShadow: t.shadow, animation: "fadeIn .3s ease" }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>🧠 Reasoning Simulator</div>
          <div style={{ fontSize: 11, color: t.dim, marginBottom: 12 }}>Moku akan memancing kamu berpikir — Socratic method</div>
          <input value={reasonTopic} onChange={e => setReasonTopic(e.target.value)} placeholder="Topik diskusi (misal: Hukum Ohm, Difusi sel, dll)" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, outline: "none", fontFamily: "inherit", marginBottom: 12 }} />
          <div style={{ minHeight: 250, maxHeight: 350, overflowY: "auto", marginBottom: 12 }}>
            {reasonChats.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: t.dim, fontSize: 13 }}>Mulai diskusi dengan Moku! 🧠</div>}
            {reasonChats.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? t.primary : t.bg2, color: msg.role === "user" ? "#fff" : t.text, fontSize: 13, lineHeight: 1.6, border: msg.role === "user" ? "none" : `1px solid ${t.border}` }}>{msg.text}</div>
              </div>
            ))}
            {loading && <div style={{ fontSize: 12, color: t.dim, animation: "pulse 1s ease infinite" }}>Moku sedang berpikir...</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {["Jelaskan konsep dasarnya", "Simulasi pertanyaan dosen", "Beri aku analogi", "Quiz satu soal"].map((q, i) => (
              <button key={i} onClick={() => sendReason(q)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.sub, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{q}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={reasonInput} onChange={e => setReasonInput(e.target.value)} placeholder="Jawab atau tanya Moku..." onKeyDown={e => e.key === "Enter" && sendReason()} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <button onClick={() => sendReason()} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send</button>
          </div>
        </div>
      )}

      {/* INTERACTIVE SKELETON */}
      {tab === "skeleton" && (
        <div style={{ display: "flex", gap: 16, animation: "fadeIn .3s ease" }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>📋 Struktur Laprak</div>
            {SKELETON.map(sec => (
              <button key={sec.id} onClick={() => explainSection(sec)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, width: "100%",
                border: `1.5px solid ${selectedSection?.id === sec.id ? t.primary + "40" : t.border}`,
                background: selectedSection?.id === sec.id ? t.primaryBg : t.card,
                cursor: "pointer", textAlign: "left", marginBottom: 4, transition: "all .15s",
              }}>
                <span style={{ fontSize: 14 }}>{sec.icon}</span>
                <span style={{ fontSize: 11, fontWeight: selectedSection?.id === sec.id ? 800 : 600, color: selectedSection?.id === sec.id ? t.primary : t.text }}>{sec.title}</span>
              </button>
            ))}
          </div>
          <div style={{ flex: 1, background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "20px", boxShadow: t.shadow }}>
            {!selectedSection ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: t.dim }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Pilih bagian laporan di sidebar</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Moku akan jelaskan apa yang harus ditulis</div>
              </div>
            ) : loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 24, animation: "pulse 1s ease infinite" }}>🧠</div>
                <div style={{ fontSize: 13, color: t.dim, marginTop: 8 }}>Moku sedang menyiapkan penjelasan...</div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{selectedSection.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{selectedSection.title}</div>
                    <div style={{ fontSize: 11, color: t.dim }}>{selectedSection.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{skeletonAnswer}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
