'use client';

import { useSidebar } from '@/components/providers/AppProviders';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import CopilotPanel from '@/components/layout/CopilotPanel';
import SignOutModal from '@/components/layout/SignOutModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebar } = useSidebar();

  return (
    <>
      <div className="app" data-sidebar={sidebar}>
        {/* Sidebar — hidden on mobile */}
        <div className="hidden lg:contents">
          <Sidebar />
        </div>

        <TopBar />

        <main style={{
          gridColumn: '2',
          gridRow: '2',
          overflow: 'hidden',
          minHeight: 0,
          background: 'var(--bg)',
          position: 'relative',
          display: 'grid',
          gridTemplateRows: '1fr',
        }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* AI Copilot panel */}
      <CopilotPanel />

      {/* Sign-out confirm modal */}
      <SignOutModal />

      {/* Mobile: hide sidebar columns on small screens */}
      <style>{`
        @media (max-width: 1023px) {
          .app {
            --sb-w: 0px !important;
            grid-template-columns: 0 1fr !important;
          }
        }
        @media (max-width: 1023px) {
          main { padding-bottom: 64px; }
        }
      `}</style>
    </>
  );
}
