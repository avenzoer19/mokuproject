"use client";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import MokuCreature from "@/components/MokuCreature";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const t = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "Kamu";

  const [msg, setMsg] = useState(`Hai ${displayName}! Mau belajar apa hari ini? 📖`);
  const msgs = [
    `Hai ${displayName}! Mau belajar apa hari ini? 📖`,
    "Aku lapar nih... feed aku ilmu dong! 🍕",
    "Kamu belum study session hari ini lho~ 🧘",
    "Ada modul baru? Upload yuk! 📚",
    "Jangan lupa istirahat juga ya~ ☕",
    `${displayName}, kamu udah keren banget! 💜`,
  ];
  useEffect(() => { const i = setInterval(() => setMsg(msgs[Math.floor(Math.random() * msgs.length)]), 8000); return () => clearInterval(i); }, [displayName]);

  const QuickAction = ({ icon, label, desc, color, path }) => (
    <button onClick={() => router.push(path)} style={{ background: t.card, border: `2px solid ${t.border}`, borderRadius: 16, padding: "18px 16px", cursor: "pointer", transition: "all .2s", textAlign: "left", display: "flex", gap: 14, alignItems: "center", boxShadow: t.shadow, width: "100%" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = (t[color] || t.primary) + "50"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = ""; }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: (t[color + "Bg"] || t.primaryBg), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: `1.5px solid ${(t[color] || t.primary)}20` }}>{icon}</div>
      <div><div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 2 }}>{label}</div><div style={{ fontSize: 11, color: t.dim }}>{desc}</div></div>
      <div style={{ marginLeft: "auto", fontSize: 16, color: t.dim }}>→</div>
    </button>
  );

  return (
    <div style={{ padding: "28px", maxWidth: 960, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, letterSpacing: -.5 }}>Selamat datang, {displayName}! 👋</h1>
        <p style={{ fontSize: 14, color: t.sub }}>Moku-mu udah siap belajar bareng hari ini.</p>
      </div>

      {/* Moku widget */}
      <div style={{ background: t.card, border: `2px solid ${t.border}`, borderRadius: 20, padding: "20px", display: "flex", alignItems: "center", gap: 16, boxShadow: t.shadow, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: t.primaryBg, opacity: .4, pointerEvents: "none" }} />
        <MokuCreature size={80} glow level={3} />
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <div style={{ background: t.bg2, border: `1.5px solid ${t.border}`, borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontSize: 13, color: t.sub, lineHeight: 1.6 }}>{msg}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.amber, background: t.amberBg, padding: "3px 8px", borderRadius: 8, border: `1px solid ${t.amber}20` }}>Lv.3</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 5, background: t.bg3, borderRadius: 3, overflow: "hidden" }}><div style={{ width: "45%", height: "100%", background: `linear-gradient(90deg, ${t.primary}, ${t.teal})`, borderRadius: 3 }} /></div>
              <span style={{ fontSize: 9, color: t.dim }}>45%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[{ icon: "🔥", val: "0", label: "Streak", color: "amber" }, { icon: "📄", val: "0", label: "Laporan", color: "primary" }, { icon: "📚", val: "0", label: "Modul", color: "teal" }, { icon: "⏱️", val: "0h", label: "Study", color: "pink" }].map((s, i) => (
          <div key={i} style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: "14px", textAlign: "center", boxShadow: t.shadow }}>
            <div style={{ fontSize: 14 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t[s.color] }}>{s.val}</div>
            <div style={{ fontSize: 9, color: t.dim, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Mau ngapain? ✨</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <QuickAction icon="📄" label="Buat Laporan" desc="Generate laprak dengan AI" color="primary" path="/dashboard/laprak" />
        <QuickAction icon="📚" label="Upload Modul" desc="Moku baca dan jelaskan" color="teal" path="/dashboard/modules" />
        <QuickAction icon="🧘" label="Study Session" desc="Timer + feed Moku" color="amber" path="/dashboard/study" />
        <QuickAction icon="🧠" label="Latihan Soal" desc="Simulasi ujian dari modul" color="green" path="/dashboard/modules" />
      </div>
    </div>
  );
}
