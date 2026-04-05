"use client";
import { useState } from "react";
import { useTheme, useThemeToggle } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useIsMobile } from "@/lib/useIsMobile";

const NAV = [
  { path: "/dashboard", icon: "🏠", label: "Home" },
  { path: "/dashboard/laprak", icon: "📄", label: "Lab Report", badge: "V3.2" },
  { path: "/dashboard/modules", icon: "📚", label: "Modules" },
  { path: "/dashboard/deepdive", icon: "🔍", label: "Deep Dive" },
  { path: "/dashboard/study", icon: "🧘", label: "Study" },
  { path: "/dashboard/room", icon: "🏡", label: "Room" },
  { path: "/dashboard/planner", icon: "🗓️", label: "Planner" },
  { path: "/dashboard/report", icon: "📊", label: "Report" },
];

const BOTTOM = [
  { path: "/about", icon: "💡", label: "About" },
  { path: "/pricing", icon: "💰", label: "Pricing" },
  { path: "/dashboard/settings", icon: "⚙️", label: "Settings" },
];

// Bottom tab bar items (mobile — pick the 5 most important)
const MOBILE_TABS = [
  { path: "/dashboard", icon: "🏠", label: "Home" },
  { path: "/dashboard/study", icon: "🧘", label: "Study" },
  { path: "/dashboard/laprak", icon: "📄", label: "Laprak" },
  { path: "/dashboard/room", icon: "🏡", label: "Room" },
  { path: "/dashboard/settings", icon: "⚙️", label: "More" },
];

// ── Desktop sidebar ──
function DesktopSidebar({ collapsed, setCollapsed }) {
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
    <>
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
              <button onClick={() => setConfirmLogout(true)} style={{
                background: "none", border: "none", color: t.dim, cursor: "pointer", fontSize: 14, padding: 4,
              }} title="Sign out">↪</button>
            )}
          </div>
        </div>
      </div>

      {/* Logout confirm */}
      {confirmLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setConfirmLogout(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.card, borderRadius: 20, padding: "28px 24px", width: 300, boxShadow: t.shadow, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Yakin mau keluar?</div>
            <div style={{ fontSize: 12, color: t.dim, marginBottom: 20 }}>Moku bakal nunggu kamu balik!</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmLogout(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Batal</button>
              <button onClick={() => { signOut(); router.push("/"); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: t.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Mobile bottom tab bar ──
function MobileBottomNav() {
  const t = useTheme();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const toggle = useThemeToggle();
  const [showMore, setShowMore] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const isMoreActive = !["/dashboard", "/dashboard/study", "/dashboard/laprak", "/dashboard/room"].includes(pathname);

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowMore(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: "fixed", bottom: 60, left: 0, right: 0, background: t.card,
            borderTop: `1.5px solid ${t.border}`, borderRadius: "20px 20px 0 0",
            padding: "16px 16px 8px", zIndex: 91, boxShadow: "0 -8px 30px rgba(0,0,0,.12)",
          }}>
            <div style={{ width: 36, height: 4, background: t.border, borderRadius: 2, margin: "0 auto 16px" }} />
            {/* All nav items */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
              {[...NAV, ...BOTTOM].map(item => {
                const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path + "/"));
                return (
                  <button key={item.path} onClick={() => { router.push(item.path); setShowMore(false); }} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "10px 6px", borderRadius: 12, border: "none",
                    background: isActive ? t.primary + "15" : t.bg2, cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? t.primary : t.sub }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            {/* User row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: t.bg2, marginBottom: 8 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: 10, objectFit: "cover" }} referrerPolicy="no-referrer" />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${t.amber}, ${t.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{initials}</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</div>
                <div style={{ fontSize: 10, color: t.dim }}>Free Plan</div>
              </div>
              <button onClick={toggle} style={{ background: t.bg3, border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer" }}>{t.mode === "dark" ? "🌙" : "☀️"}</button>
              <button onClick={() => { signOut(); router.push("/"); }} style={{ background: t.bg3, border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer" }}>↪</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 60,
        background: t.card, borderTop: `1.5px solid ${t.border}`,
        display: "flex", alignItems: "stretch", zIndex: 80,
        boxShadow: "0 -4px 20px rgba(0,0,0,.08)",
      }}>
        {MOBILE_TABS.map(item => {
          const isActive = item.label === "More"
            ? isMoreActive
            : (pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path + "/")));
          return (
            <button key={item.path} onClick={() => item.label === "More" ? setShowMore(s => !s) : router.push(item.path)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 2, border: "none", background: "transparent", cursor: "pointer", padding: "4px 0",
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? t.primary : t.dim }}>{item.label}</span>
              {isActive && <div style={{ position: "absolute", bottom: 0, width: 24, height: 2, background: t.primary, borderRadius: 1 }} />}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Export ──
export default function Sidebar({ collapsed, setCollapsed }) {
  const mobile = useIsMobile(768);
  if (mobile) return <MobileBottomNav />;
  return <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} />;
}
