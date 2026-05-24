'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ZoomIn, ZoomOut, RotateCcw, Tag, Sparkles,
  Download, X, ChevronUp, FileText,
} from 'lucide-react';

// ─────────────────────────── Data ───────────────────────────

type NodeType = 'paper' | 'gap';

interface GraphNode { id: string; label: string; type: NodeType; x: number; y: number; z: number; }
interface GraphEdge { from: string; to: string; strength: number; }
interface GapCardData {
  id: string; title: string; explanation: string;
  confidence: number; connectedTo: string[];
}

const PAPER_NODES: GraphNode[] = [
  { id: 'p1', label: 'Electrospun PCL/PVP Composite Scaffolds for Wound Regeneration',     type: 'paper', x:  0.05, y:  0.55, z:  0.30 },
  { id: 'p2', label: 'Hydrophilic PVP Additives Modulate Fiber Morphology',                type: 'paper', x: -0.60, y: -0.20, z:  0.42 },
  { id: 'p3', label: 'Systematic Review of Scaffold Porosity in Skin Tissue Engineering',  type: 'paper', x:  0.68, y: -0.28, z: -0.22 },
  { id: 'p4', label: 'Crosslinking Strategies for Biodegradable Polyester Nanofibers',     type: 'paper', x: -0.42, y:  0.60, z: -0.52 },
  { id: 'p5', label: 'Murine Excisional Wound Models: Methodological Appraisal',           type: 'paper', x:  0.52, y:  0.40, z:  0.60 },
  { id: 'p6', label: 'Drug-loaded Electrospun Mats: PVP Carriers to Controlled Release',   type: 'paper', x: -0.68, y:  0.12, z: -0.32 },
  { id: 'p7', label: 'Mechanical Characterisation of Nanofibrous Scaffolds',               type: 'paper', x:  0.22, y: -0.68, z:  0.12 },
  { id: 'p8', label: 'Cervical Cancer Drug Delivery via Mucoadhesive Polymer Patches',     type: 'paper', x: -0.22, y: -0.52, z: -0.60 },
];

const GAP_NODES: GraphNode[] = [
  { id: 'g1', label: 'Gap: Sustained drug release in mucosal patch format for cervical cancer therapy',  type: 'gap', x:  0.10, y: -0.08, z:  0.48 },
  { id: 'g2', label: 'Gap: Long-term aptamer stability in coaxial nanofiber systems',                    type: 'gap', x: -0.28, y:  0.30, z: -0.10 },
];

const ALL_NODES: GraphNode[] = [...PAPER_NODES, ...GAP_NODES];

const EDGES: GraphEdge[] = [
  { from: 'p1', to: 'p2', strength: 0.90 },
  { from: 'p1', to: 'p3', strength: 0.72 },
  { from: 'p1', to: 'p6', strength: 0.85 },
  { from: 'p1', to: 'p5', strength: 0.65 },
  { from: 'p2', to: 'p4', strength: 0.62 },
  { from: 'p3', to: 'p7', strength: 0.76 },
  { from: 'p4', to: 'p6', strength: 0.50 },
  { from: 'p6', to: 'p8', strength: 0.80 },
  { from: 'p7', to: 'p4', strength: 0.55 },
  { from: 'p3', to: 'g1', strength: 0.58 },
  { from: 'p8', to: 'g1', strength: 0.94 },
  { from: 'p6', to: 'g1', strength: 0.80 },
  { from: 'p2', to: 'g2', strength: 0.86 },
  { from: 'p4', to: 'g2', strength: 0.72 },
  { from: 'p5', to: 'g2', strength: 0.40 },
  { from: 'g1', to: 'g2', strength: 0.44 },
];

