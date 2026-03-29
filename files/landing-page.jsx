"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme, useThemeToggle } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import MokuCreature from "@/components/MokuCreature";
import { useRouter } from "next/navigation";

// ============ SCROLL FADE ============
const useFade = (threshold = 0.12) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
};
const Fade = ({ children, delay = 0, style = {} }) => {
  const [ref, vis] = useFade();
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(28px)", transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`, ...style }}>{children}</div>;
};

// ============ MOKU PLAYGROUND ============
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
      <p style={{ fontSize: 11, color: t.dim, textAlign: "center", maxWidth: 200, lineHeight: 1.5 }}>Klik untuk kasih makan! 3x feed = level up</p>
    </div>
  );
}

// ============ MARQUEE ============
function Marquee() {
  const t = useTheme();
  const items = [
    { icon: "📄", text: "Laporan Praktikum", color: t.primary, bg: t.primaryBg },
    { icon: "📚", text: "Upload Modul", color: t.teal, bg: t.tealBg },
    { icon: "🔍", text: "Deep Dive", color: t.pink, bg: t.pinkBg },
    { icon: "🧘", text: "Study Timer", color: t.amber, bg: t.amberBg },
    { icon: "🧠", text: "Exam Prep", color: t.primary, bg: t.primaryBg },
    { icon: "✨", text: "AI Tutor", color: t.teal, bg: t.tealBg },
    { icon: "📊", text: "Math Engine", color: t.pink, bg: t.pinkBg },
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", width: "100%", padding: "12px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.bg2 }}>
      <div style={{ display: "flex", gap: 12, width: "max-content", animation: "marquee 25s linear infinite" }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ padding: "8px 18px", borderRadius: 12, background: item.bg, border: `1.5px solid ${item.color}20`, fontSize: 13, fontWeight: 600, color: item.color, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>{item.icon} {item.text}</div>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN ============
export default function LandingPage() {
  const t = useTheme();
  const toggle = useThemeToggle();
  const { user, signIn } = useAuth();
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      signIn();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, transition: "background .3s", overflowX: "hidden" }}>
      {/* Nav */}
      <nav style={{ padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #7c5ce7, #00bfa6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>M</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: t.text }}>moku</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/about" style={{ color: t.sub, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>About</a>
          <a href="/pricing" style={{ color: t.sub, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Pricing</a>
          <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${t.border}`, background: t.bg2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.mode === "dark" ? "🌙" : "☀️"}</button>
          {user ? (
            <button onClick={() => router.push("/dashboard")} style={{ padding: "8px 20px", borderRadius: 10, background: t.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {user.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} style={{ width: 20, height: 20, borderRadius: 6 }} referrerPolicy="no-referrer" alt="" />}
              Dashboard
            </button>
          ) : (
            <button onClick={signIn} style={{ padding: "8px 20px", borderRadius: 10, background: t.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Masuk 🚀</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", padding: "60px 28px 40px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "5%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: t.primaryBg, opacity: .6, animation: "blob1 12s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 280, height: 280, borderRadius: "50%", background: t.tealBg, opacity: .5, animation: "blob2 15s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", alignItems: "center", gap: 50, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <div style={{ flex: "1 1 440px" }}>
            <Fade>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.greenBg, border: `1.5px solid ${t.green}30`, borderRadius: 50, padding: "5px 14px 5px 8px", marginBottom: 20 }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, background: t.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>✓</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.green }}>100% gratis untuk mulai</span>
              </div>
            </Fade>
            <Fade delay={.08}>
              <h1 style={{ fontSize: "clamp(36px, 5.5vw, 58px)", fontWeight: 900, lineHeight: 1.06, marginBottom: 16, letterSpacing: -2 }}>
                <span>Belajar itu seru,</span><br />
                <span>kalau ada </span>
                <span style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Moku</span>
                <span style={{ display: "inline-block", animation: "wiggle 2s ease-in-out infinite", fontSize: "clamp(30px, 4vw, 48px)" }}> ✨</span>
              </h1>
            </Fade>
            <Fade delay={.16}>
              <p style={{ fontSize: 17, color: t.sub, lineHeight: 1.75, marginBottom: 28, maxWidth: 440 }}>
                Moku adalah creature kecil yang <strong style={{ color: t.primary }}>tumbuh</strong> setiap kali kamu belajar. Upload modul, generate laporan, study session — Moku makan ilmu dan makin kuat.
              </p>
            </Fade>
            <Fade delay={.24}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={handleStart} style={{ padding: "14px 28px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "all .2s", boxShadow: `0 4px 20px ${t.primary}30`, display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                >{user ? "Ke Dashboard" : "Mulai Belajar"} 🚀</button>
                <a href="#playground" style={{ padding: "14px 24px", borderRadius: 14, background: t.bg2, border: `2px solid ${t.border}`, color: t.sub, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Coba dulu ↓</a>
              </div>
            </Fade>
          </div>
          <div style={{ flex: "0 1 380px", display: "flex", justifyContent: "center", animation: "float 5s ease-in-out infinite" }}>
            <MokuPlayground />
          </div>
        </div>
      </section>

      <Marquee />

      {/* Features */}
      <section id="playground" style={{ padding: "60px 28px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Fade><h2 style={{ fontSize: 32, fontWeight: 900, textAlign: "center", marginBottom: 40, letterSpacing: -1 }}>Satu tempat untuk <span style={{ color: t.primary }}>semuanya</span></h2></Fade>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Fade delay={.05} style={{ gridColumn: "1 / -1" }}>
              <div style={{ background: t.primaryBg, border: `2px solid ${t.primary}20`, borderRadius: 22, padding: "32px 28px", display: "flex", alignItems: "center", gap: 28, boxShadow: t.shadow, flexWrap: "wrap" }}>
                <div style={{ fontSize: 42 }}>📄</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Lab Report Generator</h3>
                  <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.7 }}>AI-powered laporan praktikum. Math 100% deterministik, referensi 3-tier jujur, langsung export .docx.</p>
                </div>
              </div>
            </Fade>
            {[
              { icon: "📚", title: "Module & QnA", desc: "Upload PDF modul → Moku baca → tanya jawab per modul.", color: t.teal, bg: t.tealBg },
              { icon: "🔍", title: "Deep Dive", desc: "\"Kenapa hasilnya segini?\" + AI reasoning.", color: t.pink, bg: t.pinkBg },
              { icon: "🧘", title: "Study Session", desc: "Timer + Moku yang tumbuh seiring kamu fokus.", color: t.amber, bg: t.amberBg },
              { icon: "🧠", title: "Exam Prep", desc: "Generate soal dari modul. Siap ujian.", color: t.green, bg: t.greenBg },
            ].map((f, i) => (
              <Fade key={i} delay={.1 + i * .06}>
                <div style={{ background: f.bg, border: `2px solid ${f.color}18`, borderRadius: 20, padding: "24px 22px", boxShadow: t.shadow, height: "100%" }}>
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 10, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 28px", textAlign: "center" }}>
        <Fade>
          <div style={{ maxWidth: 480, margin: "0 auto", background: t.card, border: `2px solid ${t.border}`, borderRadius: 28, padding: "44px 32px", boxShadow: t.shadow }}>
            <MokuCreature size={90} glow level={5} />
            <h3 style={{ fontSize: 24, fontWeight: 900, marginTop: 12, marginBottom: 8 }}>Moku kecilmu udah nungguin</h3>
            <p style={{ fontSize: 14, color: t.sub, marginBottom: 24, lineHeight: 1.6 }}>Gratis. Login pakai Google. Langsung belajar.</p>
            <button onClick={handleStart} style={{ padding: "13px 36px", borderRadius: 13, border: "none", background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${t.primary}30` }}>{user ? "Ke Dashboard ✨" : "Mulai Sekarang ✨"}</button>
          </div>
        </Fade>
      </section>

      <footer style={{ padding: "28px", borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
        <p style={{ fontSize: 10, color: t.dim }}>© 2026 Moku · Study must be fun for everyone 💜</p>
      </footer>
    </div>
  );
}
