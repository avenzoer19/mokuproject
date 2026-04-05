"use client";
import { useState, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { callGemini } from "@/lib/gemini";

const ACCEPTED = ".pdf,.doc,.docx,.ppt,.pptx,.txt";
const ACCEPTED_TYPES = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain"];

export default function ModulesPage() {
  const t = useTheme();
  const fileRef = useRef(null);
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("overview");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Chat
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  const mod = modules.find(m => m.id === selectedId) || null;
  const modChats = chatMessages[selectedId] || [];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|ppt|pptx|txt)$/i)) {
        setUploadMsg(`Format tidak didukung: ${file.name}`);
        continue;
      }
      setUploadMsg(`Membaca ${file.name}...`);
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target.result.split(",")[1]);
          reader.onerror = () => reject(new Error("Gagal membaca file"));
          reader.readAsDataURL(file);
        });

        setUploadMsg(`Moku sedang membaca ${file.name}...`);
        const mimeType = file.type || "application/pdf";
        const resp = await callGemini(
          `Kamu adalah asisten akademik. Analisa dokumen ini dan ekstrak informasi ke dalam JSON. Output HANYA JSON, tanpa markdown.

Format JSON:
{"title":"judul dokumen atau mata kuliah","subject":"nama mata kuliah/subjek","summary":"ringkasan 2-3 kalimat tentang isi dokumen","concepts":["konsep1","konsep2","konsep3","konsep4","konsep5"],"content":"isi/konten lengkap dokumen dalam format teks untuk dijadikan konteks QnA"}`,
          `Nama file: ${file.name}. Ekstrak informasi dari dokumen ini.`,
          [{ type: mimeType, data: base64 }]
        );

        let meta;
        try {
          const clean = resp.replace(/```json|```/g, "").trim();
          meta = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
        } catch {
          meta = { title: file.name.replace(/\.[^.]+$/, ""), subject: "Umum", summary: resp.substring(0, 200), concepts: [], content: resp };
        }

        const newMod = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          title: meta.title || file.name.replace(/\.[^.]+$/, ""),
          subject: meta.subject || "Umum",
          summary: meta.summary || "",
          concepts: meta.concepts || [],
          content: meta.content || "",
          fileName: file.name,
        };
        setModules(prev => [...prev, newMod]);
        setSelectedId(newMod.id);
        setTab("overview");
      } catch (err) {
        setUploadMsg(`Error: ${err.message}`);
      }
    }

    setUploading(false);
    setUploadMsg("");
    e.target.value = "";
  };

  const sendChat = async (msg) => {
    if (!msg.trim() || !mod) return;
    const userMsg = { role: "user", text: msg };
    setChatMessages(p => ({ ...p, [selectedId]: [...(p[selectedId] || []), userMsg] }));
    setChatInput(""); setChatLoading(true);
    const sys = `Kamu adalah tutor AI bernama Moku. Kamu sedang membahas modul "${mod.title}" (${mod.subject}). Jawab dalam Bahasa Indonesia, ramah, dan helpful.\n\nRingkasan: ${mod.summary}\nKey concepts: ${mod.concepts.join(", ")}\n\nKonten modul:\n${mod.content?.substring(0, 3000)}`;
    const resp = await callGemini(sys, msg);
    setChatMessages(p => ({ ...p, [selectedId]: [...(p[selectedId] || []), { role: "moku", text: resp }] }));
    setChatLoading(false);
  };

  const generateQuiz = async () => {
    if (!mod) return;
    setQuizLoading(true); setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false);
    const sys = `Generate 5 soal pilihan ganda dari modul berikut. Output HANYA JSON array, tanpa markdown.\n\nFormat: [{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]\n\nModul: ${mod.title}\nKonten: ${mod.content?.substring(0, 2000) || mod.summary}`;
    const resp = await callGemini(sys, `Topics: ${mod.concepts.join(", ")}`);
    try {
      const parsed = JSON.parse(resp.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/)?.[0] || "[]");
      setQuiz(parsed.length ? parsed : null);
    } catch {
      setQuiz([{ question: "Error parsing quiz. Coba lagi.", options: ["A", "B", "C", "D"], correct: 0, explanation: "Parse error" }]);
    }
    setQuizLoading(false);
  };

  const removeModule = (id) => {
    setModules(prev => prev.filter(m => m.id !== id));
    if (selectedId === id) { setSelectedId(null); setTab("overview"); }
  };

  const quizScore = quiz ? Object.keys(quizAnswers).filter(k => quizAnswers[k] === quiz[k]?.correct).length : 0;

  return (
    <div style={{ padding: "20px 16px", display: "flex", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Sidebar */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>📚 Modules</div>

        {/* Upload button */}
        <input ref={fileRef} type="file" accept={ACCEPTED} multiple onChange={handleUpload} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          width: "100%", padding: "11px", borderRadius: 12, border: `2px dashed ${t.primary}50`,
          background: t.primaryBg, color: t.primary, fontSize: 12, fontWeight: 700, cursor: uploading ? "wait" : "pointer",
          marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {uploading ? <><span style={{ display: "inline-block", width: 12, height: 12, border: `2px solid ${t.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />{uploadMsg || "Memproses..."}</> : "📤 Upload Modul"}
        </button>
        <div style={{ fontSize: 10, color: t.dim, textAlign: "center", marginBottom: 12 }}>PDF · Word · PPT · TXT</div>

        {/* Module list */}
        {modules.length === 0 ? (
          <div style={{ padding: "20px 10px", textAlign: "center", border: `1.5px solid ${t.border}`, borderRadius: 12, color: t.dim, fontSize: 11, lineHeight: 1.7 }}>
            Belum ada modul.<br />Upload file untuk mulai belajar bersama Moku! 🧠
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {modules.map(m => (
              <div key={m.id} style={{ position: "relative" }}>
                <button onClick={() => { setSelectedId(m.id); setTab("overview"); }} style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${selectedId === m.id ? t.primary + "40" : t.border}`,
                  background: selectedId === m.id ? t.primaryBg : t.card, cursor: "pointer", textAlign: "left", transition: "all .15s",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: selectedId === m.id ? t.primary : t.text, paddingRight: 20 }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: t.dim, marginTop: 2 }}>{m.subject}</div>
                </button>
                <button onClick={() => removeModule(m.id)} title="Hapus" style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: t.dim, cursor: "pointer", fontSize: 12, padding: 2, lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!mod ? (
          <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeIn .4s ease" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📚</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8, color: t.text }}>Upload modul pertamamu</div>
            <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.8, maxWidth: 360, margin: "0 auto 28px" }}>
              Upload PDF, Word, PPT, atau TXT — Moku akan membaca, meringkas, dan siap menjawab pertanyaanmu tentang materi tersebut.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "0 auto" }}>
              {[["📤 Upload file", "Klik tombol Upload Modul di sidebar"], ["🧠 Moku membaca", "AI mengekstrak ringkasan & konsep kunci"], ["💬 Tanya & Quiz", "Tanya bebas atau generate soal latihan"]].map(([title, desc], i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 14, textAlign: "left" }}>
                  <div style={{ fontSize: 18 }}>{title.split(" ")[0]}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{title.split(" ").slice(1).join(" ")}</div>
                    <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.teal, textTransform: "uppercase", letterSpacing: 1 }}>{mod.subject}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{mod.title}</div>
              <div style={{ fontSize: 10, color: t.dim, marginTop: 2 }}>📎 {mod.fileName}</div>
            </div>

            <div style={{ display: "flex", gap: 4, background: t.bg2, borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {[{ id: "overview", label: "📋 Overview" }, { id: "chat", label: "💬 Tanya Moku" }, { id: "quiz", label: "📝 Quiz" }].map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: tab === tb.id ? t.card : "transparent", color: tab === tb.id ? t.primary : t.sub, fontSize: 12, fontWeight: tab === tb.id ? 800 : 600, cursor: "pointer", boxShadow: tab === tb.id ? t.shadow : "none" }}>{tb.label}</button>
              ))}
            </div>

            {tab === "overview" && (
              <div>
                <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 12, boxShadow: t.shadow }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📖 Ringkasan</div>
                  <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.7 }}>{mod.summary}</div>
                </div>
                {mod.concepts.length > 0 && (
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
                )}
              </div>
            )}

            {tab === "chat" && (
              <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: t.shadow }}>
                <div style={{ minHeight: 300, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
                  {modChats.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: t.dim, fontSize: 13 }}>Tanya Moku tentang modul ini! 💬</div>}
                  {modChats.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                      <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? t.primary : t.bg2, color: msg.role === "user" ? "#fff" : t.text, fontSize: 13, lineHeight: 1.6, border: msg.role === "user" ? "none" : `1px solid ${t.border}` }}>{msg.text}</div>
                    </div>
                  ))}
                  {chatLoading && <div style={{ display: "flex", gap: 4, padding: "10px 0" }}>{[0, .2, .4].map((d, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: t.primary, animation: `pulse 1s ease infinite ${d}s` }} />)}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {["Rangkum modul ini", "Buatkan soal", "Apa yang paling penting?", "Jelaskan key concepts"].map((q, i) => (
                    <button key={i} onClick={() => sendChat(q)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.sub, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{q}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Tanya Moku..." onKeyDown={e => e.key === "Enter" && sendChat(chatInput)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={() => sendChat(chatInput)} disabled={chatLoading} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send</button>
                </div>
              </div>
            )}

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
