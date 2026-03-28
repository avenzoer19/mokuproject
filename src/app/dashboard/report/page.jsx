"use client";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";

const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const DEMO = {
  streak: 7, totalMinutes: 420, sessions: 14, modulesRead: 3, questionsAnswered: 47, lapraksGenerated: 2, mokuLevel: 5, mokuXP: 680,
  heatmap: [0,1,0,2,3,2,0,1,2,3,2,1,0,0,1,3,4,3,2,1,2,3,4,3,2,3,4,3],
  weeklyMinutes: [45, 60, 30, 90, 75, 0, 120],
  achievements: [
    { icon: "🔥", name: "7-Day Streak", desc: "Belajar 7 hari berturut-turut", unlocked: true },
    { icon: "📄", name: "First Laprak", desc: "Generate laporan pertama", unlocked: true },
    { icon: "📚", name: "Bookworm", desc: "Upload 3 modul", unlocked: true },
    { icon: "🧠", name: "Quiz Master", desc: "Jawab 50 soal (47/50)", unlocked: false },
    { icon: "🌙", name: "Night Owl", desc: "Study session setelah jam 10 malam", unlocked: true },
    { icon: "⚡", name: "Power Hour", desc: "Study session 60 menit penuh", unlocked: true },
    { icon: "🏆", name: "Centurion", desc: "Kumpulkan 1000 XP (680/1000)", unlocked: false },
    { icon: "🐉", name: "Moku Legendary", desc: "Reach Moku Level 20 (5/20)", unlocked: false },
  ],
  topSubjects: [
    { name: "Bioinstrumentasi", minutes: 150, color: "primary" },
    { name: "Biofisika", minutes: 120, color: "teal" },
    { name: "Fisika Medis", minutes: 90, color: "pink" },
    { name: "Fisiologi", minutes: 60, color: "amber" },
  ],
};

