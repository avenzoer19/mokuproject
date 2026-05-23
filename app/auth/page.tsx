'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { tokens } from '@/components/lib/design-tokens';
import { createClient } from '@/lib/supabase/client';

function MoleculeCanvas({ dark = true }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const NODE_COUNT = 50;
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: i % 5 === 0 ? 5 : 3,
      accent: i % 5 === 0,
    }));

    const LINK_DIST = 110;
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
            const alpha = (1 - dist / LINK_DIST) * 0.3;
            ctx.beginPath();
            ctx.strokeStyle = dark
              ? `rgba(78,205,196,${alpha})`
              : `rgba(56,181,172,${alpha})`;
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
          : dark
            ? `rgba(78,205,196,0.4)`
            : `rgba(56,181,172,0.3)`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

function FloatingLabelInput({
  label, type = 'text', value, onChange,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div style={{ position: 'relative', paddingTop: '20px' }}>
      <label style={{
        position: 'absolute',
        left: 0,
        top: raised ? '0px' : '26px',
        fontSize: raised ? '11px' : '14px',
        color: focused ? 'var(--teal)' : 'var(--text-3)',
        transition: 'all 0.2s ease',
        pointerEvents: 'none',
        fontFamily: 'var(--font-geist-sans)',
        fontWeight: raised ? 500 : 300,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: `1.5px solid ${focused ? 'var(--teal)' : 'var(--line)'}`,
          padding: '8px 0',
          color: 'var(--text)',
          fontSize: '14px',
          outline: 'none',
          fontFamily: 'var(--font-geist-sans)',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  );
}

const QUOTES = [
  { text: 'Somewhere, something incredible is waiting to be known.', author: 'Carl Sagan' },
  { text: 'Imagination is more important than knowledge.', author: 'Albert Einstein' },
  { text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie' },
  { text: 'If I have seen further it is by standing on the shoulders of Giants.', author: 'Isaac Newton' },
  { text: 'Above all, don\'t fear difficult moments. The best comes from them.', author: 'Rita Levi-Montalcini' },
];

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length);
        setQuoteVisible(true);
      }, 400);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.push('/dashboard');
        router.refresh();
      } else {
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) { setError(error.message); return; }
        setError('');
        // Show confirmation message — email verification may be required
        alert('Account created! Check your email to confirm your account, then sign in.');
        setMode('signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setResetSent(true);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      overflow: 'hidden',
    }}>
      {/* Left — dark canvas + quotes */}
      <div style={{
        position: 'relative',
        background: tokens.dark.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '48px',
        overflow: 'hidden',
      }}>
        <MoleculeCanvas dark={true} />

        {/* Moku wordmark */}
        <div style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: tokens.teal }}>
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
          <span style={{ fontWeight: 500, fontSize: '15px', letterSpacing: '0.15em', textTransform: 'uppercase', color: tokens.dark.text }}>
            Moku
          </span>
        </div>

        {/* Quote */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          opacity: quoteVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          <div style={{
            fontSize: '20px',
            fontFamily: 'Spectral, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 300,
            color: tokens.dark.text,
            lineHeight: 1.55,
            marginBottom: '14px',
          }}>
            &ldquo;{QUOTES[quoteIdx].text}&rdquo;
          </div>
          <div style={{ fontSize: '13px', color: tokens.dark.text3, letterSpacing: '0.06em' }}>
            — {QUOTES[quoteIdx].author}
          </div>
        </div>

        {/* Quote dots */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: '6px',
          marginTop: '20px',
        }}>
          {QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setQuoteIdx(i); setQuoteVisible(true); }}
              style={{
                width: i === quoteIdx ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === quoteIdx ? tokens.teal : tokens.dark.text4,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Right — auth form */}
      <div style={{
        background: 'var(--bg-2)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 64px',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '36px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: '4px',
              left: mode === 'signin' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
              bottom: '4px',
              background: 'var(--surface-2)',
              borderRadius: '9px',
              border: '1px solid var(--line)',
              transition: 'left 0.25s ease',
            }} />
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13.5px',
                  fontWeight: mode === m ? 500 : 300,
                  color: mode === m ? 'var(--text)' : 'var(--text-3)',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'color 0.2s',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Forgot password flow */}
          {forgotMode ? (
            <div>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <svg viewBox="0 0 48 48" style={{ width: '56px', height: '56px', margin: '0 auto 16px' }}>
                    <circle cx="24" cy="24" r="22" fill="rgba(111,191,138,0.12)" stroke="var(--success)" strokeWidth="1.5" />
                    <polyline
                      points="14,24 21,31 34,18"
                      stroke="var(--success)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="40"
                      strokeDashoffset="0"
                      style={{ animation: 'draw-check 0.5s ease forwards' }}
                    />
                  </svg>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                    Check your inbox
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-3)', marginBottom: '24px' }}>
                    A reset link was sent to {resetEmail}
                  </div>
                  <button
                    onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(''); }}
                    style={{ color: 'var(--teal)', background: 'none', border: 'none', fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>Reset password</div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-3)', marginBottom: '28px' }}>
                    Enter your email address and we&apos;ll send you a reset link.
                  </div>
                  <FloatingLabelInput label="Email address" type="email" value={resetEmail} onChange={setResetEmail} />
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    style={{ width: '100%', height: '44px', background: 'var(--teal)', border: 'none', borderRadius: '10px', color: '#0F1117', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '28px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send reset link'}
                  </button>
                  <button
                    onClick={() => setForgotMode(false)}
                    style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-3)', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '22px', fontWeight: 300, color: 'var(--text)', marginBottom: '6px' }}>
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '32px' }}>
                {mode === 'signin' ? 'Sign in to your Moku workspace' : 'Start your research journey'}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {mode === 'signup' && (
                  <FloatingLabelInput label="Full name" value={name} onChange={setName} />
                )}
                <FloatingLabelInput label="Email address" type="email" value={email} onChange={setEmail} />

                {/* Password with show/hide */}
                <div style={{ position: 'relative', paddingTop: '20px' }}>
                  <FloatingLabelInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '26px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-3)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'var(--font-geist-mono)',
                      padding: '8px 0',
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <FloatingLabelInput label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
                )}

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    style={{ textAlign: 'right', background: 'none', border: 'none', color: 'var(--teal)', fontSize: '12.5px', cursor: 'pointer', padding: 0, marginTop: '-8px' }}
                  >
                    Forgot password?
                  </button>
                )}

                {error && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(229,86,75,0.10)',
                    border: '1px solid rgba(229,86,75,0.35)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#E5564B',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: '44px',
                    background: 'var(--teal)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#0F1117',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '8px',
                    transition: 'opacity 0.15s',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-4)' }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              </div>

              {/* SSO buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Google */}
                <button style={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text-2)',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Institutional */}
                <button style={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text-2)',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--teal)' }}>
                    <path d="M3 10L12 3l9 7v10a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1V10z" />
                    <rect x="10" y="14" width="4" height="4" />
                  </svg>
                  Institutional (.edu) Login
                </button>

                {/* ORCID */}
                <button style={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text-2)',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="#A6CE39" />
                    <text x="7" y="16" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">iD</text>
                  </svg>
                  ORCID iD
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
