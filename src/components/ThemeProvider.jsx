"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { themes } from "@/lib/theme";

const ThemeCtx = createContext(themes.light);
const ThemeToggleCtx = createContext(() => {});

export const useTheme = () => useContext(ThemeCtx);
export const useThemeToggle = () => useContext(ThemeToggleCtx);

export default function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("moku-theme");
    if (saved === "dark") setIsDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("moku-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const t = isDark ? themes.dark : themes.light;
  const toggle = () => setIsDark(d => !d);

  return (
    <ThemeCtx.Provider value={t}>
      <ThemeToggleCtx.Provider value={toggle}>
        {children}
      </ThemeToggleCtx.Provider>
    </ThemeCtx.Provider>
  );
}