const GAP_CARDS: GapCardData[] = [
  {
    id: 'g1',
    title: 'Sustained Drug Release in Mucosal Patch Format for Cervical Cancer Therapy',
    explanation: 'Current literature covers electrospun nanofiber scaffolds for wound healing extensively, but no study addresses sustained, localised drug delivery via mucoadhesive patches targeting cervical tissue microenvironments.',
    confidence: 87,
    connectedTo: ['p8', 'p6', 'p3'],
  },
  {
    id: 'g2',
    title: 'Long-term Aptamer Stability in Coaxial Nanofiber Systems',
    explanation: 'While aptamer-functionalised carriers are explored broadly, the intersection of coaxial electrospinning and aptamer degradation kinetics over 90+ day timescales remains largely uncharted in the biomaterials literature.',
    confidence: 79,
    connectedTo: ['p2', 'p4', 'p5'],
  },
  {
    id: 'g3',
    title: 'Mechanical–Biological Synergy in Hybrid Scaffold Optimisation',
    explanation: 'Mechanical characterisation and biocompatibility studies exist in parallel, but no framework systematically optimises the trade-off between tensile strength and cellular infiltration in PCL composite scaffolds.',
    confidence: 71,
    connectedTo: ['p7', 'p1', 'p3'],
  },
];

const COVERED_THEMES = [
  { label: 'PCL Electrospinning',       type: 'covered'      },
  { label: 'PVP Blending',              type: 'covered'      },
  { label: 'Wound Healing In Vivo',     type: 'covered'      },
  { label: 'Fiber Morphology',          type: 'covered'      },
  { label: 'Scaffold Porosity',         type: 'covered'      },
  { label: 'UV Crosslinking',           type: 'covered'      },
  { label: 'Tensile Characterisation',  type: 'covered'      },
  { label: 'Mucoadhesive Delivery',     type: 'underexplored'},
  { label: 'Aptamer–Nanofiber Systems', type: 'underexplored'},
  { label: 'Cervical Tissue Targeting', type: 'underexplored'},
  { label: 'Coaxial Stability',         type: 'underexplored'},
];

// ─────────────────────────── 3D Projection ───────────────────────────

interface Projected {
  id: string; label: string; type: NodeType;
  sx: number; sy: number; sr: number; depth: number;
}

