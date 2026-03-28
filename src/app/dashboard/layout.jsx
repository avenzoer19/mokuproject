"use client";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

export default function DashboardLayout({ children }) {
  const t = useTheme();
  const [sidebarW] = useState(220);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, transition: "background .3s, color .3s" }}>
      <Sidebar />
      <div style={{ marginLeft: sidebarW, minHeight: "100vh", transition: "margin-left .3s" }}>
        {children}
      </div>
    </div>
  );
}
