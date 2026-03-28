"use client";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const typeIcon = { deadline: "🔴", study: "📚", session: "🧘", quiz: "📝", other: "📌" };

const DEMO_TASKS = [
  { id: 1, title: "Laprak Biokompatibilitas", type: "deadline", date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], done: false, color: "red" },
  { id: 2, title: "Baca Modul Fisiologi Sel", type: "study", date: new Date().toISOString().split("T")[0], done: false, color: "teal" },
  { id: 3, title: "Study Session 30 menit", type: "session", date: new Date().toISOString().split("T")[0], done: true, color: "amber" },
  { id: 4, title: "Latihan Soal Bioinstrumentasi", type: "quiz", date: new Date(Date.now() + 86400000).toISOString().split("T")[0], done: false, color: "green" },
  { id: 5, title: "Praktikum Fisika Medis", type: "deadline", date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], done: false, color: "pink" },
  { id: 6, title: "Review Deep Dive EIT", type: "study", date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], done: false, color: "primary" },
];

export default function PlannerPage() {
  const t = useTheme();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", type: "study", date: todayStr });
  const [viewMode, setViewMode] = useState("week");

  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const calendarDays = []; for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null); for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const tasksForDate = (ds) => tasks.filter(tk => tk.date === ds);
  const selectedTasks = tasksForDate(selectedDate);
  const upcomingDeadlines = tasks.filter(tk => tk.type === "deadline" && !tk.done && tk.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const toggleDone = (id) => setTasks(p => p.map(tk => tk.id === id ? { ...tk, done: !tk.done } : tk));
  const removeTask = (id) => setTasks(p => p.filter(tk => tk.id !== id));
  const addTask = () => { if (!newTask.title.trim()) return; setTasks(p => [...p, { ...newTask, id: Date.now(), done: false, color: { deadline: "red", study: "teal", session: "amber", quiz: "green", other: "primary" }[newTask.type] }]); setNewTask({ title: "", type: "study", date: selectedDate }); setShowAdd(false); };
  const formatDate = (str) => { const d = new Date(str + "T00:00:00"); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const daysUntil = (ds) => { const diff = Math.ceil((new Date(ds + "T00:00:00") - new Date(todayStr + "T00:00:00")) / 86400000); return diff === 0 ? "Hari ini!" : diff === 1 ? "Besok" : `${diff} hari lagi`; };

  const incompleteTodayCount = tasksForDate(todayStr).filter(tk => !tk.done).length;
  const mokuMsg = incompleteTodayCount > 0 ? `Kamu punya ${incompleteTodayCount} task hari ini. Yuk mulai! 💪` : upcomingDeadlines.length > 0 ? `Deadline terdekat: "${upcomingDeadlines[0].title}" — ${daysUntil(upcomingDeadlines[0].date)} 🧘` : "Gak ada task pending. Santai atau tambahin rencana? ✨";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🗓️ Planner</h1><p style={{ fontSize: 11, color: t.dim, margin: 0 }}>{MONTHS[today.getMonth()]} {today.getFullYear()}</p></div>
        <div style={{ display: "flex", background: t.bg2, borderRadius: 8, overflow: "hidden", border: `1px solid ${t.border}` }}>
          {["week", "month"].map(m => (<button key={m} onClick={() => setViewMode(m)} style={{ padding: "5px 12px", border: "none", fontSize: 10, fontWeight: 700, background: viewMode === m ? t.primary : "transparent", color: viewMode === m ? "#fff" : t.sub, cursor: "pointer" }}>{m === "week" ? "Week" : "Month"}</button>))}
        </div>
      </div>

      {/* Moku msg */}
      <div style={{ background: t.primaryBg, border: `1.5px solid ${t.primary}20`, borderRadius: 16, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 22 }}>🧠</span>
        <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.6 }}>{mokuMsg}</div>
      </div>

      {/* Calendar */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: t.shadow }}>
        {viewMode === "week" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {weekDays.map((d, i) => {
              const ds = d.toISOString().split("T")[0]; const isToday = ds === todayStr; const isSel = ds === selectedDate; const dt = tasksForDate(ds); const hasDL = dt.some(tk => tk.type === "deadline" && !tk.done);
              return (<button key={i} onClick={() => setSelectedDate(ds)} style={{ padding: "10px 6px", borderRadius: 14, border: "none", background: isSel ? t.primary : isToday ? t.primaryBg : "transparent", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: isSel ? "rgba(255,255,255,.7)" : t.dim, marginBottom: 4 }}>{DAYS[i]}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: isSel ? "#fff" : isToday ? t.primary : t.text }}>{d.getDate()}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4, minHeight: 6 }}>{dt.slice(0, 3).map((tk, ti) => <div key={ti} style={{ width: 5, height: 5, borderRadius: "50%", background: t[tk.color] || t.primary, opacity: tk.done ? .3 : 1 }} />)}</div>
                {hasDL && <div style={{ fontSize: 7, color: isSel ? "rgba(255,255,255,.8)" : t.red, fontWeight: 800, marginTop: 2 }}>DUE</div>}
              </button>);
            })}
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>{DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: t.dim, padding: 4 }}>{d}</div>)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const isToday = ds === todayStr; const isSel = ds === selectedDate; const dt = tasksForDate(ds);
                return (<button key={i} onClick={() => setSelectedDate(ds)} style={{ padding: "8px 4px", borderRadius: 10, border: "none", background: isSel ? t.primary : isToday ? t.primaryBg : "transparent", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 900 : 600, color: isSel ? "#fff" : isToday ? t.primary : t.text }}>{day}</div>
                  {dt.length > 0 && <div style={{ display: "flex", justifyContent: "center", gap: 1, marginTop: 2 }}>{dt.slice(0, 3).map((tk, ti) => <div key={ti} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "rgba(255,255,255,.7)" : t[tk.color] || t.primary }} />)}</div>}
                </button>);
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected date tasks */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "16px 18px", marginBottom: 16, boxShadow: t.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div><div style={{ fontSize: 15, fontWeight: 900 }}>{formatDate(selectedDate)}</div>{selectedDate === todayStr && <div style={{ fontSize: 10, color: t.dim }}>Hari ini</div>}</div>
          <button onClick={() => { setNewTask(p => ({ ...p, date: selectedDate })); setShowAdd(true); }} style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Task</button>
        </div>
        {selectedTasks.length === 0 ? <div style={{ textAlign: "center", padding: "20px 0", color: t.dim, fontSize: 13 }}>Belum ada task.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {selectedTasks.map(tk => (
              <div key={tk.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: tk.done ? t.bg3 : t.bg2, border: `1px solid ${tk.done ? t.border : (t[tk.color] || t.primary) + "25"}`, opacity: tk.done ? .6 : 1 }}>
                <button onClick={() => toggleDone(tk.id)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${tk.done ? t.green : t[tk.color] || t.primary}`, background: tk.done ? t.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>{tk.done ? "✓" : ""}</button>
                <span style={{ fontSize: 14 }}>{typeIcon[tk.type] || "📌"}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: tk.done ? t.dim : t.text, textDecoration: tk.done ? "line-through" : "none" }}>{tk.title}</div>
                <button onClick={() => removeTask(tk.id)} style={{ background: "none", border: "none", color: t.dim, cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div style={{ background: t.redBg, border: `1.5px solid ${t.red}20`, borderRadius: 18, padding: "16px 18px", boxShadow: t.shadow }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: t.red, marginBottom: 10 }}>🔴 Upcoming Deadlines</div>
          {upcomingDeadlines.slice(0, 4).map(tk => (
            <div key={tk.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.red}10` }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{tk.title}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.red }}>{daysUntil(tk.date)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.card, borderRadius: 22, padding: 24, width: 360, boxShadow: t.shadow, animation: "fadeIn .2s ease" }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>📌 Tambah Task</div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 10, fontWeight: 700, color: t.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Judul</label><input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${t.inputB}`, background: t.input, color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 10, fontWeight: 700, color: t.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Tipe</label><select value={newTask.type} onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${t.inputB}`, background: t.input, color: t.text, fontSize: 12, outline: "none", fontFamily: "inherit" }}><option value="study">📚 Study</option><option value="deadline">🔴 Deadline</option><option value="session">🧘 Session</option><option value="quiz">📝 Quiz</option><option value="other">📌 Other</option></select></div>
              <div><label style={{ fontSize: 10, fontWeight: 700, color: t.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Tanggal</label><input type="date" value={newTask.date} onChange={e => setNewTask(p => ({ ...p, date: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${t.inputB}`, background: t.input, color: t.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: "9px 18px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Batal</button>
              <button onClick={addTask} style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}