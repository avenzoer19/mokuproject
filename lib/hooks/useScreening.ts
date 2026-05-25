'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ScreeningSession, ScreeningDecision } from '@/lib/supabase/database.types';

export interface SessionWithCriteria extends ScreeningSession {
  criteria: { id: string; type: string; text: string }[];
}

export function useScreening() {
  const [sessions, setSessions] = useState<SessionWithCriteria[]>([]);
  const [activeSession, setActiveSession] = useState<SessionWithCriteria | null>(null);
  const [decisions, setDecisions] = useState<ScreeningDecision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('screening_sessions') as any)
      .select('*, criteria:screening_criteria(*)')
      .order('updated_at', { ascending: false }) as { data: SessionWithCriteria[] | null };
    setSessions((data ?? []) as SessionWithCriteria[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (title: string, includeTags: string[], excludeTags: string[]) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (supabase.from('screening_sessions') as any)
      .insert({ title, user_id: user.id, status: 'active' })
      .select()
      .single() as { data: ScreeningSession | null };

    if (!session) return null;

    // Insert criteria
    const criteriaRows = [
      ...includeTags.map(text => ({ session_id: session.id, type: 'include', text })),
      ...excludeTags.map(text => ({ session_id: session.id, type: 'exclude', text })),
    ];
    if (criteriaRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('screening_criteria') as any).insert(criteriaRows);
    }

    await fetchSessions();
    return session;
  };

  const loadSession = async (sessionId: string) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (supabase.from('screening_sessions') as any)
      .select('*, criteria:screening_criteria(*)')
      .eq('id', sessionId)
      .single() as { data: SessionWithCriteria | null };

    const { data: decs } = await supabase
      .from('screening_decisions')
      .select('*')
      .eq('session_id', sessionId);

    setActiveSession(session as SessionWithCriteria);
    setDecisions((decs as unknown as ScreeningDecision[]) ?? []);
  };

  const saveDecision = async (
    sessionId: string,
    paperId: string | null,
    paperTitle: string,
    decision: 'include' | 'exclude' | 'undecided',
    aiConfidence?: number,
    aiReasoning?: string,
  ) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('screening_decisions') as any).upsert({
      session_id: sessionId,
      paper_id: paperId,
      user_id: user.id,
      decision,
      ai_confidence: aiConfidence ?? null,
      ai_reasoning: aiReasoning ?? null,
      reviewer_notes: paperTitle,
    }, { onConflict: 'session_id,paper_id,user_id' });

    // Bump done_count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('screening_sessions') as any)
      .update({ done_count: (activeSession?.done_count ?? 0) + 1 })
      .eq('id', sessionId);
  };

  const completeSession = async (sessionId: string) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('screening_sessions') as any)
      .update({ status: 'completed' })
      .eq('id', sessionId);
    await fetchSessions();
  };

  return { sessions, activeSession, decisions, loading, createSession, loadSession, saveDecision, completeSession, refetch: fetchSessions };
}
