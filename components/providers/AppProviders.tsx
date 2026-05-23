'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/* ─── Theme ──────────────────────────────────────────────── */
type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

/* ─── Sidebar ────────────────────────────────────────────── */
type SidebarState = 'collapsed' | 'expanded';

interface SidebarCtx {
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setSidebar: (s: SidebarState) => void;
}

const SidebarContext = createContext<SidebarCtx>({
  sidebar: 'collapsed',
  toggleSidebar: () => {},
  setSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

/* ─── Copilot ────────────────────────────────────────────── */
interface CopilotCtx {
  copilotOpen: boolean;
  toggleCopilot: () => void;
  setCopilotOpen: (v: boolean) => void;
}

const CopilotContext = createContext<CopilotCtx>({
  copilotOpen: false,
  toggleCopilot: () => {},
  setCopilotOpen: () => {},
});

export function useCopilot() {
  return useContext(CopilotContext);
}

/* ─── Overlays ───────────────────────────────────────────── */
interface OverlayCtx {
  cmdPaletteOpen: boolean;
  shortcutMapOpen: boolean;
  openCmdPalette: () => void;
  closeCmdPalette: () => void;
  openShortcutMap: () => void;
  closeShortcutMap: () => void;
  closeAll: () => void;
}

const OverlayContext = createContext<OverlayCtx>({
  cmdPaletteOpen: false,
  shortcutMapOpen: false,
  openCmdPalette: () => {},
  closeCmdPalette: () => {},
  openShortcutMap: () => {},
  closeShortcutMap: () => {},
  closeAll: () => {},
});

export function useOverlay() {
  return useContext(OverlayContext);
}

/* ─── Sign-out modal ─────────────────────────────────────── */
interface SignOutCtx {
  signOutModalOpen: boolean;
  openSignOutModal: () => void;
  closeSignOutModal: () => void;
}

const SignOutContext = createContext<SignOutCtx>({
  signOutModalOpen: false,
  openSignOutModal: () => {},
  closeSignOutModal: () => {},
});

export function useSignOut() {
  return useContext(SignOutContext);
}

/* ─── Combined Provider ──────────────────────────────────── */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebar, setSidebarState] = useState<SidebarState>('collapsed');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [shortcutMapOpen, setShortcutMapOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  // Init theme from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem('moku-theme') as Theme) || 'dark';
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  // Init sidebar from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem('moku-sidebar') as SidebarState) || 'collapsed';
    setSidebarState(stored);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('moku-theme', next);
      return next;
    });
  }, []);

  const setSidebar = useCallback((s: SidebarState) => {
    setSidebarState(s);
    localStorage.setItem('moku-sidebar', s);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebar(sidebar === 'collapsed' ? 'expanded' : 'collapsed');
  }, [sidebar, setSidebar]);

  const toggleCopilot = useCallback(() => setCopilotOpen(v => !v), []);

  const openCmdPalette  = useCallback(() => setCmdPaletteOpen(true),  []);
  const closeCmdPalette = useCallback(() => setCmdPaletteOpen(false), []);
  const openShortcutMap  = useCallback(() => setShortcutMapOpen(true),  []);
  const closeShortcutMap = useCallback(() => setShortcutMapOpen(false), []);

  const closeAll = useCallback(() => {
    setCmdPaletteOpen(false);
    setShortcutMapOpen(false);
    setCopilotOpen(false);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <SidebarContext.Provider value={{ sidebar, toggleSidebar, setSidebar }}>
        <CopilotContext.Provider value={{ copilotOpen, toggleCopilot, setCopilotOpen }}>
          <OverlayContext.Provider value={{
            cmdPaletteOpen, shortcutMapOpen,
            openCmdPalette, closeCmdPalette,
            openShortcutMap, closeShortcutMap,
            closeAll,
          }}>
            <SignOutContext.Provider value={{
              signOutModalOpen,
              openSignOutModal: () => setSignOutModalOpen(true),
              closeSignOutModal: () => setSignOutModalOpen(false),
            }}>
              {children}
            </SignOutContext.Provider>
          </OverlayContext.Provider>
        </CopilotContext.Provider>
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}