export default function ReportPage() {
  const t = useTheme();
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setTimeout(() => setAnimate(true), 100); }, []);

  const maxMin = Math.max(...DEMO.weeklyMinutes, 1);
  const totalWeek = DEMO.weeklyMinutes.reduce((a, b) => a + b, 0);
  const avgDay = Math.round(totalWeek / 7);
  const heatColors = ["transparent", t.primary + "25", t.primary + "50", t.primary + "80", t.primary];
  const mokuVerdict = DEMO.streak >= 7 ? "🔥 Minggu yang luar biasa! Streak 7 hari — Moku bangga! Tetap konsisten ya!" : "📖 Coba tingkatkan konsistensi minggu depan!";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 700, margin: "0 auto" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}`}</style>

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>📊 Weekly Report</h1>

      {/* Verdict */}
      <div style={{ background: `linear-gradient(135deg, ${t.primaryBg}, ${t.tealBg})`, border: `1.5px solid ${t.primary}20`, borderRadius: 20, padding: "18px 20px", marginBottom: 16, display: "flex", gap: 14, alignItems: "center", animation: animate ? "fadeUp .5s ease" : "none", opacity: animate ? 1 : 0 }}>
        <MokuCreature size={60} glow expression="excited" level={5} />
        <div><div style={{ fontSize: 13, fontWeight: 800, color: t.primary, marginBottom: 4 }}>Moku says:</div><div style={{ fontSize: 13, color: t.sub, lineHeight: 1.6 }}>{mokuVerdict}</div></div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[{ icon: "🔥", val: `${DEMO.streak}`, label: "Day Streak", color: "amber" }, { icon: "⏱️", val: `${Math.floor(DEMO.totalMinutes / 60)}h ${DEMO.totalMinutes % 60}m`, label: "Total Belajar", color: "primary" }, { icon: "⚡", val: DEMO.mokuXP, label: "XP Earned", color: "green" }, { icon: "🧘", val: DEMO.sessions, label: "Sessions", color: "teal" }, { icon: "📚", val: DEMO.modulesRead, label: "Modul", color: "pink" }, { icon: "📝", val: DEMO.questionsAnswered, label: "Soal", color: "amber" }].map((s, i) => (
          <div key={i} style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "14px 12px", textAlign: "center", boxShadow: t.shadow, animation: animate ? `fadeUp .4s ease ${.1 + i * .06}s both` : "none" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: t[s.color], animation: animate ? `countUp .5s ease ${.3 + i * .06}s both` : "none" }}>{s.val}</div>
            <div style={{ fontSize: 9, color: t.dim, fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: t.shadow, animation: animate ? "fadeUp .5s ease .3s both" : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 900 }}>📊 Study Minutes</div><div style={{ fontSize: 11, color: t.dim }}>Avg: {avgDay}m/day</div></div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {DEMO.weeklyMinutes.map((m, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: m > 0 ? t.primary : t.dim }}>{m}m</div>
              <div style={{ width: "100%", borderRadius: 6, background: m > 0 ? `linear-gradient(180deg, ${t.primary}, ${t.teal})` : t.bg3, height: animate ? `${Math.max((m / maxMin) * 80, 4)}px` : "4px", transition: `height .8s cubic-bezier(.34,1.56,.64,1) ${.4 + i * .08}s`, minHeight: 4 }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: i === new Date().getDay() ? t.primary : t.dim }}>{DAYS[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: t.shadow, animation: animate ? "fadeUp .5s ease .4s both" : "none" }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🗓️ Activity (28 hari)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: t.dim, padding: 2 }}>{d}</div>)}
          {DEMO.heatmap.map((v, i) => <div key={i} style={{ aspectRatio: "1", borderRadius: 4, background: heatColors[v] || "transparent", border: v === 0 ? `1px solid ${t.border}` : "none" }} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 8 }}>
          <span style={{ fontSize: 8, color: t.dim }}>Less</span>
          {heatColors.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i === 0 ? t.bg3 : c, border: i === 0 ? `1px solid ${t.border}` : "none" }} />)}
          <span style={{ fontSize: 8, color: t.dim }}>More</span>
        </div>
      </div>

      {/* Top subjects */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: t.shadow, animation: animate ? "fadeUp .5s ease .5s both" : "none" }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>📚 Top Subjects</div>
        {DEMO.topSubjects.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</span><span style={{ fontSize: 11, fontWeight: 700, color: t[s.color] }}>{s.minutes}m</span></div>
            <div style={{ height: 6, background: t.bg3, borderRadius: 3, overflow: "hidden" }}><div style={{ width: animate ? `${(s.minutes / DEMO.topSubjects[0].minutes) * 100}%` : "0%", height: "100%", background: t[s.color], borderRadius: 3, transition: `width .8s cubic-bezier(.34,1.56,.64,1) ${.6 + i * .1}s` }} /></div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: t.shadow, animation: animate ? "fadeUp .5s ease .6s both" : "none" }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>🏆 Achievements</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {DEMO.achievements.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 12, background: a.unlocked ? t.bg2 : t.bg3, border: `1px solid ${a.unlocked ? t.green + "25" : t.border}`, opacity: a.unlocked ? 1 : .5 }}>
              <div style={{ fontSize: 22, filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div><div style={{ fontSize: 11, fontWeight: 800, color: a.unlocked ? t.text : t.dim }}>{a.name}</div><div style={{ fontSize: 9, color: t.dim }}>{a.desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Moku growth */}
      <div style={{ background: `linear-gradient(135deg, ${t.primaryBg}, ${t.pinkBg})`, border: `1.5px solid ${t.primary}15`, borderRadius: 20, padding: 20, textAlign: "center", animation: animate ? "fadeUp .5s ease .7s both" : "none" }}>
        <MokuCreature size={80} glow expression="happy" level={DEMO.mokuLevel} />
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 8 }}>Moku Level {DEMO.mokuLevel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.primary }}>{DEMO.mokuXP} XP</span>
          <div style={{ width: 120, height: 6, background: t.bg3, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(DEMO.mokuXP % 200) / 2}%`, height: "100%", background: `linear-gradient(90deg, ${t.primary}, ${t.teal})`, borderRadius: 3 }} /></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.dim }}>→ Lv.{DEMO.mokuLevel + 1}</span>
        </div>
        <div style={{ fontSize: 11, color: t.sub, marginTop: 10 }}>Minggu ini Moku naik dari Lv.4 ke Lv.5! 💪</div>
      </div>
    </div>
  );
}