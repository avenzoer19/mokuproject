"use client";
import { useTheme } from "@/components/ThemeProvider";
import MokuCreature from "@/components/MokuCreature";
export default function StudyPage() {
  const t = useTheme();
  return (
    <div style={{ padding: "28px", maxWidth: 960, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <MokuCreature size={100} glow expression="sleepy" level={3} />
        <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 16, marginBottom: 8 }}>Study Session</h2>
        <p style={{ fontSize: 14, color: t.sub, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
          Timer Pomodoro + Moku yang tumbuh selama kamu fokus. Cute animations, XP system.
        </p>
        <div style={{ marginTop: 20, padding: "10px 24px", borderRadius: 12, background: t.amberBg, border: `1.5px solid ${t.amber}20`, fontSize: 13, fontWeight: 700, color: t.amber, display: "inline-block" }}>
          🔧 Full feature — migrating
        </div>
      </div>
    </div>
  );
}
