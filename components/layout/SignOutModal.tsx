'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useSignOut } from '@/components/providers/AppProviders';
import { createClient } from '@/lib/supabase/client';

export default function SignOutModal() {
  const router = useRouter();
  const { signOutModalOpen, closeSignOutModal } = useSignOut();

  const handleSignOut = async () => {
    closeSignOutModal();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (!signOutModalOpen) return null;

  return (
    <>
      <div
        onClick={closeSignOutModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(440px, 92vw)',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow)',
        zIndex: 101,
        padding: '32px',
        animation: 'fade-in 0.15s ease',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'rgba(229,86,75,0.12)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: '20px',
        }}>
          <LogOut size={22} style={{ color: 'var(--red)' }} />
        </div>

        <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
          Leave your workspace?
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '28px' }}>
          Are you sure you want to sign out? Your work is auto-saved and will be waiting when you return.
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={closeSignOutModal}
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--text-2)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--red)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