function project3D(
  node: GraphNode,
  rX: number, rY: number,
  zoomV: number,
  cx: number, cy: number
): Projected {
  let { x, y, z } = node;

  // Rotate Y
  const cosY = Math.cos(rY), sinY = Math.sin(rY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  x = x1; z = z1;

  // Rotate X
  const cosX = Math.cos(rX), sinX = Math.sin(rX);
  const y2 = y * cosX - z * sinX;
  const z2 = y * sinX + z * cosX;
  y = y2; z = z2;

  // Perspective projection
  const fov = 2.8;
  const scale = zoomV * 215;
  const w = 1 / (z + fov);
  return {
    id: node.id, label: node.label, type: node.type,
    sx: cx + x * scale * w,
    sy: cy + y * scale * w,
    sr: Math.max(5, 11 * w * zoomV * 2.8),
    depth: z,
  };
}

// ─────────────────────────── Page Component ───────────────────────────

export default function NeuralSynthesisPage() {
  // Mutable animation state (refs – no re-render cost)
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rotX           = useRef(0.18);
  const rotY           = useRef(0);
  const zoom           = useRef(1);
  const isDragging     = useRef(false);
  const lastPointer    = useRef({ x: 0, y: 0 });
  const mousePos       = useRef({ x: -9999, y: -9999 });
  const lastHovered    = useRef<string | null>(null);
  const rafId          = useRef(0);
  const tapStart       = useRef({ x: 0, y: 0, t: 0 });

  // React state
  const [hoveredNode,       setHoveredNode]       = useState<string | null>(null);
  const [highlightedNodes,  setHighlightedNodes]  = useState<string[]>([]);
  const [showLabels,        setShowLabels]        = useState(true);
  const [activeGap,         setActiveGap]         = useState<string | null>(null);
  const [sheetOpen,         setSheetOpen]         = useState(false);
  const [miniCard,          setMiniCard]          = useState<{ node: GraphNode; sx: number; sy: number } | null>(null);

  // AI gap analysis state
  const [aiGaps,       setAiGaps]       = useState<GapCardData[]>(GAP_CARDS);
  const [gapLoading,   setGapLoading]   = useState(false);
  const [gapAnalyzed,  setGapAnalyzed]  = useState(false);

  const runGapAnalysis = useCallback(async () => {
    if (gapLoading || gapAnalyzed) return;
    setGapLoading(true);
    try {
      const res = await fetch('/api/ai/gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          papers: PAPER_NODES.map(n => ({
            id: n.id,
            title: n.label,
            tags: [],
            year: 2023,
          })),
          field: 'Biomaterials / Tissue Engineering / Electrospun Scaffolds',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.gaps && Array.isArray(data.gaps)) {
          const mapped: GapCardData[] = data.gaps.map((g: { id: string; title: string; description: string; confidence: number; relatedPaperIds?: string[] }, i: number) => ({
            id: `g${i + 1}`,
            title: g.title,
            explanation: g.description,
            confidence: Math.min(98, Math.max(60, g.confidence)),
            connectedTo: g.relatedPaperIds ?? GAP_CARDS[i]?.connectedTo ?? [],
          }));
          setAiGaps(mapped);
          setGapAnalyzed(true);
        }
      }
    } catch {
      // Fall through — keep using static GAP_CARDS
    } finally {
      setGapLoading(false);
    }
  }, [gapLoading, gapAnalyzed]);

  // Refs synced to state for RAF reads
  const highlightedRef  = useRef<string[]>([]);
  const showLabelsRef   = useRef(true);
  useEffect(() => { highlightedRef.current = highlightedNodes; }, [highlightedNodes]);
  useEffect(() => { showLabelsRef.current  = showLabels;       }, [showLabels]);

  // ── Animation Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      if (!running) return;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const cx = W / 2;
      const cy = H / 2;

      if (!isDragging.current) rotY.current += 0.0022;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#0F1117';
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = 'rgba(35,39,52,0.55)';
      ctx.lineWidth = 0.5;
      const g = 42;
      for (let gx = 0; gx < W; gx += g) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += g) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Project
      const projected = ALL_NODES.map(n =>
        project3D(n, rotX.current, rotY.current, zoom.current, cx, cy)
      );
      const nodeMap: Record<string, Projected> = {};
      projected.forEach(n => { nodeMap[n.id] = n; });

      // Hover detection (update only on change)
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      let closestId: string | null = null;
      let closestDist = 30;
      projected.forEach(n => {
        const d = Math.hypot(n.sx - mx, n.sy - my);
        if (d < closestDist) { closestDist = d; closestId = n.id; }
      });
      if (closestId !== lastHovered.current) {
        lastHovered.current = closestId;
        setHoveredNode(closestId);
      }

      const highlighted = highlightedRef.current;
      const time = Date.now() / 1000;

      // Edges
      EDGES.forEach(({ from, to, strength }) => {
        const a = nodeMap[from], b = nodeMap[to];
        if (!a || !b) return;
        const bothHigh   = highlighted.length > 0 && highlighted.includes(from) && highlighted.includes(to);
        const dimmed     = highlighted.length > 0 && !bothHigh;
        const isGapEdge  = from.startsWith('g') || to.startsWith('g');
        const alpha      = dimmed ? 0.03 : bothHigh ? strength * 0.92 : strength * (isGapEdge ? 0.44 : 0.27);

        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = isGapEdge ? `rgba(255,215,0,${alpha})` : `rgba(78,205,196,${alpha})`;
        ctx.lineWidth = bothHigh ? 2.5 : 1;
        ctx.stroke();
      });

      // Nodes (back → front)
      [...projected]
        .sort((a, b) => a.depth - b.depth)
        .forEach(node => {
          const isHov  = closestId === node.id;
          const isHigh = highlighted.includes(node.id);
          const dimmed = highlighted.length > 0 && !isHigh && !isHov;

          if (node.type === 'gap') {
            const pulse = Math.sin(time * 2.2 + (node.id === 'g1' ? 0 : Math.PI * 0.7)) * 0.5 + 0.5;

            if (!dimmed) {
              [3, 2, 1].forEach(ring => {
                const grd = ctx.createRadialGradient(
                  node.sx, node.sy, node.sr * 0.3,
                  node.sx, node.sy, node.sr * (1.6 + ring * 0.85)
                );
                grd.addColorStop(0, `rgba(255,215,0,${(0.22 + pulse * 0.14) / ring})`);
                grd.addColorStop(1, 'rgba(255,215,0,0)');
                ctx.beginPath();
                ctx.arc(node.sx, node.sy, node.sr * (1.6 + ring * 0.85), 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
              });
            }

            ctx.beginPath();
            ctx.arc(node.sx, node.sy, node.sr, 0, Math.PI * 2);
            ctx.fillStyle = dimmed
              ? 'rgba(255,215,0,0.11)'
              : `rgba(255,${(190 + pulse * 24) | 0},0,${0.78 + pulse * 0.22})`;
            ctx.fill();
            if (isHov || isHigh) {
              ctx.strokeStyle = '#FFD700';
              ctx.lineWidth = 2.5;
              ctx.stroke();
            }
          } else {
            ctx.beginPath();
            ctx.arc(node.sx, node.sy, node.sr, 0, Math.PI * 2);
            ctx.fillStyle = isHigh
              ? `rgba(78,205,196,${dimmed ? 0.1 : 0.78})`
              : dimmed
                ? 'rgba(85,93,115,0.18)'
                : isHov
                  ? 'rgba(165,172,198,0.92)'
                  : 'rgba(100,108,136,0.65)';
            ctx.fill();
            if (isHov || isHigh) {
              ctx.strokeStyle = isHigh ? '#4ECDC4' : 'rgba(200,208,228,0.85)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }

          // Labels
          const showLabel = showLabelsRef.current || isHov || isHigh;
          if (showLabel && !dimmed) {
            const short = node.label.length > 36 ? node.label.slice(0, 36) + '…' : node.label;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.shadowColor = '#0F1117';
            ctx.shadowBlur = 10;
            ctx.fillStyle = node.type === 'gap' ? '#FFD700' : '#96A0BC';
            ctx.font = `${isHov ? '11.5' : '9.5'}px -apple-system,system-ui,sans-serif`;
            ctx.fillText(short, node.sx, node.sy + node.sr + 13);
            ctx.restore();
          }
        });

      ctx.restore();
      rafId.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(rafId.current);
      ro.disconnect();
    };
  }, []);

  // ── Pointer handlers ──
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    lastPointer.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    rotY.current += dx * 0.007;
    rotX.current  = Math.max(-1.2, Math.min(1.2, rotX.current + dy * 0.007));
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    // Detect tap (< 200ms, < 8px movement)
    const dt = Date.now() - tapStart.current.t;
    const dist = Math.hypot(e.clientX - tapStart.current.x, e.clientY - tapStart.current.y);
    if (dt < 250 && dist < 8 && lastHovered.current) {
      const tapped = ALL_NODES.find(n => n.id === lastHovered.current);
      if (tapped) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setMiniCard({ node: tapped, sx: e.clientX - rect.left, sy: e.clientY - rect.top });
      }
    }
  }, []);

  const onPointerLeave = useCallback(() => {
    mousePos.current = { x: -9999, y: -9999 };
    isDragging.current = false;
  }, []);

  // ── Controls ──
  const handleZoomIn  = () => { zoom.current = Math.min(3,   zoom.current * 1.28); };
  const handleZoomOut = () => { zoom.current = Math.max(0.3, zoom.current / 1.28); };
  const handleReset   = () => { zoom.current = 1; rotX.current = 0.18; rotY.current = 0; };

  const handleExploreGap = (card: GapCardData) => {
    if (activeGap === card.id) {
      setHighlightedNodes([]);
      setActiveGap(null);
    } else {
      setHighlightedNodes([card.id, ...card.connectedTo]);
      setActiveGap(card.id);
    }
    setMiniCard(null);
  };

  // Hovered node data for tooltip
  const hoveredData = hoveredNode ? ALL_NODES.find(n => n.id === hoveredNode) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: 'var(--text-4)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.07em', marginBottom: '8px', textTransform: 'uppercase' }}>
          <span>Moku</span>
          <span>›</span>
          <Link href="/dashboard/library" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Library</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-2)' }}>Neural Synthesis</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '21px', fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.022em', margin: 0, lineHeight: 1.2 }}>
              Neural Synthesis <em style={{ color: 'var(--teal)', fontStyle: 'italic' }}>&</em> Gap Finder
            </h1>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '3px' }}>
              8 papers indexed · 3 research gaps detected · AI confidence 79–87%
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '10px', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.06em', color: 'var(--text-3)', paddingBottom: '2px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(100,108,136,0.7)', display: 'inline-block' }} />
              PAPER
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FFD700', display: 'inline-block', boxShadow: '0 0 6px rgba(255,215,0,0.7)' }} />
              GAP NODE
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '22px', height: '1.5px', background: 'rgba(78,205,196,0.5)', display: 'inline-block' }} />
              CONNECTION
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-panel body ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '60% 1fr',
        flex: 1,
        minHeight: 0,
        margin: '10px 12px 12px',
        gap: '10px',
      }}>

        {/* ── LEFT: 3D Graph Canvas ── */}
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#0F1117', border: '1px solid var(--line)' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
          />

          {/* Hover Tooltip */}
          {hoveredData && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(20,23,31,0.96)',
              border: `1px solid ${hoveredData.type === 'gap' ? 'rgba(255,215,0,0.45)' : 'var(--line)'}`,
              borderRadius: '10px',
              padding: '8px 14px',
              maxWidth: '300px',
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)',
              zIndex: 10,
            }}>
              {hoveredData.type === 'gap' && (
                <div style={{ fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.12em', color: '#FFD700', marginBottom: '3px', textTransform: 'uppercase' }}>
                  ⬡ Research Gap
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.45 }}>{hoveredData.label}</div>
            </div>
          )}

          {/* Mini card on tap */}
          {miniCard && (
            <div style={{
              position: 'absolute',
              left: Math.min(miniCard.sx + 12, (canvasRef.current?.offsetWidth ?? 400) - 220),
              top: Math.max(miniCard.sy - 80, 8),
              width: '210px',
              background: 'rgba(20,23,31,0.97)',
              border: `1px solid ${miniCard.node.type === 'gap' ? 'rgba(255,215,0,0.5)' : 'var(--line)'}`,
              borderRadius: '12px',
              padding: '12px',
              zIndex: 20,
              backdropFilter: 'blur(10px)',
            }}>
              <button
                onClick={() => setMiniCard(null)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '2px', display: 'grid', placeItems: 'center' }}
              >
                <X size={12} />
              </button>
              {miniCard.node.type === 'gap' && (
                <div style={{ fontSize: '9px', color: '#FFD700', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '4px', textTransform: 'uppercase' }}>⬡ Research Gap</div>
              )}
              <div style={{ fontSize: '11.5px', color: 'var(--text)', lineHeight: 1.4, marginBottom: '10px', paddingRight: '16px' }}>{miniCard.node.label}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                {EDGES.filter(e => e.from === miniCard.node.id || e.to === miniCard.node.id).length} connections
              </div>
              {miniCard.node.type === 'gap' && (
                <button
                  onClick={() => {
                    const card = aiGaps.find(c => c.id === miniCard.node.id);
                    if (card) handleExploreGap(card);
                    setMiniCard(null);
                  }}
                  style={{ marginTop: '8px', width: '100%', height: '28px', borderRadius: '7px', border: '1px solid rgba(255,215,0,0.4)', background: 'rgba(255,215,0,0.08)', color: '#FFD700', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
                >
                  Explore Gap →
                </button>
              )}
            </div>
          )}

          {/* Controls (bottom-left) */}
          <div style={{ position: 'absolute', bottom: '14px', left: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { icon: <ZoomIn size={13} />,   fn: handleZoomIn,  title: 'Zoom in',       active: false },
              { icon: <ZoomOut size={13} />,  fn: handleZoomOut, title: 'Zoom out',      active: false },
              { icon: <RotateCcw size={13} />,fn: handleReset,   title: 'Reset view',    active: false },
              { icon: <Tag size={13} />,       fn: () => setShowLabels(v => !v), title: showLabels ? 'Hide labels' : 'Show labels', active: showLabels },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.fn}
                title={btn.title}
                style={{
                  width: '30px', height: '30px',
                  borderRadius: '8px',
                  border: `1px solid ${btn.active ? 'var(--teal)' : 'rgba(50,55,72,0.85)'}`,
                  background: btn.active ? 'rgba(78,205,196,0.12)' : 'rgba(15,17,23,0.85)',
                  color: btn.active ? 'var(--teal)' : 'rgba(130,140,165,0.9)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s',
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Stats badge (bottom-right) */}
          <div style={{
            position: 'absolute', bottom: '14px', right: '14px',
            background: 'rgba(15,17,23,0.85)',
            border: '1px solid rgba(50,55,72,0.85)',
            borderRadius: '8px',
            padding: '5px 11px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: 'var(--text-3)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span><span style={{ color: 'rgba(100,108,136,0.8)' }}>●</span> 8</span>
            <span><span style={{ color: '#FFD700' }}>●</span> 2 gaps</span>
            <span style={{ color: 'rgba(78,205,196,0.6)' }}>— {EDGES.length} links</span>
          </div>
        </div>

        {/* ── RIGHT: Gap Detection Panel ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--line)',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--line-soft)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} style={{ color: '#FFD700' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Research Gaps Detected</span>
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(255,215,0,0.1)',
                color: '#FFD700',
                border: '1px solid rgba(255,215,0,0.28)',
                borderRadius: '20px',
                padding: '1px 9px',
                fontSize: '11px',
                fontWeight: 600,
              }}>3</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '3px' }}>
              AI-analysed from 8 uploaded papers
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* AI Analysis CTA */}
            <button
              onClick={runGapAnalysis}
              disabled={gapLoading || gapAnalyzed}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                height: '34px', borderRadius: '9px',
                border: gapAnalyzed ? '1px solid rgba(78,205,196,0.3)' : '1px solid var(--teal)',
                background: gapAnalyzed ? 'var(--teal-soft)' : 'var(--teal)',
                color: gapAnalyzed ? 'var(--teal)' : '#0F1117',
                fontSize: '12px', fontWeight: 500, cursor: gapLoading || gapAnalyzed ? 'default' : 'pointer',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Sparkles size={13} style={{ animation: gapLoading ? 'spin 1.5s linear infinite' : 'none' }} />
              {gapLoading ? 'Analyzing with Claude…' : gapAnalyzed ? '✓ AI Analysis Complete' : 'Analyze Gaps with Claude AI'}
            </button>

            {/* Gap Cards */}
            {aiGaps.map((card, idx) => {
              const isActive  = activeGap === card.id;
              const isGold    = idx < 2;
              return (
                <div
                  key={card.id}
                  style={{
                    borderRadius: '12px',
                    border: `1px solid ${isActive ? 'rgba(255,215,0,0.42)' : 'var(--line)'}`,
                    background: isActive ? 'rgba(255,215,0,0.035)' : 'var(--surface-2)',
                    padding: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.07em',
                      color: isGold ? '#FFD700' : 'var(--text-3)',
                      border: `1px solid ${isGold ? 'rgba(255,215,0,0.32)' : 'var(--line)'}`,
                      borderRadius: '4px',
                      padding: '2px 6px',
                      flexShrink: 0,
                      marginTop: '1px',
                      textTransform: 'uppercase',
                    }}>
                      {isGold ? '⬡ Gap' : '◈ Gap'}
                    </span>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 }}>
                      {card.title}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.65, marginBottom: '10px' }}>
                    {card.explanation}
                  </div>

                  {/* Confidence */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Confidence</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: isGold ? '#FFD700' : 'var(--text-2)', fontFamily: 'monospace' }}>{card.confidence}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${card.confidence}%`,
                        background: isGold
                          ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                          : 'linear-gradient(90deg, var(--teal), var(--teal-deep))',
                        borderRadius: '4px',
                      }} />
                    </div>
                  </div>

                  {/* Explore button */}
                  <button
                    onClick={() => handleExploreGap(card)}
                    style={{
                      width: '100%',
                      height: '30px',
                      borderRadius: '8px',
                      border: `1px solid ${isActive ? 'rgba(255,215,0,0.45)' : 'var(--line)'}`,
                      background: isActive ? 'rgba(255,215,0,0.08)' : 'transparent',
                      color: isActive ? '#FFD700' : 'var(--text-3)',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {isActive ? (
                      <><X size={11} /> Deselect</>
                    ) : (
                      <>Explore Gap →</>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Covered Themes */}
            <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: '9px', textTransform: 'uppercase' }}>
                Covered Themes
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {COVERED_THEMES.map(theme => (
                  <span
                    key={theme.label}
                    style={{
                      fontSize: '10.5px',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      border: theme.type === 'covered'
                        ? '1px solid var(--line)'
                        : '1px solid rgba(255,215,0,0.32)',
                      background: theme.type === 'covered'
                        ? 'var(--surface-3)'
                        : 'rgba(255,215,0,0.06)',
                      color: theme.type === 'covered' ? 'var(--text-3)' : '#FFD700',
                      lineHeight: 1.4,
                    }}
                  >
                    {theme.type === 'underexplored' && '⬡ '}
                    {theme.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Export footer */}
          <div style={{ padding: '10px', borderTop: '1px solid var(--line-soft)', flexShrink: 0, display: 'flex', gap: '7px' }}>
            {[
              { label: 'PDF',      icon: <FileText size={13} /> },
              { label: 'Markdown', icon: <Download size={13} /> },
            ].map(btn => (
              <button
                key={btn.label}
                style={{
                  flex: 1,
                  height: '36px',
                  borderRadius: '9px',
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--text-3)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'var(--surface-2)';
                  el.style.color = 'var(--text)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.color = 'var(--text-3)';
                }}
              >
                {btn.icon} Export {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile: bottom sheet toggle ── */}
      <button
        onClick={() => setSheetOpen(v => !v)}
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: '72px',
          right: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255,215,0,0.12)',
          border: '1px solid rgba(255,215,0,0.35)',
          color: '#FFD700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(255,215,0,0.15)',
          zIndex: 30,
        }}
      >
        <Sparkles size={18} />
      </button>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          <div onClick={() => setSheetOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid var(--line)',
            maxHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: '#FFD700' }} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Research Gaps (3)</span>
              </div>
              <button onClick={() => setSheetOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'grid', placeItems: 'center' }}>
                <ChevronUp size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiGaps.map(card => (
                <div key={card.id} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>{card.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)' }}>
                    <span style={{ fontFamily: 'monospace' }}>Confidence</span>
                    <span style={{ color: '#FFD700', fontWeight: 600 }}>{card.confidence}%</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${card.confidence}%`, background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
