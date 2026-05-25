'use client';

import { useState } from 'react';
import {
  GripVertical, Plus, AlertTriangle, CheckCircle2,
  Clock, Loader2, Upload, Brain, X,
} from 'lucide-react';
import { useProtocols } from '@/lib/hooks/useProtocols';

const steps = [
  {
    id: 1,
    name: 'Sample Preparation',
    status: 'done',
    duration: '45 min',
    params: [
      { k: 'Cell density', v: '2×10⁶ cells/mL' },
      { k: 'Buffer', v: 'RIPA + protease inhibitors' },
      { k: 'Temperature', v: '4 °C' },
    ],
    notes: 'Spin at 14,000 rpm for 15 min. Keep on ice.',
  },
  {
    id: 2,
    name: 'Protein Quantification',
    status: 'done',
    duration: '30 min',
    params: [
      { k: 'Method', v: 'BCA Assay' },
      { k: 'Standard range', v: '0–2,000 µg/mL' },
      { k: 'Absorbance', v: '562 nm' },
    ],
    notes: 'Target 40 µg total protein per lane.',
  },
  {
    id: 3,
    name: 'SDS-PAGE',
    status: 'running',
    duration: '90 min',
    params: [
      { k: 'Gel %', v: '10% polyacrylamide' },
      { k: 'Voltage', v: '120 V → 180 V' },
      { k: 'Buffer', v: 'Tris-Glycine running buffer' },
    ],
    notes: 'Run until dye front reaches bottom of gel.',
  },
  {
    id: 4,
    name: 'Transfer (Wet)',
    status: 'draft',
    duration: '60–90 min',
    params: [
      { k: 'Membrane', v: 'PVDF (activated in MeOH)' },
      { k: 'Current', v: '350 mA constant' },
      { k: 'Buffer', v: 'Transfer buffer + 20% MeOH' },
    ],
    notes: 'Ice-cold transfer buffer. Replace ice halfway.',
  },
  {
    id: 5,
    name: 'Western Blot Detection',
    status: 'draft',
    duration: '120 min + overnight',
    params: [
      { k: 'Blocking', v: '5% BSA in TBST, 1 h' },
      { k: 'Primary Ab', v: 'Anti-target 1:1000, 4 °C overnight' },
      { k: 'Secondary Ab', v: 'HRP-conjugated 1:5000, 1 h RT' },
    ],
    notes: 'ECL detection. Expose 30 s → 5 min.',
  },
];

const statusConfig = {
  running: { label: 'Running', color: 'var(--teal)',    bg: 'var(--teal-soft)',            icon: <Loader2 size={11} className="animate-spin" /> },
  done:    { label: 'Done',    color: 'var(--success)', bg: 'rgba(111,191,138,0.12)',      icon: <CheckCircle2 size={11} /> },
  caution: { label: 'Caution', color: 'var(--warn)',    bg: 'rgba(224,169,87,0.12)',       icon: <AlertTriangle size={11} /> },
  draft:   { label: 'Draft',   color: 'var(--text-4)', bg: 'var(--surface-2)',             icon: <Clock size={11} /> },
} as const;

const logEntries = [
  { time: '14:32', step: 'SDS-PAGE', param: 'Voltage', expected: '120 V', actual: '118 V', delta: '−2 V', status: 'live', operator: 'A.O.' },
  { time: '14:18', step: 'SDS-PAGE', param: 'Temperature', expected: '22 °C', actual: '23.4 °C', delta: '+1.4 °C', status: 'success', operator: 'A.O.' },
  { time: '14:05', step: 'BCA Assay', param: 'A562 mean', expected: '0.412', actual: '0.418', delta: '+0.006', status: 'success', operator: 'K.M.' },
  { time: '13:47', step: 'BCA Assay', param: 'Standard R²', expected: '≥0.99', actual: '0.9978', delta: '—', status: 'success', operator: 'K.M.' },
  { time: '13:22', step: 'Sample Prep', param: 'Spin RPM', expected: '14,000', actual: '13,850', delta: '−150', status: 'partial', operator: 'A.O.' },
  { time: '12:55', step: 'Sample Prep', param: 'Lysis time', expected: '30 min', actual: '32 min', delta: '+2 min', status: 'success', operator: 'A.O.' },
  { time: '12:30', step: 'Sample Prep', param: 'Cell count', expected: '2.0M/mL', actual: '1.87M/mL', delta: '−6.5%', status: 'partial', operator: 'A.O.' },
  { time: '11:48', step: 'Pre-check', param: 'Reagent lot', expected: 'AB-2024-09', actual: 'AB-2024-07', delta: '—', status: 'fail', operator: 'K.M.' },
];

