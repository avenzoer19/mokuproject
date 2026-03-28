"use client";
import { useTheme } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";
export default function RoomPage() {
  const t = useTheme();
  return (
    <div style={{ padding: "28px", maxWidth: 960, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <MokuCreature size={100} glow expression="excited" level={6} />
        <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 16, marginBottom: 8 }}>Moku Room</h2>
        <p style={{ fontSize: 14, color: t.sub, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
          Dekorasi ruangan Moku-mu. Beli wallpaper, furniture, accessories pakai XP.
        </p>
        <div style={{ marginTop: 20, padding: "10px 24px", borderRadius: 12, background: t.pinkBg, border: `1.5px solid ${t.pink}20`, fontSize: 13, fontWeight: 700, color: t.pink, display: "inline-block" }}>
          🔧 Full feature — migrating
        </div>
      </div>
    </div>
  );
}
