"use client";
import { useState } from "react";
import { useTheme, useThemeToggle } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { path: "/dashboard", icon: "🏠", label: "Home" },
  { path: "/dashboard/laprak", icon: "📄", label: "Lab Report", badge: "V3.2" },
  { path: "/dashboard/modules", icon: "📚", label: "Modules" },
  { path: "/dashboard/deepdive", icon: "🔍", label: "Deep Dive" },
  { path: "/dashboard/study", icon: "🧘", label: "Study Session" },
  { path: "/dashboard/room", icon: "🏡", label: "Moku Room" },
  { path: "/dashboard/planner", icon: "🗓️", label: "Planner" },
  { path: "/dashboard/report", icon: "📊", label: "Weekly Report" },
];

const BOTTOM = [
  { path: "/pricing", icon: "💰", label: "Pricing" },
  { path: "/dashboard/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const t = useTheme();
  const toggle = useThemeToggle();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const w = collapsed ? 68 : 220;
  const [confirmLogout, setConfirmLogout] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

  const NavBtn = ({ item }) => {
    const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path + "/"));
    const c = t.primary;
    return (
      <button onClick={() => router.push(item.path)} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "10px" : "9px 12px",
        borderRadius: 11, border: "none", cursor: "pointer",
        background: isActive ? c + "15" : "transparent",
        transition: "all .15s", position: "relative",
        justifyContent: collapsed ? "center" : "flex-start", width: "100%",
      }}>
        {isActive && <div style={{
          position: "absolute", left: collapsed ? "50%" : -14,
          top: collapsed ? "auto" : "50%", bottom: collapsed ? -2 : "auto",
          transform: collapsed ? "translateX(-50%)" : "translateY(-50%)",
          width: collapsed ? 16 : 3, height: collapsed ? 3 : 18,
          borderRadius: 2, background: c,
        }} />}
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
        {!collapsed && <>
          <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? c : t.sub, whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{item.label}</span>
          {item.badge && <span style={{ fontSize: 9, fontWeight: 700, color: c, background: c + "15", padding: "2px 6px", borderRadius: 6 }}>{item.badge}</span>}
        </>}
      </button>
    );
  };

  return (
    <div style={{
      width: w, minHeight: "100vh", background: t.sidebarBg || t.bg2,
      borderRight: `1.5px solid ${t.border}`, padding: collapsed ? "16px 10px" : "16px 14px",
      display: "flex", flexDirection: "column", transition: "width .3s cubic-bezier(.4,0,.2,1)",
      position: "fixed", left: 0, top: 0, zIndex: 50, overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px", marginBottom: 8, cursor: "pointer" }} onClick={() => setCollapsed(c => !c)}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #7c5ce7, #00bfa6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", boxShadow: `0 2px 10px ${t.primary}25` }}>M</div>
        {!collapsed && <span style={{ fontSize: 17, fontWeight: 800, color: t.text, letterSpacing: -.5, whiteSpace: "nowrap" }}>moku</span>}
      </div>
      <div style={{ height: 1, background: t.border, margin: "8px 6px 12px" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(item => <NavBtn key={item.path} item={item} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
        <div style={{ height: 1, background: t.border, margin: "0 6px 8px" }} />
        {BOTTOM.map(item => <NavBtn key={item.path} item={item} />)}
        <button onClick={toggle} style={{
          display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px" : "9px 12px",
          borderRadius: 11, border: "none", cursor: "pointer", background: "transparent",
          justifyContent: collapsed ? "center" : "flex-start", width: "100%",
        }}>
          <span style={{ fontSize: 16 }}>{t.mode === "dark" ? "🌙" : "☀️"}</span>
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 600, color: t.sub }}>Theme</span>}
        </button>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "8px" : "10px 12px",
          marginTop: 4, borderRadius: 12, background: t.bg3, justifyContent: collapsed ? "center" : "flex-start",
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, objectFit: "cover" }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${t.amber}, ${t.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>{initials}</div>
          )}
          {!collapsed && <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: t.dim, whiteSpace: "nowrap" }}>Free Plan</div>
          </div>}
          {!collapsed && (
            <button onClick={(e) => { e.stopPropagation(); setConfirmLogout(true); }} style={{
              background: "none", border: "none", color: t.dim, cursor: "pointer", fontSize: 14, padding: 4,
            }} title="Sign out">↪</button>
          )}
        </div>
      </div>

      {/* Logout confirm modal */}
      {confirmLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmLogout(false)}>
          <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 20, padding: "28px 28px 22px", width: 300, boxShadow: t.shadow, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 6 }}>Yakin mau keluar?</div>
            <div style={{ fontSize: 12, color: t.sub, marginBottom: 22 }}>Moku akan menunggumu kembali.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setConfirmLogout(false)} style={{ padding: "9px 20px", borderRadius: 11, border: `1.5px solid ${t.border}`, background: t.bg2, color: t.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Batal</button>
              <button onClick={() => { signOut(); router.push("/"); }} style={{ padding: "9px 20px", borderRadius: 11, border: "none", background: t.red, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