const logStatusConfig = {
  live:    { label: 'Live',    color: 'var(--teal)',    bg: 'var(--teal-soft)' },
  success: { label: 'OK',      color: 'var(--success)', bg: 'rgba(111,191,138,0.12)' },
  partial: { label: 'Partial', color: 'var(--warn)',    bg: 'rgba(224,169,87,0.12)' },
  fail:    { label: 'Fail',    color: 'var(--red)',     bg: 'rgba(229,86,75,0.12)' },
} as const;

const failures = [
  {
    date: '2024-11-15',
    step: 'Transfer (Wet)',
    observation: 'Incomplete protein transfer — bands absent above 100 kDa',
    aiCause: 'Insufficient methanol concentration in transfer buffer may have reduced membrane activation for large proteins. SDS concentration in gel too high for large proteins at given voltage.',
    severity: 'high',
  },
  {
    date: '2024-11-08',
    step: 'Western Blot',
    observation: 'High background across entire membrane',
    aiCause: 'Blocking time insufficient (only 30 min instead of 60 min). Antibody concentration too high (1:500 vs. recommended 1:1000). TBST wash steps may have been too brief.',
    severity: 'medium',
  },
];

export default function WetLabPage() {
  const [activePanel, setActivePanel] = useState<'protocol' | 'log' | 'failures'>('protocol');
  const { protocols, logs, loading, createProtocol, updateStepStatus, addLog } = useProtocols();
  const [activeProtocolIdx, setActiveProtocolIdx] = useState(0);
  const [showNewProtocol, setShowNewProtocol] = useState(false);
  const [newProtocolTitle, setNewProtocolTitle] = useState('');
  const [showAddLog, setShowAddLog] = useState(false);
  const [logForm, setLogForm] = useState({ step_title: '', parameter: '', expected: '', actual: '', notes: '' });

  // Use real data if available, otherwise show demo data
  const activeProtocol = protocols[activeProtocolIdx] ?? null;
  const displaySteps = activeProtocol?.steps.length ? activeProtocol.steps : steps;
  const displayLogs = logs.length ? logs : logEntries.map((l, i) => ({ ...l, id: String(i), logged_at: null, user_id: '' }));

  async function handleCreateProtocol() {
    if (!newProtocolTitle.trim()) return;
    await createProtocol(newProtocolTitle.trim());
    setNewProtocolTitle('');
    setShowNewProtocol(false);
    setActiveProtocolIdx(0);
  }

  async function handleAddLog() {
    if (!logForm.step_title.trim()) return;
    await addLog({
      step_title: logForm.step_title,
      parameter: logForm.parameter || null,
      expected: logForm.expected || null,
      actual: logForm.actual || null,
      notes: logForm.notes || null,
      protocol_id: activeProtocol?.id ?? null,
      status: 'success',
      operator: null,
      delta: null,
    });
    setLogForm({ step_title: '', parameter: '', expected: '', actual: '', notes: '' });
    setShowAddLog(false);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Panel tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        padding: '0 24px',
        flexShrink: 0,
      }}>
        {(['protocol', 'log', 'failures'] as const).map(panel => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel)}
            style={{
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activePanel === panel ? '2px solid var(--teal)' : '2px solid transparent',
              color: activePanel === panel ? 'var(--teal)' : 'var(--text-3)',
              fontSize: '13.5px',
              fontWeight: activePanel === panel ? 500 : 300,
              cursor: 'pointer',
              transition: 'color 0.15s',
              textTransform: 'capitalize',
              marginBottom: '-1px',
            }}
          >
            {panel === 'protocol' ? 'Protocol Canvas' : panel === 'log' ? 'Smart Log' : 'Failure Tracker'}
          </button>
        ))}
      </div>

      {/* Protocol Canvas */}
      {activePanel === 'protocol' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Protocol selector header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {protocols.length > 0 && (
              <select
                value={activeProtocolIdx}
                onChange={e => setActiveProtocolIdx(Number(e.target.value))}
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 13, padding: '7px 10px', fontFamily: 'inherit', cursor: 'pointer', flex: 1 }}
              >
                {protocols.map((p, i) => (
                  <option key={p.id} value={i}>{p.title}</option>
                ))}
              </select>
            )}
            {protocols.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: 'var(--text-4)', flex: 1 }}>
                No protocols yet. Create one to get started.
              </div>
            )}
            <button
              onClick={() => setShowNewProtocol(v => !v)}
              style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 8, color: '#0B3B38', fontSize: 12, fontWeight: 500, padding: '8px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              <Plus size={13} /> New Protocol
            </button>
          </div>

          {/* New protocol form */}
          {showNewProtocol && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 8 }}>
              <input
                autoFocus
                value={newProtocolTitle}
                onChange={e => setNewProtocolTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProtocol()}
                placeholder="Protocol title…"
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={handleCreateProtocol} style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 8, color: '#0B3B38', fontSize: 12, fontWeight: 500, padding: '8px 14px', cursor: 'pointer' }}>Create</button>
              <button onClick={() => setShowNewProtocol(false)} style={{ appearance: 'none', background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-3)', padding: '8px', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}

          {displaySteps.map((step, idx) => {
            // Normalize demo vs DB step
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s = step as any;
            const stepTitle = s.title ?? s.name ?? 'Step';
            const stepStatus = s.status ?? 'draft';
            const stepDuration = s.duration ?? (s.duration_min ? `${s.duration_min} min` : '');
            const stepNotes = s.notes ?? s.description ?? '';
            // params: demo has { k, v }[] ; DB has parameters as JSON object or null
            const stepParams: { k: string; v: string }[] = s.params
              ?? (s.parameters && typeof s.parameters === 'object' && !Array.isArray(s.parameters)
                ? Object.entries(s.parameters).map(([k, v]) => ({ k, v: String(v) }))
                : []);
            const isDbStep = !!activeProtocol;
            const cfg = statusConfig[stepStatus as keyof typeof statusConfig] ?? statusConfig.draft;
            return (
              <div
                key={s.id ?? idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr',
                  gap: '14px',
                  alignItems: 'start',
                }}
              >
                {/* Drag handle */}
                <div style={{
                  paddingTop: '2px',
                  color: 'var(--text-4)',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1px',
                }}>
                  <GripVertical size={16} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                      {idx + 1}. {stepTitle}
                    </span>
                    <button
                      onClick={() => isDbStep && s.id && updateStepStatus(s.id, stepStatus === 'draft' ? 'running' : stepStatus === 'running' ? 'done' : 'draft')}
                      title={isDbStep ? 'Click to advance status' : undefined}
                      style={{
                        appearance: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: cfg.bg,
                        color: cfg.color,
                        border: 'none',
                        cursor: isDbStep ? 'pointer' : 'default',
                      }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </button>
                    {stepDuration && (
                      <span style={{ fontSize: '12px', color: 'var(--text-4)', marginLeft: 'auto' }}>
                        <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                        {stepDuration}
                      </span>
                    )}
                  </div>

                  {stepParams.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px',
                      marginBottom: '12px',
                    }}>
                      {stepParams.map(({ k, v }) => (
                        <div key={k} style={{
                          background: 'var(--surface-2)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '12.5px',
                        }}>
                          <div style={{ color: 'var(--text-4)', marginBottom: '2px' }}>{k}</div>
                          <div style={{ color: 'var(--text)', fontFamily: 'var(--font-geist-mono)', fontSize: '12px' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '12.5px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                    {stepNotes}
                  </div>
                </div>
              </div>
            );
          })}

          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px',
            background: 'transparent',
            border: '1px dashed var(--line)',
            borderRadius: '14px',
            color: 'var(--text-3)',
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
          >
            <Plus size={16} /> Add step
          </button>
        </div>
      )}

      {/* Smart Log */}
      {activePanel === 'log' && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Add log entry button */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => setShowAddLog(v => !v)}
              style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 8, color: '#0B3B38', fontSize: 12, fontWeight: 500, padding: '7px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={13} /> Add Log Entry
            </button>
          </div>

          {showAddLog && (
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, flexShrink: 0 }}>
              {[
                { k: 'step_title', label: 'Step *', placeholder: 'Step name' },
                { k: 'parameter', label: 'Parameter', placeholder: 'e.g. Voltage' },
                { k: 'expected', label: 'Expected', placeholder: 'e.g. 120 V' },
                { k: 'actual', label: 'Actual', placeholder: 'e.g. 118 V' },
                { k: 'notes', label: 'Notes', placeholder: 'Optional' },
              ].map(({ k, label, placeholder }) => (
                <div key={k}>
                  <label style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono,monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{label}</label>
                  <input
                    value={logForm[k as keyof typeof logForm]}
                    onChange={e => setLogForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '6px 8px', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <button onClick={handleAddLog} style={{ appearance: 'none', background: 'var(--teal)', border: 'none', borderRadius: 7, color: '#0B3B38', fontSize: 12, fontWeight: 500, padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Save Entry</button>
                <button onClick={() => setShowAddLog(false)} style={{ appearance: 'none', background: 'transparent', border: '1px solid var(--line)', borderRadius: 7, color: 'var(--text-3)', padding: '7px', cursor: 'pointer' }}><X size={13} /></button>
              </div>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
                {['Time', 'Step', 'Parameter', 'Expected', 'Actual', 'Δ', 'Status', 'Operator', 'Notes'].map(h => (
                  <th key={h} style={{
                    padding: '11px 14px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-4)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayLogs.map((entry, idx) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const e = entry as any;
                const timeStr = e.time ?? (e.logged_at ? new Date(e.logged_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : '—');
                const statusKey = e.status as keyof typeof logStatusConfig;
                const cfg = logStatusConfig[statusKey] ?? logStatusConfig.success;
                return (
                  <tr key={e.id ?? idx} style={{
                    borderBottom: '1px solid var(--line-soft)',
                    background: idx % 2 === 1 ? 'var(--row-alt)' : 'transparent',
                  }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--row-hover)'; }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = idx % 2 === 1 ? 'var(--row-alt)' : 'transparent'; }}
                  >
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)' }}>{timeStr}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{e.step ?? e.step_title ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text)' }}>{e.param ?? e.parameter ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono)' }}>{e.expected ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text)', fontFamily: 'var(--font-geist-mono)', fontWeight: 500 }}>{e.actual ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'var(--font-geist-mono)', color: String(e.delta ?? '').startsWith('+') ? 'var(--warn)' : String(e.delta ?? '').startsWith('−') ? 'var(--blue)' : 'var(--text-4)' }}>{e.delta ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: cfg.bg,
                        color: cfg.color,
                        whiteSpace: 'nowrap',
                      }}>
                        {e.status === 'live' && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal)', animation: 'pulse-ring 1.5s ease-out infinite' }} />
                        )}
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-geist-mono)' }}>{e.operator ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-4)' }}>{e.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Failure Tracker */}
      {activePanel === 'failures' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Drop zone */}
          <div style={{
            border: '1.5px dashed var(--line)',
            borderRadius: '14px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
          >
            <Upload size={22} style={{ color: 'var(--text-4)' }} />
            <div style={{ fontSize: '13.5px', color: 'var(--text-3)' }}>Drop SEM image or gel photo to analyze failure</div>
            <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>PNG, TIFF, or JPG · AI will identify potential causes</div>
          </div>

          {/* Failure entries */}
          {failures.map((f, i) => (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderLeft: `3px solid ${f.severity === 'high' ? 'var(--red)' : 'var(--warn)'}`,
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    background: f.severity === 'high' ? 'rgba(229,86,75,0.12)' : 'rgba(224,169,87,0.12)',
                    color: f.severity === 'high' ? 'var(--red)' : 'var(--warn)',
                  }}>
                    {f.severity === 'high' ? 'High severity' : 'Medium severity'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>{f.date}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{f.step}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{f.observation}</div>
              </div>

              {/* AI cause card */}
              <div style={{
                padding: '14px 20px',
                background: 'rgba(224,169,87,0.04)',
                display: 'flex',
                gap: '12px',
              }}>
                <Brain size={16} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--warn)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    AI Root Cause Analysis
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{f.aiCause}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
