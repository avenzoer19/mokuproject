"use client";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const t = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? 68 : 220;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "wiggle 2s ease-in-out infinite" }}>🧠</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sub }}>Loading Moku...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, transition: "background .3s, color .3s" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ marginLeft: sidebarW, minHeight: "100vh", transition: "margin-left .3s cubic-bezier(.4,0,.2,1)" }}>
        {children}
      </div>
    </div>
  );
}
