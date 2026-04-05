"use client";
import { useState } from "react";
import { useTheme, useThemeToggle } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";

function Section({ title, icon, children, t }) {
  return (
    <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 18, padding: "20px 24px", marginBottom: 16, boxShadow: t.shadow }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, desc, children, t }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: t.dim, marginTop: 2 }}>{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTheme();
  const toggle = useThemeToggle();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  // Notification prefs (stored locally)
  const [notifDeadline, setNotifDeadline] = useState(() => {
    try { return localStorage.getItem("notif-deadline") !== "false"; } catch { return true; }
  });
  const [notifStudy, setNotifStudy] = useState(() => {
    try { return localStorage.getItem("notif-study") !== "false"; } catch { return true; }
  });
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [cleared, setCleared] = useState(false);

  const toggle_ = (key, val, setter) => {
    setter(val);
    try { localStorage.setItem(key, val.toString()); } catch { }
  };

  const clearAllData = () => {
    try {
      localStorage.removeItem("laprak-ai-v3");
      localStorage.removeItem("laprak-history");
      localStorage.removeItem("moku-theme");
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch { }
  };

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: value ? t.primary : t.bg3,
      position: "relative", transition: "background .2s",
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
      }} />
    </button>
  );

  return (
    <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>⚙️ Settings</h1>

      {/* Profile */}
      <Section title="Profil" icon="👤" t={t}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: `1px solid ${t.border}`, marginBottom: 4 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: "cover" }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${t.primary}, ${t.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff" }}>{initials}</div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{displayName}</div>
            <div style={{ fontSize: 12, color: t.dim, marginTop: 2 }}>{email}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 20, background: t.primaryBg, border: `1px solid ${t.primary}20` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: t.primary }}>🌱 Free Plan</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: t.dim, paddingTop: 8, lineHeight: 1.6 }}>
          Profil diambil dari akun Google-mu. Untuk mengubah nama atau foto, update di <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" style={{ color: t.primary }}>Google Account</a>.
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Tampilan" icon="🎨" t={t}>
        <Row label="Dark Mode" desc="Ganti antara tema terang dan gelap" t={t}>
          <Toggle value={t.mode === "dark"} onChange={toggle} />
        </Row>
        <div style={{ paddingTop: 12, display: "flex", gap: 10 }}>
          {[
            { label: "Cream Light", bg: "#fffcf7", border: "#ede5d5", accent: "#7c5ce7" },
            { label: "Dark", bg: "#0e0c15", border: "#2d2644", accent: "#a78bfa" },
          ].map((th, i) => (
            <div key={i} onClick={i === 0 && t.mode === "dark" ? toggle : i === 1 && t.mode === "light" ? toggle : undefined}
              style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${(i === 0 && t.mode === "light") || (i === 1 && t.mode === "dark") ? th.accent : th.border}`, background: th.bg, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ width: "100%", height: 8, borderRadius: 4, background: th.accent, marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#1b1622" : "#f0ecfa" }}>{th.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifikasi" icon="🔔" t={t}>
        <Row label="Pengingat Deadline" desc="Ingatkan jika ada deadline mendatang di Planner" t={t}>
          <Toggle value={notifDeadline} onChange={v => toggle_("notif-deadline", v, setNotifDeadline)} />
        </Row>
        <Row label="Pengingat Study Session" desc="Reminder untuk mulai study session hari ini" t={t}>
          <Toggle value={notifStudy} onChange={v => toggle_("notif-study", v, setNotifStudy)} />
        </Row>
        <div style={{ fontSize: 11, color: t.dim, paddingTop: 12 }}>Notifikasi dalam app. Push notification akan hadir di versi berikutnya.</div>
      </Section>

      {/* Data */}
      <Section title="Data & Privasi" icon="🔒" t={t}>
        <Row label="Data Laprak Tersimpan" desc="Draft laprak aktif & history tersimpan di browser kamu" t={t}>
          <button onClick={clearAllData} style={{ padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${cleared ? t.green : t.red}`, background: "transparent", color: cleared ? t.green : t.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {cleared ? "✓ Dihapus" : "Hapus Data"}
          </button>
        </Row>
        <div style={{ fontSize: 11, color: t.dim, paddingTop: 8, lineHeight: 1.6 }}>
          Semua data (laprak draft, history, preferensi) disimpan di browser lokalmu — tidak dikirim ke server Moku. Login via Google dikelola secara aman oleh Supabase Auth.
        </div>
      </Section>

      {/* Account */}
      <Section title="Akun" icon="🔑" t={t}>
        <Row label="Logout dari Moku" desc="Keluar dari sesi aktif" t={t}>
          <button onClick={() => setConfirmLogout(true)} style={{ padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${t.red}`, background: "transparent", color: t.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Logout</button>
        </Row>
        <Row label="Paket" desc="Upgrade untuk lebih banyak laprak & fitur" t={t}>
          <a href="/pricing" style={{ padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${t.primary}`, background: t.primaryBg, color: t.primary, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Lihat Paket ↗</a>
        </Row>
      </Section>

      {/* Version */}
      <div style={{ textAlign: "center", fontSize: 10, color: t.dim, paddingBottom: 30 }}>
        Moku v0.3 • Dibuat dengan ☕ dan semangat mahasiswa
      </div>

      {/* Confirm logout modal */}
      {confirmLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmLogout(false)}>
          <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 20, padding: "28px 28px 22px", width: 300, boxShadow: t.shadow, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Yakin mau keluar?</div>
            <div style={{ fontSize: 12, color: t.sub, marginBottom: 22 }}>Moku akan menunggumu kembali.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmLogout(false)} style={{ padding: "9px 20px", borderRadius: 11, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Batal</button>
              <button onClick={() => signOut()} style={{ padding: "9px 20px", borderRadius: 11, border: "none", background: t.red, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
