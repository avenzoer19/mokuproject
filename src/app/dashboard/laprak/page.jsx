"use client";
import { useTheme } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";
export default function LaprakPage() {
  const t = useTheme();
  return (
    <div style={{ padding: "28px", maxWidth: 960, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <MokuCreature size={100} glow expression="happy" level={3} />
        <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 16, marginBottom: 8 }}>Lab Report Generator</h2>
        <p style={{ fontSize: 14, color: t.sub, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
          Laprak AI V3.2 — 5-step HITL pipeline dengan deterministic math engine.
          Generate laporan praktikum lengkap dari profil sampai export .docx.
        </p>
        <div style={{ marginTop: 20, padding: "10px 24px", borderRadius: 12, background: t.primaryBg, border: `1.5px solid ${t.primary}20`, fontSize: 13, fontWeight: 700, color: t.primary, display: "inline-block" }}>
          🔧 Full V3.2 integration — migrating to this page
        </div>
        <p style={{ fontSize: 11, color: t.dim, marginTop: 16, maxWidth: 360, margin: "16px auto 0" }}>
          Semua fitur V3.2 (Gemini API, CrossRef, PDF upload, 3-tier refs, deterministic math, validation, confidence score, HITL pipeline, .docx export) akan tersedia di sini.
        </p>
      </div>
    </div>
  );
}
