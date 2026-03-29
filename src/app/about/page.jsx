"use client";
import { useTheme, useThemeToggle } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";
import { useRef, useState, useEffect } from "react";

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
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`, ...style }}>{children}</div>;
};

export default function AboutPage() {
  const t = useTheme();
  const toggle = useThemeToggle();

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, transition: "background .3s" }}>
      <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c5ce7,#00bfa6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>M</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>moku</span>
        </a>
        <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${t.border}`, background: t.bg2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.mode === "dark" ? "🌙" : "☀️"}</button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <Fade>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <MokuCreature size={120} glow expression="happy" level={5} />
            <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, marginTop: 16, lineHeight: 1.15, letterSpacing: -1 }}>Kenapa <span style={{ color: t.primary }}>Moku</span> ada?</h1>
            <p style={{ fontSize: 15, color: t.sub, marginTop: 10, lineHeight: 1.8 }}>Ini cerita di balik creature kecil yang mau nemenin kamu belajar.</p>
          </div>
        </Fade>

        <Fade delay={.1}>
          <div style={{ marginBottom: 50 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Keresahannya</h2>
            <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.85, marginBottom: 14 }}>Jujur — bikin laporan praktikum itu menyakitkan. Bukan karena ilmunya susah, tapi karena prosesnya bikin capek. Copy-paste format dari senior, nulis pembahasan yang gak kamu pahami, cari referensi asal-asalan biar keliatan "ilmiah."</p>
            <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.85 }}>Dan yang paling bikin sedih: setelah semua itu, kamu gak nambah ilmu. Cuma nambah capek. Belajar jadi terasa kayak beban. Padahal seharusnya gak gitu.</p>
          </div>
        </Fade>

        <Fade delay={.05}><div style={{ height: 1, background: t.border, margin: "0 40px 50px" }} /></Fade>

        <Fade delay={.1}>
          <div style={{ marginBottom: 50 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Moku itu apa?</h2>
            <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.85, marginBottom: 14 }}>Moku bukan cuma AI tool. Moku adalah <strong style={{ color: t.primary }}>teman belajar</strong> — creature kecil yang hidup di study space kamu. Dia makan ilmu, tumbuh seiring kamu belajar, dan jujur tentang apa yang dia tau dan gak tau.</p>
            <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.85 }}>Dan yang paling penting — Moku di sini bukan buat gantiin otakmu. Dia di sini buat nemenin kamu pakai otakmu.</p>
          </div>
        </Fade>

        <Fade delay={.1}>
          <div style={{ background: t.card, border: `2px solid ${t.border}`, borderRadius: 22, padding: "28px 24px", marginBottom: 50, boxShadow: t.shadow }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900 }}>Cara memaksimalkan Moku</h2>
              <p style={{ fontSize: 12, color: t.dim, marginTop: 4 }}>Biar kamu beneran belajar, bukan cuma generate</p>
            </div>
            {[
              { icon: "📖", title: "Baca dulu, generate kemudian", desc: "Upload modul → baca summary → tanya Moku yang gak paham → baru generate laprak.", color: t.primary },
              { icon: "🔍", title: "Pakai Deep Dive, bukan skip", desc: "Setelah laprak jadi, buka Deep Dive. Tanya \"kenapa hasilnya segini?\" — ini yang bikin kamu paham.", color: t.teal },
              { icon: "📝", title: "Quiz diri sendiri", desc: "Generate quiz dari modul. Kalau skornya jelek, itu artinya kamu perlu baca lagi — dan itu OK.", color: t.pink },
              { icon: "🧘", title: "Study session, bukan cramming", desc: "25 menit fokus lebih efektif dari 3 jam setengah sadar. Moku tumbuh saat kamu konsisten.", color: t.amber },
              { icon: "🔄", title: "Revisi, jangan terima mentah-mentah", desc: "AI bisa salah. Baca, edit, tambahin perspektif kamu. Laporan terbaik = AI + otak kamu.", color: t.green },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 0", borderBottom: i < 4 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: tip.color + "14", border: `1.5px solid ${tip.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{tip.icon}</div>
                <div><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{tip.title}</div><div style={{ fontSize: 13, color: t.sub, lineHeight: 1.75 }}>{tip.desc}</div></div>
              </div>
            ))}
          </div>
        </Fade>

        <Fade delay={.1}>
          <div style={{ marginBottom: 50 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Tempat buat slow down</h2>
            <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.85, marginBottom: 14 }}>Kuliah itu intense. Kamu gak harus selalu dalam mode "produktif." Moku Room ada supaya kamu punya <strong style={{ color: t.primary }}>safe space digital</strong> — tempat yang cute, yang calming, yang bikin kamu senyum walau lagi stressed.</p>
            <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.85 }}>Gak ada pressure di sini. Gak ada leaderboard. Cuma kamu, Moku, dan proses belajar yang jalan di pace kamu sendiri.</p>
          </div>
        </Fade>

        <Fade delay={.05}><div style={{ height: 1, background: t.border, margin: "0 40px 50px" }} /></Fade>

        <Fade delay={.15}>
          <div style={{ textAlign: "center", marginBottom: 50, background: `linear-gradient(135deg, ${t.primaryBg}, ${t.tealBg}, ${t.pinkBg})`, border: `2px solid ${t.primary}15`, borderRadius: 28, padding: "48px 32px", position: "relative", overflow: "hidden" }}>
            <MokuCreature size={100} glow expression="excited" level={10} />
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, marginTop: 20, marginBottom: 16, lineHeight: 1.2, background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              &ldquo;Study must be fun<br />for everyone.&rdquo;
            </h2>
            <p style={{ fontSize: 15, color: t.sub, lineHeight: 1.85, maxWidth: 440, margin: "0 auto" }}>Ini bukan slogan. Ini keyakinan yang nge-drive setiap pixel, setiap fitur, setiap keputusan di Moku.</p>
          </div>
        </Fade>

        <Fade delay={.1}>
          <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 20, padding: "24px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, ${t.amber}, ${t.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>R</div>
              <div><div style={{ fontSize: 14, fontWeight: 800 }}>Rifqi</div><div style={{ fontSize: 11, color: t.dim }}>Creator of Moku</div></div>
            </div>
            <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.85, fontStyle: "italic" }}>
              &ldquo;Aku bikin Moku karena aku tau rasanya overwhelmed — saat semua tugas datang barengan dan kamu gak tau harus mulai dari mana. Laprak itu rutin, dan justru karena rutin, dia jadi exhausting. Bukan malas yang bikin kita nunda — tapi burn out. Dan begitu satu ketinggalan, semuanya ikut ketinggalan. Ujung-ujungnya cuma &lsquo;yang penting selesai.&rsquo; Aku gak mau kayak gitu terus. Aku mau sesuatu yang nemenin, bukan cuma nyelesaiin. Sesuatu yang jujur, yang gak pura-pura tau, dan yang bikin proses belajar terasa... warm. Moku adalah jawaban itu. Dan sekarang, aku share ke kamu.&rdquo;
            </p>
          </div>
        </Fade>

        <Fade delay={.15}>
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <MokuCreature size={80} glow level={5} />
            <p style={{ fontSize: 14, color: t.sub, marginTop: 12, marginBottom: 20 }}>Moku kecilmu udah nungguin. Gak perlu buru-buru.</p>
            <a href="/dashboard" style={{ padding: "14px 32px", borderRadius: 14, background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, color: "#fff", fontSize: 16, fontWeight: 800, textDecoration: "none", display: "inline-block", boxShadow: `0 4px 20px ${t.primary}30` }}>Mulai Belajar ✨</a>
            <p style={{ fontSize: 11, color: t.dim, marginTop: 16 }}>Built with 💜 by a student, for students everywhere.</p>
          </div>
        </Fade>
      </div>
    </div>
  );
}
