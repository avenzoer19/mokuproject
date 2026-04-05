"use client";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useIsMobile } from "@/lib/useIsMobile";

export default function DashboardLayout({ children }) {
  const t = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const mobile = useIsMobile(768);
  const sidebarW = mobile ? 0 : (collapsed ? 68 : 220);

  // Track whether we've ever confirmed a logged-in user this session.
  // This prevents spurious redirects when Supabase briefly re-validates
  // the token after the tab regains focus (brief user=null flash).
  const hasEverHadUser = useRef(false);
  if (user) hasEverHadUser.current = true;

  useEffect(() => {
    if (loading) return;
    if (user) return;
    // Only redirect if we've never had a confirmed session (fresh visit with no auth).
    // If we HAD a user and briefly lost it (token refresh), wait a beat first.
    if (!hasEverHadUser.current) {
      router.push("/");
      return;
    }
    // Had a user before — give Supabase 2s to refresh the token before redirecting.
    const timer = setTimeout(() => {
      if (!hasEverHadUser.current) router.push("/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, loading, router]);

  // Show loading screen only on first load (before we've ever had a user).
  // After that, render children immediately to avoid flash/remount on token refresh.
  if (loading && !hasEverHadUser.current) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "wiggle 2s ease-in-out infinite" }}>🧠</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sub }}>Loading Moku...</div>
        </div>
      </div>
    );
  }

  if (!user && !hasEverHadUser.current) return null;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, transition: "background .3s, color .3s" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{
        marginLeft: sidebarW,
        minHeight: "100vh",
        paddingBottom: mobile ? 68 : 0,
        transition: "margin-left .3s cubic-bezier(.4,0,.2,1)",
      }}>
        {children}
      </div>
    </div>
  );
}
