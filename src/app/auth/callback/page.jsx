"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";

export default function AuthCallback() {
  const router = useRouter();
  const t = useTheme();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard");
      }
    });
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12, animation: "wiggle 2s ease-in-out infinite" }}>🧠</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Logging in...</div>
        <div style={{ fontSize: 12, color: t.sub, marginTop: 8 }}>Moku sedang menyiapkan ruanganmu ✨</div>
      </div>
    </div>
  );
}
