'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Upload, CheckCircle2, RotateCcw, Maximize2,
  Sparkles, ArrowRight, Info, TrendingDown,
  Atom,
} from 'lucide-react';

function MoleculeViz({ dragging }: { dragging: boolean }) {
  return (
    <svg viewBox="0 0 420 320" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Protein ribbon — main chain */}
      <path d="M 60,160 C 90,120 130,100 170,110 S 240,140 280,130 S 340,90 380,110" stroke="var(--teal)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* Secondary helix */}
      <path d="M 60,180 C 95,210 135,220 175,210 S 250,185 290,195 S 345,215 380,195" stroke="#6FA8E5" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Beta sheet */}
      <path d="M 80,140 L 160,130 L 165,140 L 80,150 Z" fill="var(--teal)" opacity="0.3" />
      <path d="M 200,145 L 280,135 L 285,145 L 200,155 Z" fill="#6FA8E5" opacity="0.3" />

      {/* Ligand — ball and stick */}
      <line x1="220" y1="160" x2="240" y2="175" stroke="var(--warn)" strokeWidth="2" />
      <line x1="240" y1="175" x2="260" y2="165" stroke="var(--warn)" strokeWidth="2" />
      <line x1="260" y1="165" x2="255" y2="145" stroke="var(--warn)" strokeWidth="2" />
      <line x1="255" y1="145" x2="235" y2="143" stroke="var(--warn)" strokeWidth="2" />
      <line x1="235" y1="143" x2="220" y2="160" stroke="var(--warn)" strokeWidth="2" />
      <circle cx="220" cy="160" r="5" fill="var(--warn)" />
      <circle cx="240" cy="175" r="4" fill="var(--red)" />
      <circle cx="260" cy="165" r="5" fill="var(--warn)" />
      <circle cx="255" cy="145" r="3" fill="var(--violet)" />
      <circle cx="235" cy="143" r="4" fill="var(--warn)" />

      {/* H-bond interaction line */}
      <line x1="220" y1="160" x2="195" y2="148" stroke="#6FA8E5" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.8" />
      {/* π-stack line */}
      <line x1="240" y1="175" x2="255" y2="192" stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
      {/* Hydrophobic line */}
      <line x1="260" y1="165" x2="278" y2="158" stroke="var(--warn)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />

      {/* Residue labels */}
      <text x="185" y="143" fill="#6FA8E5" fontSize="9" fontFamily="var(--font-geist-mono)" opacity="0.9">Asp119</text>
      <text x="258" y="198" fill="var(--violet)" fontSize="9" fontFamily="var(--font-geist-mono)" opacity="0.9">Phe294</text>
      <text x="282" y="156" fill="var(--warn)" fontSize="9" fontFamily="var(--font-geist-mono)" opacity="0.9">Leu367</text>

      {/* Binding pocket dashed outline */}
      <ellipse cx="240" cy="162" rx="55" ry="40" stroke="var(--teal)" strokeWidth="1" strokeDasharray="6,4" fill="rgba(78,205,196,0.04)" />
    </svg>
  );
}

