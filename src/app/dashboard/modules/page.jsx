"use client";
import { useTheme } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";
export default function ModulesPage() {
  const t = useTheme();
  return (
    <div style={{ padding: "28px", maxWidth: 960, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <MokuCreature size={100} glow expression="excited" level={4} />
        <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 16, marginBottom: 8 }}>Module Upload & QnA</h2>
        <p style={{ fontSize: 14, color: t.sub, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
          Upload PDF modul kuliah → Moku baca & pahami → tanya jawab per modul → latihan soal interaktif.
        </p>
        <div style={{ marginTop: 20, padding: "10px 24px", borderRadius: 12, background: t.tealBg, border: `1.5px solid ${t.teal}20`, fontSize: 13, fontWeight: 700, color: t.teal, display: "inline-block" }}>
          🔧 Full feature — migrating
        </div>
      </div>
    </div>
  );
}
