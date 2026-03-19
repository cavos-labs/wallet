'use client';

import { useCavos } from '@cavos/react';
import { LoginScreen } from './components/LoginScreen';
import { WalletDashboard } from './components/WalletDashboard';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { isAuthenticated, isLoading, openModal } = useCavos();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Spinner */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <circle cx="16" cy="16" r="13" stroke="rgba(242,240,236,0.1)" strokeWidth="2.5" />
          <path
            d="M16 3a13 13 0 0113 13"
            stroke="rgba(242,240,236,0.7)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          Loading wallet…
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onConnect={openModal} isLoading={isLoading} />;
  }

  return <WalletDashboard />;
}
