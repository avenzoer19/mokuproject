'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { tokens } from '@/components/lib/design-tokens';
import { createClient } from '@/lib/supabase/client';

function MoleculeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const NODE_COUNT = 60;
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: i % 5 === 0 ? 4.5 : 2.5,
      accent: i % 5 === 0,
    }));

    const LINK_DIST = 130;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56,181,172,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent
          ? tokens.teal
          : `rgba(78,205,196,0.25)`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function LandingPage() {
  const [ctaHref, setCtaHref] = useState('/auth');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCtaHref('/dashboard');
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F6F1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      color: '#1A1A18',
    }}>
      <MoleculeCanvas />

      {/* Corner crosshairs */}
      {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
        <div
          key={pos}
          style={{
            position: 'fixed',
            top: pos.includes('t') ? '24px' : 'auto',
            bottom: pos.includes('b') ? '24px' : 'auto',
            left: pos.includes('l') ? '24px' : 'auto',
            right: pos.includes('r') ? '24px' : 'auto',
            width: '24px',
            height: '24px',
            zIndex: 1,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(78,205,196,0.5)" strokeWidth="1.5">
            {pos.includes('l') && <line x1="0" y1="12" x2="12" y2="12" />}
            {pos.includes('r') && <line x1="12" y1="12" x2="24" y2="12" />}
            {pos.includes('t') && <line x1="12" y1="0" x2="12" y2="12" />}
            {pos.includes('b') && <line x1="12" y1="12" x2="12" y2="24" />}
          </svg>
        </div>
      ))}

      {/* Header nav */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: tokens.teal }}>
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="20" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
            <line x1="4" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <line x1="20" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <line x1="4" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <line x1="20" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
          </svg>
          <span style={{ fontWeight: 500, fontSize: '14px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1A1A18' }}>
            Moku
          </span>
        </div>
        <Link
          href={ctaHref}
          style={{
            fontSize: '13.5px',
            color: '#3A3A36',
            textDecoration: 'none',
            padding: '8px 20px',
            border: '1px solid rgba(56,181,172,0.3)',
            borderRadius: '8px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(78,205,196,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <h1 style={{
          fontSize: 'clamp(56px, 11.2vw, 196px)',
          fontWeight: 200,
          letterSpacing: '-0.045em',
          lineHeight: 0.9,
          color: '#1A1A18',
          marginBottom: '32px',
          userSelect: 'none',
        }}>
          Moku <em style={{ fontStyle: 'italic', color: tokens.tealDeep }}>for</em> Research
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 20px)',
          color: '#6E6B63',
          fontWeight: 300,
          lineHeight: 1.7,
          maxWidth: '520px',
          margin: '0 auto 40px',
        }}>
          Literature, experiments, computation, and writing — unified in one intelligent research workspace.
        </p>

        <Link
          href={ctaHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 32px',
            background: tokens.teal,
            color: '#0F1117',
            borderRadius: '50px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 500,
            transition: 'all 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = tokens.tealDeep;
            el.style.transform = 'translateY(-1px)';
            el.style.boxShadow = '0 12px 30px rgba(78,205,196,0.35)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = tokens.teal;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = 'none';
          }}
        >
          Open workspace <ArrowRight size={18} />
        </Link>
      </div>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: '24px',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: 2,
      }}>
        {/* Feature badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Literature', 'Datasets', 'Analysis', 'Writing'].map(badge => (
            <span key={badge} style={{
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(78,205,196,0.08)',
              border: '1px solid rgba(78,205,196,0.2)',
              color: '#6E6B63',
              letterSpacing: '0.04em',
            }}>
              {badge}
            </span>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '11px',
          color: '#A8A49A',
          letterSpacing: '0.06em',
        }}>
          <span>1.2345° N, 36.8219° E</span>
          <span>·</span>
          <span>v1.0 — 2025</span>
          <span>·</span>
          <span>Moku for Research</span>
        </div>
      </footer>
    </div>
  );
}
