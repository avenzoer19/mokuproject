'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOverlay } from '@/components/providers/AppProviders';
import { useSidebar } from '@/components/providers/AppProviders';
import { useCopilot } from '@/components/providers/AppProviders';
import { useTheme } from '@/components/providers/AppProviders';

export default function GlobalKeyboard() {
  const router = useRouter();
  const { openCmdPalette, closeCmdPalette, openShortcutMap, closeShortcutMap, cmdPaletteOpen, shortcutMapOpen } = useOverlay();
  const { toggleSidebar } = useSidebar();
  const { toggleCopilot } = useCopilot();
  const { toggleTheme } = useTheme();
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      // Ignore synthetic/CDP-injected events (e.g. from automation tools)
      if (!e.isTrusted) return;
      const meta = e.metaKey || e.ctrlKey;

      // ⌘K — command palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        cmdPaletteOpen ? closeCmdPalette() : openCmdPalette();
        return;
      }

      // ⌘J — copilot
      if (meta && e.key === 'j') {
        e.preventDefault();
        toggleCopilot();
        return;
      }

      // ⌘⇧D — toggle theme
      if (meta && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // Esc — close overlays
      if (e.key === 'Escape') {
        closeCmdPalette();
        closeShortcutMap();
        return;
      }

      if (isInputFocused()) return;

      // [ — toggle sidebar
      if (e.key === '[' && !meta) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // ? — shortcut map
      if (e.key === '?') {
        e.preventDefault();
        shortcutMapOpen ? closeShortcutMap() : openShortcutMap();
        return;
      }

      // G+key navigation (two-key sequence)
      if (e.key === 'g' || e.key === 'G') {
        gPressedRef.current = true;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        gTimerRef.current = setTimeout(() => { gPressedRef.current = false; }, 500);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        switch (e.key.toLowerCase()) {
          case 'h': router.push('/dashboard'); break;
          case 'l': router.push('/dashboard/library'); break;
          case 'w': router.push('/dashboard/wet-lab'); break;
          case 'd': router.push('/dashboard/dry-lab'); break;
          case 's': router.push('/dashboard/studio'); break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [
    cmdPaletteOpen, shortcutMapOpen,
    openCmdPalette, closeCmdPalette,
    openShortcutMap, closeShortcutMap,
    toggleCopilot, toggleSidebar, toggleTheme, router,
  ]);

  return null;
}
