'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { tokens } from '@/components/lib/design-tokens';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/* ── Molecule canvas (reused from auth page) ─────────────────── */
function MoleculeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const nodes = Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: i % 5 === 0 ? 4.5 : 2.5, accent: i % 5 === 0,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < 110) {
          ctx.beginPath(); ctx.strokeStyle = `rgba(78,205,196,${(1 - d / 110) * 0.3})`; ctx.lineWidth = 0.8;
          ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent ? tokens.teal : 'rgba(78,205,196,0.4)'; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ── Floating label input (same pattern as auth page) ─────────── */
function FloatingLabelInput({ label, type = 'text', value, onChange }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;
  return (
    <div style={{ position: 'relative', paddingTop: '20px' }}>
      <label style={{ position: 'absolute', left: 0, top: raised ? '0px' : '26px', fontSize: raised ? '11px' : '14px', color: focused ? 'var(--teal)' : 'var(--text-3)', transition: 'all 0.2s ease', pointerEvents: 'none', fontWeight: raised ? 500 : 300 }}>
        {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${focused ? 'var(--teal)' : 'var(--line)'}`, padding: '8px 0', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-geist-sans)', transition: 'border-color 0.2s' }}
      />
    </div>
  );
}

/* ── Password strength indicator ─────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#E5564B', '#E0A957', '#4ECDC4', '#6FBF8A'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= score ? colors[score] : 'var(--line)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: colors[score] ?? 'var(--text-4)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.04em' }}>
        {labels[score]}
      </span>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
type Status = 'loading' | 'ready' | 'success' | 'expired';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  /* Detect PASSWORD_RECOVERY session from the Supabase email link */
  useEffect(() => {
    const supabase = createClient();

    // Fallback: if no recovery event within 4s, mark as expired
    const expireTimer = setTimeout(() => setStatus('expired'), 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        clearTimeout(expireTimer);
        setStatus('ready');
      }
    });

    // Also handle case where user already has an active session from the hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        clearTimeout(expireTimer);
        setStatus('ready');
      }
    });

    return () => { clearTimeout(expireTimer); subscription.unsubscribe(); };
  }, []);

  /* Countdown redirect after success */
  useEffect(() => {
    if (status !== 'success') return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); router.push('/auth'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message); return; }
    setStatus('success');
  };

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}
      data-theme="dark"
    >
      {/* Left — dark canvas */}
      <div style={{ position: 'relative', background: tokens.dark.sidebarBg, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px', overflow: 'hidden' }}>
        <MoleculeCanvas />
        <div style={{ position: 'absolute', top: '32px', left: '40px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '13px', color: tokens.dark.text3, lineHeight: 1.7, maxWidth: '320px' }}>
            Your research workspace is waiting. Set a strong password to keep your work secure.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{ background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 64px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--teal)', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>Verifying your reset link…</p>
            </div>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(229,86,75,0.1)', border: '1px solid rgba(229,86,75,0.25)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--red)' }}>
                <ShieldAlert size={24} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' }}>Link expired or invalid</div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '28px' }}>
                This password reset link has expired or already been used. Reset links are valid for 1 hour.
              </p>
              <Link href="/auth"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: 'var(--teal)', color: '#0F1117', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
              >
                <ArrowLeft size={15} /> Request a new link
              </Link>
            </div>
          )}

          {/* Form */}
          {status === 'ready' && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '22px', fontWeight: 300, color: 'var(--text)', marginBottom: '6px' }}>Set new password</div>
                <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>Choose a strong password for your Moku account.</div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>

                {/* Password + show/hide */}
                <div>
                  <div style={{ position: 'relative', paddingTop: '20px' }}>
                    <FloatingLabelInput
                      label="New password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 0, top: '26px', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '8px 0' }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <FloatingLabelInput label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} />

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(229,86,75,0.10)', border: '1px solid rgba(229,86,75,0.35)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ height: '44px', background: 'var(--teal)', border: 'none', borderRadius: '10px', color: '#0F1117', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', transition: 'opacity 0.15s' }}>
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</> : 'Update password'}
                </button>
              </form>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Link href="/auth" style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
              </div>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '24px 0', animation: 'fade-in 0.3s ease' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 20px' }}>
                <svg viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="30" fill="rgba(111,191,138,0.1)" stroke="var(--success)" strokeWidth="1.5" />
                  <polyline points="18,32 28,42 46,22"
                    stroke="var(--success)" strokeWidth="3" fill="none"
                    strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="48" strokeDashoffset="0"
                    style={{ animation: 'draw-check 0.5s ease forwards' }}
                  />
                </svg>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
                Password updated!
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.7, marginBottom: '24px' }}>
                Your new password is active. Redirecting you to sign in in {countdown}s…
              </p>
              <Link href="/auth"
                style={{ fontSize: '13px', color: 'var(--teal)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Sign in now <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
          }
          div[style*="justify-content: flex-end"][style*="padding: 48px"] {
            padding: 32px 24px !important;
            min-height: 160px !important;
          }
        }
      `}</style>
    </div>
  );
}
