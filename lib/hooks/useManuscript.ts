'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Manuscript } from '@/lib/supabase/database.types';

export function useManuscript(manuscriptId?: string) {
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [allManuscripts, setAllManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('manuscripts')
      .select('*')
      .order('updated_at', { ascending: false });
    setAllManuscripts(data ?? []);
    setLoading(false);
  }, []);

  const fetchOne = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data } = await supabase.from('manuscripts').select('*').eq('id', id).single();
    setManuscript(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (manuscriptId) fetchOne(manuscriptId);
    else fetchAll();
  }, [manuscriptId, fetchOne, fetchAll]);

  const createManuscript = async (title = 'Untitled Manuscript') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('manuscripts') as any)
      .insert({ title, user_id: user.id, content: '', word_count: 0 })
      .select()
      .single() as { data: Manuscript | null; error: unknown };

    if (error) return null;
    if (data) setAllManuscripts(prev => [data, ...prev]);
    return data;
  };

  // Auto-save with 1.5s debounce
  const saveContent = useCallback((id: string, content: string, title?: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('manuscripts') as any)
        .update({ content, word_count: wordCount, ...(title ? { title } : {}) })
        .eq('id', id);
      setSaving(false);
      setManuscript(prev => prev ? { ...prev, content, word_count: wordCount } : null);
    }, 1500);
  }, []);

  const deleteManuscript = async (id: string) => {
    const supabase = createClient();
    await supabase.from('manuscripts').delete().eq('id', id);
    setAllManuscripts(prev => prev.filter(m => m.id !== id));
  };

  return { manuscript, allManuscripts, loading, saving, createManuscript, saveContent, deleteManuscript, refetch: fetchAll };
}
