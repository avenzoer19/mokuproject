"use client";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { callGemini } from "@/lib/gemini";

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
  const [tab, setTab] = useState("why");
  const [loading, setLoading] = useState(false);

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

  // ============ WHY THIS RESULT ============
  const askWhy = async (q) => {
    const question = q || whyQuestion;
    if (!question.trim()) return;
    setLoading(true);
    const sys = "Kamu adalah dosen ilmu alam yang menjelaskan reasoning ilmiah di balik hasil percobaan. Jawab dalam Bahasa Indonesia, jelas, dan mendalam. Gunakan analogi jika membantu.";
    const resp = await callGemini(sys, `${whyContext ? `Konteks percobaan: ${whyContext}\n\n` : ""}Pertanyaan: ${question}`);
    setWhyAnswer(resp); setLoading(false);
  };

  // ============ REASONING SIMULATOR ============
  const sendReason = async (msg) => {
    const m = msg || reasonInput;
    if (!m.trim()) return;
    setReasonChats(p => [...p, { role: "user", text: m }]);
    setReasonInput(""); setLoading(true);
    const history = reasonChats.map(c => `${c.role === "user" ? "Student" : "Tutor"}: ${c.text}`).join("\n");
    const sys = `Kamu adalah tutor sains bernama Moku. Kamu sedang berdiskusi tentang "${reasonTopic || "sains"}". Gayamu: Socratic method — pancing mahasiswa berpikir, jangan langsung kasih jawaban. Tanya balik, beri petunjuk, baru jelaskan. Bahasa Indonesia, ramah, encouraging.`;
    const resp = await callGemini(sys, `${history}\nStudent: ${m}`);
    setReasonChats(p => [...p, { role: "moku", text: resp }]);
    setLoading(false);
  };

  // ============ SKELETON ============
  const explainSection = async (section) => {
    setSelectedSection(section); setSkeletonAnswer(""); setLoading(true);
    const sys = "Kamu adalah dosen pembimbing laporan praktikum. Jelaskan setiap bagian laporan dengan detail: apa isinya, kenapa penting, kesalahan umum, tips menulis yang baik. Bahasa Indonesia.";
    const resp = await callGemini(sys, `Jelaskan bagian "${section.title}" dalam laporan praktikum:\n${section.desc}\n\nBerikan:\n1. Apa yang harus ada di bagian ini\n2. Kenapa bagian ini penting\n3. Kesalahan umum mahasiswa\n4. Tips menulis yang baik\n5. Contoh kalimat pembuka yang bagus`);
    setSkeletonAnswer(resp); setLoading(false);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🔍 Deep Dive</h1>
          <p style={{ fontSize: 11, color: t.dim, margin: 0 }}>Pahami, bukan cuma hafal</p>
        </div>
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
          <textarea value={whyContext} onChange={e => setWhyContext(e.target.value)} placeholder="Konteks percobaan (opsional): judul, data, hasil..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 60, marginBottom: 10 }} />
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
