'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Protocol, ProtocolStep, LabLog } from '@/lib/supabase/database.types';

export interface ProtocolWithSteps extends Protocol {
  steps: ProtocolStep[];
}

export function useProtocols() {
  const [protocols, setProtocols] = useState<ProtocolWithSteps[]>([]);
  const [logs, setLogs] = useState<LabLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const [{ data: prots }, { data: logData }] = await Promise.all([
      supabase
        .from('protocols')
        .select('*, steps:protocol_steps(*)')
        .order('updated_at', { ascending: false }),
      supabase
        .from('lab_logs')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(50),
    ]);

    setProtocols(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((prots ?? []) as unknown as any[]).map((p: any) => ({
        ...p,
        steps: ((p.steps ?? []) as ProtocolStep[]).sort((a, b) => a.step_number - b.step_number),
      }))
    );
    setLogs(logData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createProtocol = async (title: string, description?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('protocols') as any)
      .insert({ title, description, user_id: user.id, status: 'draft' })
      .select()
      .single() as { data: Protocol | null };

    if (data) {
      setProtocols(prev => [{ ...data, steps: [] }, ...prev]);
    }
    return data;
  };

  const addStep = async (protocolId: string, step: Omit<ProtocolStep, 'id' | 'created_at' | 'updated_at' | 'protocol_id'>) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('protocol_steps') as any)
      .insert({ ...step, protocol_id: protocolId })
      .select()
      .single() as { data: ProtocolStep | null };

    if (data) {
      setProtocols(prev => prev.map(p =>
        p.id === protocolId ? { ...p, steps: [...p.steps, data].sort((a, b) => a.step_number - b.step_number) } : p
      ));
    }
    return data;
  };

  const updateStepStatus = async (stepId: string, status: ProtocolStep['status']) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('protocol_steps') as any).update({ status }).eq('id', stepId);
    setProtocols(prev => prev.map(p => ({
      ...p,
      steps: p.steps.map(s => s.id === stepId ? { ...s, status } : s),
    })));
  };

  const addLog = async (log: Omit<LabLog, 'id' | 'logged_at' | 'user_id'>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('lab_logs') as any)
      .insert({ ...log, user_id: user.id })
      .select()
      .single() as { data: LabLog | null };

    if (data) setLogs(prev => [data, ...prev]);
    return data;
  };

  return { protocols, logs, loading, createProtocol, addStep, updateStepStatus, addLog, refetch: fetch };
}