export default function DryLabPage() {
  const [fileLoaded, setFileLoaded] = useState(true);
  const [loading, setLoading] = useState(true);
  const vizRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 8, y: -22 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [autoTumble, setAutoTumble] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!autoTumble || !vizRef.current) return;
    let frame: number;
    let angle = 0;
    const tick = () => {
      angle += 0.3;
      setRotate({ x: Math.sin(angle * 0.7) * 8, y: Math.sin(angle * 0.4) * 22 });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoTumble]);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    setAutoTumble(false);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRotate(prev => ({ x: prev.x - dy * 0.4, y: prev.y + dx * 0.4 }));
  };

  const onPointerUp = () => {
    isDragging.current = false;
    setTimeout(() => setAutoTumble(true), 2000);
  };

  const residues = [
    { name: 'Asp119', type: 'H-bond',     color: 'var(--blue)',    dist: '2.8 Å' },
    { name: 'Phe294', type: 'π-stack',    color: 'var(--violet)',  dist: '3.6 Å' },
    { name: 'Leu367', type: 'Hydrophobic', color: 'var(--warn)',   dist: '4.1 Å' },
    { name: 'Ser201', type: 'H-bond',     color: 'var(--blue)',    dist: '3.1 Å' },
    { name: 'Val412', type: 'Hydrophobic', color: 'var(--warn)',   dist: '4.8 Å' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* File upload strip */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {fileLoaded ? (
          <>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(111,191,138,0.12)', display: 'grid', placeItems: 'center' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                4NQ-B_docking_pose1.pdbqt
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                847 KB · 9 poses · Parsed successfully
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer' }}>
                <RotateCcw size={12} /> New run
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'var(--teal)', border: 'none', borderRadius: '8px', color: '#0F1117', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Pose 1 / 9 <Maximize2 size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Upload size={18} style={{ color: 'var(--text-4)' }} />
            <span style={{ flex: 1, fontSize: '13.5px', color: 'var(--text-3)' }}>Drop a .pdbqt or .mol2 file to begin docking analysis</span>
            <button
              onClick={() => setFileLoaded(true)}
              style={{ padding: '8px 16px', background: 'var(--teal)', border: 'none', borderRadius: '8px', color: '#0F1117', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Upload File
            </button>
          </>
        )}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* 3D Visualization */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Atom size={15} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' }}>Molecular Visualization</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>Drag to rotate · Auto-tumble {autoTumble ? 'on' : 'off'}</span>
          </div>

          <div
            ref={vizRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              height: '340px',
              background: 'var(--viz-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDragging.current ? 'grabbing' : 'grab',
              perspective: '800px',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transformStyle: 'preserve-3d',
              transition: autoTumble ? 'none' : 'transform 0.05s',
            }}>
              <MoleculeViz dragging={isDragging.current} />
            </div>
          </div>

          {/* Interaction legend */}
          <div style={{
            display: 'flex',
            gap: '16px',
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
          }}>
            {[
              { color: '#6FA8E5', label: 'H-bond' },
              { color: 'var(--violet)', label: 'π-stack' },
              { color: 'var(--warn)', label: 'Hydrophobic' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '2px', background: color, borderTop: '1px dashed ' + color }} />
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Validation sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Binding affinity */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '12px' }}>
              Binding Affinity
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
              <TrendingDown size={16} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '28px', fontWeight: 200, color: 'var(--success)' }}>−9.42</span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>kcal/mol</span>
            </div>
            {/* Scale strip */}
            <div style={{ position: 'relative', marginBottom: '6px' }}>
              <div style={{
                height: '6px',
                borderRadius: '3px',
                background: 'linear-gradient(90deg, var(--success) 0%, var(--warn) 55%, var(--red) 100%)',
              }} />
              {/* Indicator */}
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: '28%',
                width: '2px',
                height: '14px',
                background: 'var(--text)',
                borderRadius: '1px',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-4)' }}>
              <span>−14</span><span>Strong</span><span>Weak</span><span>0</span>
            </div>
          </div>

          {/* RMSD */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '8px' }}>
              RMSD
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 200, color: 'var(--teal)' }}>1.42</span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Å</span>
              <span style={{ fontSize: '11px', color: 'var(--success)', marginLeft: 'auto' }}>Excellent</span>
            </div>
            {/* Mini chart */}
            <svg viewBox="0 0 200 40" style={{ width: '100%', height: '40px' }}>
              <polyline
                points="0,30 25,20 50,25 75,15 100,18 125,10 150,14 175,8 200,12"
                stroke="var(--teal)"
                strokeWidth="1.5"
                fill="none"
              />
              <polyline
                points="0,30 25,20 50,25 75,15 100,18 125,10 150,14 175,8 200,12 200,40 0,40"
                fill="rgba(78,205,196,0.08)"
              />
            </svg>
            <div style={{ fontSize: '10px', color: 'var(--text-4)', textAlign: 'right', marginTop: '4px' }}>9 poses</div>
          </div>

          {/* Key residues */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '18px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '12px' }}>
              Key Residues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {residues.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: r.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-geist-mono)', color: 'var(--text)', flex: 1 }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: '11px', color: r.color }}>{r.type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)' }}>{r.dist}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Evaluation banner */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'conic-gradient(from 180deg, var(--teal), var(--violet), var(--teal))',
            display: 'grid',
            placeItems: 'center',
          }}>
            <Sparkles size={18} style={{ color: '#0F1117' }} />
          </div>
          <div style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            border: '2px solid var(--teal)',
            opacity: 0.4,
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
            AI Evaluation: High confidence binding candidate
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.55 }}>
            The 4NQ-B ligand demonstrates favorable binding geometry with ΔG = −9.42 kcal/mol, placing it in the top 8th percentile of known inhibitors for this target. The H-bond network with Asp119 and Ser201 is consistent with known pharmacophore requirements. Recommend proceeding to wet lab validation.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-4)', flexShrink: 0 }}>
          <Info size={12} /> 94% confidence
        </div>
      </div>

      {/* Bridge CTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          href="/dashboard/wet-lab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--teal)',
            color: '#0F1117',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Generate wet lab validation protocol
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
