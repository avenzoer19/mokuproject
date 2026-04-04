"use client";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { callGemini } from "@/lib/gemini";

const DEMO_MODULES = [
  { id: "1", title: "Fisiologi Sel", subject: "Biofisika", summary: "Modul tentang struktur dan fungsi sel, membran sel, transport aktif dan pasif, serta signaling sel.", concepts: ["Membran Sel", "Difusi & Osmosis", "Transport Aktif", "Potensial Membran", "Signaling"] },
  { id: "2", title: "Instrumentasi Biomedis", subject: "Bioinstrumentasi", summary: "Pengantar instrumentasi untuk pengukuran sinyal biologis. Meliputi sensor, amplifier, ADC, dan filter.", concepts: ["Sensor Biomedis", "Op-Amp", "ADC/DAC", "Filter Analog", "Noise Reduction"] },
];

export default function ModulesPage() {
  const t = useTheme();
  const [modules] = useState(DEMO_MODULES);
  const [selectedModule, setSelectedModule] = useState(null);
  const [tab, setTab] = useState("overview");

  // Chat
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  const mod = selectedModule ? modules.find(m => m.id === selectedModule) : null;
  const modChats = chatMessages[selectedModule] || [];

  const sendChat = async (msg) => {
    if (!msg.trim()) return;
    const userMsg = { role: "user", text: msg };
    setChatMessages(p => ({ ...p, [selectedModule]: [...(p[selectedModule] || []), userMsg] }));
    setChatInput(""); setChatLoading(true);
    const sys = `Kamu adalah tutor AI bernama Moku. Kamu sedang membahas modul "${mod.title}" (${mod.subject}). Jawab dalam Bahasa Indonesia, ramah, dan helpful. Ringkasan modul: ${mod.summary}. Key concepts: ${mod.concepts.join(", ")}`;
    const resp = await callGemini(sys, msg);
    setChatMessages(p => ({ ...p, [selectedModule]: [...(p[selectedModule] || []), { role: "moku", text: resp }] }));
    setChatLoading(false);
  };

  const generateQuiz = async () => {
    setQuizLoading(true); setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false);
    const sys = `Generate 5 soal pilihan ganda tentang "${mod.title}". Format: JSON array of objects with fields: "question", "options" (array of 4 strings), "correct" (index 0-3), "explanation". ONLY output the JSON array, no markdown.`;
    const resp = await callGemini(sys, `Topics: ${mod.concepts.join(", ")}. Summary: ${mod.summary}`);
    try {
      const parsed = JSON.parse(resp.replace(/```json|```/g, "").trim());
      setQuiz(parsed);
    } catch {
      setQuiz([{ question: "Error parsing quiz. Coba lagi.", options: ["A", "B", "C", "D"], correct: 0, explanation: "Parse error" }]);
    }
    setQuizLoading(false);
  };

  const quizScore = quiz ? Object.keys(quizAnswers).filter(k => quizAnswers[k] === quiz[k]?.correct).length : 0;

  return (
    <div style={{ padding: "20px 16px", display: "flex", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Sidebar — Module list */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>📚 Modules</div>

        {/* Module list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {modules.map(m => (
            <button key={m.id} onClick={() => { setSelectedModule(m.id); setTab("overview"); }} style={{
              padding: "12px", borderRadius: 12, border: `1.5px solid ${selectedModule === m.id ? t.primary + "40" : t.border}`,
              background: selectedModule === m.id ? t.primaryBg : t.card, cursor: "pointer", textAlign: "left", transition: "all .15s",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: selectedModule === m.id ? t.primary : t.text }}>{m.title}</div>
              <div style={{ fontSize: 10, color: t.dim, marginTop: 2 }}>{m.subject}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, padding: "12px", borderRadius: 12, border: `1.5px dashed ${t.border}`, textAlign: "center", color: t.dim, fontSize: 11, cursor: "pointer" }}>📤 Upload PDF modul (coming soon)</div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!mod ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Pilih modul di sidebar</div>
            <div style={{ fontSize: 12, color: t.dim, marginTop: 4 }}>Atau upload PDF modul baru</div>
          </div>
        ) : (
          <div style={{ animation: "fadeIn .3s ease" }}>
            {/* Module header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.teal, textTransform: "uppercase", letterSpacing: 1 }}>{mod.subject}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{mod.title}</div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: t.bg2, borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {[{ id: "overview", label: "📋 Overview" }, { id: "chat", label: "💬 Tanya Moku" }, { id: "quiz", label: "📝 Quiz" }].map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: tab === tb.id ? t.card : "transparent", color: tab === tb.id ? t.primary : t.sub, fontSize: 12, fontWeight: tab === tb.id ? 800 : 600, cursor: "pointer", boxShadow: tab === tb.id ? t.shadow : "none" }}>{tb.label}</button>
              ))}
            </div>

            {/* Overview */}
            {tab === "overview" && (
              <div>
                <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 12, boxShadow: t.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📖 Ringkasan</div>
                  <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.7 }}>{mod.summary}</div>
                </div>
                <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: t.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🧬 Key Concepts</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {mod.concepts.map((c, i) => {
                      const colors = [t.primary, t.teal, t.pink, t.amber, t.green];
                      const bgs = [t.primaryBg, t.tealBg, t.pinkBg, t.amberBg, t.greenBg];
                      return <div key={i} style={{ padding: "6px 14px", borderRadius: 20, background: bgs[i % 5], border: `1px solid ${colors[i % 5]}20`, fontSize: 12, fontWeight: 700, color: colors[i % 5] }}>{c}</div>;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Chat */}
            {tab === "chat" && (
              <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: t.shadow }}>
                <div style={{ minHeight: 300, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
                  {modChats.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: t.dim, fontSize: 13 }}>Tanya Moku tentang modul ini! 💬</div>}
                  {modChats.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                      <div style={{
                        maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                        background: msg.role === "user" ? t.primary : t.bg2, color: msg.role === "user" ? "#fff" : t.text,
                        fontSize: 13, lineHeight: 1.6, border: msg.role === "user" ? "none" : `1px solid ${t.border}`,
                      }}>{msg.text}</div>
                    </div>
                  ))}
                  {chatLoading && <div style={{ display: "flex", gap: 4, padding: "10px 0" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: t.primary, animation: "pulse 1s ease infinite" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: t.primary, animation: "pulse 1s ease infinite .2s" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: t.primary, animation: "pulse 1s ease infinite .4s" }} /></div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {["Rangkum modul ini", "Buatkan soal", "Apa yang susah?", "Jelaskan key concepts"].map((q, i) => (
                    <button key={i} onClick={() => sendChat(q)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.sub, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{q}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tanya Moku..." onKeyDown={e => e.key === "Enter" && sendChat(chatInput)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={() => sendChat(chatInput)} disabled={chatLoading} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send</button>
                </div>
              </div>
            )}

            {/* Quiz */}
            {tab === "quiz" && (
              <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: t.shadow }}>
                {!quiz ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Generate Latihan Soal</div>
                    <div style={{ fontSize: 12, color: t.dim, marginBottom: 16 }}>5 soal pilihan ganda dari modul {mod.title}</div>
                    <button onClick={generateQuiz} disabled={quizLoading} style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: t.green, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{quizLoading ? "Generating..." : "Generate Quiz 🧠"}</button>
                  </div>
                ) : (
                  <div>
                    {quiz.map((q, qi) => (
                      <div key={qi} style={{ padding: "14px 0", borderBottom: qi < quiz.length - 1 ? `1px solid ${t.border}` : "none" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{qi + 1}. {q.question}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {q.options?.map((opt, oi) => {
                            const selected = quizAnswers[qi] === oi;
                            const isCorrect = q.correct === oi;
                            const showResult = quizSubmitted;
                            return (
                              <button key={oi} onClick={() => !quizSubmitted && setQuizAnswers(p => ({ ...p, [qi]: oi }))} style={{
                                padding: "8px 12px", borderRadius: 8, textAlign: "left", cursor: quizSubmitted ? "default" : "pointer",
                                border: `1.5px solid ${showResult ? (isCorrect ? t.green : selected ? t.red : t.border) : selected ? t.primary : t.border}`,
                                background: showResult ? (isCorrect ? t.greenBg : selected && !isCorrect ? t.redBg : "transparent") : selected ? t.primaryBg : "transparent",
                                fontSize: 12, color: t.text, fontWeight: selected ? 700 : 500,
                              }}>{String.fromCharCode(65 + oi)}. {opt}</button>
                            );
                          })}
                        </div>
                        {quizSubmitted && <div style={{ fontSize: 11, color: t.sub, marginTop: 6, lineHeight: 1.6 }}>💡 {q.explanation}</div>}
                      </div>
                    ))}
                    {!quizSubmitted ? (
                      <button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < quiz.length} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: Object.keys(quizAnswers).length >= quiz.length ? t.primary : t.bg3, color: Object.keys(quizAnswers).length >= quiz.length ? "#fff" : t.dim, fontSize: 14, fontWeight: 800, marginTop: 12, cursor: Object.keys(quizAnswers).length >= quiz.length ? "pointer" : "default" }}>Check Answers</button>
                    ) : (
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: quizScore >= 4 ? t.green : quizScore >= 3 ? t.amber : t.red }}>{quizScore}/{quiz.length}</div>
                        <div style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>{quizScore >= 4 ? "🎉 Excellent!" : quizScore >= 3 ? "👍 Good job!" : "📖 Perlu belajar lagi!"}</div>
                        <button onClick={() => { setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false); }} style={{ padding: "8px 20px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 12 }}>🔄 Generate Lagi</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
