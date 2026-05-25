'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Paper, TablesInsert } from '@/lib/supabase/database.types';

export interface PaperWithTags extends Paper {
  tags: { id: string; name: string; color: string | null }[];
}

export function usePapers() {
  const [papers, setPapers] = useState<PaperWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('papers')
      .select(`
        *,
        tags:paper_tags(tag:tags(id, name, color))
      `)
      .order('created_at', { ascending: false });

    if (error) { setError(error.message); setLoading(false); return; }

    // Flatten nested tags — cast through unknown to bypass join-type inference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flat: PaperWithTags[] = ((data ?? []) as unknown as any[]).map((p: any) => ({
      ...p,
      tags: (p.tags ?? []).map((t: any) => t.tag).filter(Boolean),
    }));
    setPapers(flat);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addPaper = async (paper: Omit<TablesInsert<'papers'>, 'user_id'>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('papers')
      .insert({ ...paper, user_id: user.id })
      .select()
      .single();

    if (error) { setError(error.message); return null; }
    await fetch();
    return data;
  };

  const updatePaper = async (id: string, updates: Partial<Paper>) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from('papers')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updates as any)
      .eq('id', id);
    if (error) { setError(error.message); return false; }
    setPapers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return true;
  };

  const deletePaper = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('papers').delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    setPapers(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const toggleBookmark = async (id: string, current: boolean) => {
    return updatePaper(id, { is_bookmarked: !current });
  };

  const uploadPdf = async (paperId: string, file: File): Promise<string | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const path = `${user.id}/${paperId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('papers')
      .upload(path, file, { upsert: true });

    if (uploadError) { setError(uploadError.message); return null; }

    const { data: { publicUrl } } = supabase.storage.from('papers').getPublicUrl(path);
    await updatePaper(paperId, { pdf_path: path, pdf_url: publicUrl });
    return publicUrl;
  };

  return { papers, loading, error, addPaper, updatePaper, deletePaper, toggleBookmark, uploadPdf, refetch: fetch };
}
