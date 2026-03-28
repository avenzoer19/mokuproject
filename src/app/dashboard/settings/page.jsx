"use client";
import { useTheme } from "@/components/ThemeProvider";
export default function SettingsPage() {
  const t = useTheme();
  return (
    <div style={{ padding: "28px", maxWidth: 960, margin: "0 auto", animation: "fadeIn .3s ease" }}>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Settings</h2>
        <p style={{ fontSize: 14, color: t.sub, maxWidth: 400, margin: "0 auto", lineHeight: 1.7 }}>Profil, preferences, theme. Coming soon.</p>
      </div>
    </div>
  );
}
