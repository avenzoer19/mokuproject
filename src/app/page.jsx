"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme, useThemeToggle } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";
import { useRouter } from "next/navigation";

function MokuPlayground() {
  const t = useTheme();
  const [exp, setExp] = useState("happy");
  const [level, setLevel] = useState(1);
  const [fed, setFed] = useState(0);
  const [showMsg, setShowMsg] = useState("");
  const feed = () => {
    setFed(p => p + 1); setExp("excited");
    const msgs = ["Nyam! 📖","Knowledge +1!","Moku suka!","Otak makin encer~","Yeay ilmu baru!"];
    setShowMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setExp("happy"), 1200);
    setTimeout(() => setShowMsg(""), 1800);
    if ((fed + 1) % 3 === 0 && level < 20) setLevel(l => l + 1);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative" }}>
      <div style={{ background: t.card, border: `2px solid ${t.border}`, borderRadius: 16, padding: "8px 16px", fontSize: 14, fontWeight: 700, color: t.primary, opacity: showMsg ? 1 : 0, transform: showMsg ? "translateY(0) scale(1)" : "translateY(8px) scale(.9)", transition: "all .3s cubic-bezier(.34,1.56,.64,1)", position: "absolute", top: -16, boxShadow: t.shadow, whiteSpace: "nowrap", pointerEvents: "none" }}>{showMsg || "..."}<div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: t.card, borderRight: `2px solid ${t.border}`, borderBottom: `2px solid ${t.border}` }} /></div>
      <MokuCreature size={220} glow expression={exp} level={level} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.amber, background: t.amberBg, padding: "4px 10px", borderRadius: 20, border: `1px solid ${t.amber}25` }}>Lv.{level}</div>
        <div style={{ width: 80, height: 6, background: t.bg3, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${((fed % 3) / 3) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${t.primary}, ${t.teal})`, borderRadius: 3, transition: "width .4s cubic-bezier(.34,1.56,.64,1)" }} /></div>
        <span style={{ fontSize: 10, color: t.dim }}>{fed % 3}/3</span>
      </div>
      <button onClick={feed} style={{ padding: "10px 24px", borderRadius: 12, border: `2px solid ${t.primary}30`, background: t.primaryBg, color: t.primary, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = t.primary; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = t.primaryBg; e.currentTarget.style.color = t.primary; }}
      >📚 Feed Moku</button>
      <p style={{ fontSize: 11, color: t.dim, textAlign: "center", maxWidth: 200, lineHeight: 1.5 }}>Klik untuk kasih makan Moku! Setiap 3x feed = level up</p>
    </div>
  );
}

export default function LandingPage() {
  const t = useTheme();
  const toggle = useThemeToggle();
  const router = useRouter();

  const features = [
    { icon: "📄", title: "Lab Report Generator", desc: "AI-powered laporan praktikum. Math deterministik, referensi 3-tier jujur, langsung export .docx.", color: t.primary, bg: t.primaryBg },
    { icon: "📚", title: "Module & QnA", desc: "Upload PDF modul → Moku baca → tanya jawab per modul.", color: t.teal, bg: t.tealBg },
    { icon: "🔍", title: "Deep Dive", desc: "\"Kenapa hasilnya segini?\" + AI reasoning + interactive skeleton.", color: t.pink, bg: t.pinkBg },
    { icon: "🧘", title: "Study Session", desc: "Timer + Moku yang tumbuh seiring kamu fokus belajar.", color: t.amber, bg: t.amberBg },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, transition: "background .3s" }}>
      {/* Nav */}
      <nav style={{ padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #7c5ce7, #00bfa6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>M</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: t.text }}>moku</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/about" style={{ color: t.sub, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>About</a>
          <a href="/pricing" style={{ color: t.sub, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Pricing</a>
          <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${t.border}`, background: t.bg2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.mode === "dark" ? "🌙" : "☀️"}</button>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "8px 20px", borderRadius: 10, background: t.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Masuk</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 28px", maxWidth: 1060, margin: "0 auto", display: "flex", alignItems: "center", gap: 50, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.greenBg, border: `1.5px solid ${t.green}30`, borderRadius: 50, padding: "5px 14px 5px 8px", marginBottom: 20 }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: t.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✓</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.green }}>100% gratis untuk mulai</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5.5vw, 58px)", fontWeight: 900, lineHeight: 1.06, marginBottom: 16, letterSpacing: -2 }}>
            <span>Belajar itu seru,</span><br />
            <span>kalau ada </span>
            <span style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Moku</span>
            <span style={{ display: "inline-block", animation: "wiggle 2s ease-in-out infinite" }}> ✨</span>
          </h1>
          <p style={{ fontSize: 17, color: t.sub, lineHeight: 1.75, marginBottom: 28, maxWidth: 440 }}>
            Moku adalah creature kecil yang <strong style={{ color: t.primary }}>tumbuh</strong> setiap kali kamu belajar. Upload modul, generate laporan, study session — Moku makan ilmu dan makin kuat.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/dashboard")} style={{ padding: "14px 28px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${t.primary}30` }}>Mulai Belajar 🚀</button>
            <a href="#features" style={{ padding: "14px 24px", borderRadius: 14, background: t.bg2, border: `2px solid ${t.border}`, color: t.sub, fontSize: 15, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>Lihat fitur ↓</a>
          </div>
        </div>
        <div style={{ flex: "0 1 380px", display: "flex", justifyContent: "center", animation: "float 5s ease-in-out infinite" }}>
          <MokuPlayground />
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "60px 28px 80px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: "center", marginBottom: 32 }}>Satu tempat untuk <span style={{ color: t.primary }}>semuanya</span></h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: f.bg, border: `2px solid ${f.color}18`, borderRadius: 20, padding: "24px 22px", cursor: "default", transition: "all .25s", boxShadow: t.shadow }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + "45"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = f.color + "18"; e.currentTarget.style.transform = ""; }}>
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 10, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 28px", textAlign: "center" }}>
        <MokuCreature size={90} glow level={5} />
        <h3 style={{ fontSize: 24, fontWeight: 900, marginTop: 12, marginBottom: 8 }}>Moku kecilmu udah nungguin</h3>
        <p style={{ fontSize: 14, color: t.sub, marginBottom: 24 }}>Gratis. 2 detik sign up. Langsung belajar.</p>
        <button onClick={() => router.push("/dashboard")} style={{ padding: "13px 36px", borderRadius: 13, border: "none", background: `linear-gradient(135deg, #7c5ce7, #00bfa6)`, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${t.primary}30` }}>Mulai Sekarang ✨</button>
      </section>

      {/* Footer */}
      <footer style={{ padding: "28px", borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: t.dim }}>© 2026 Moku · Study must be fun for everyone 💜</p>
      </footer>
    </div>
  );
}
