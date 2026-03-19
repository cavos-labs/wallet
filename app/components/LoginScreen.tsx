'use client';

import Image from 'next/image';

interface LoginScreenProps {
  onConnect: () => void;
  isLoading: boolean;
}

export function LoginScreen({ onConnect, isLoading }: LoginScreenProps) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 48px', maxWidth: '430px', margin: '0 auto' }}>

      {/* Logo */}
      <div style={{ paddingTop: '56px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Image src="/icon-black.png" alt="Cavos" width={28} height={28} style={{ filter: 'invert(1)', opacity: 0.8 }} />
        <span style={{ fontFamily: 'ui-monospace, SF Mono, monospace', fontSize: '13px', letterSpacing: '0.1em', color: 'var(--text-2)', textTransform: 'uppercase' }}>
          Cavos
        </span>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(42px, 12vw, 64px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '20px' }}>
          Your money.<br />
          <span style={{ color: 'var(--text-2)' }}>Simple.</span>
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 400, marginBottom: '32px' }}>
          Send and receive Bitcoin and USDC<br />
          with just your Google account.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {['No passwords', 'Free transfers', 'Your money, always'].map((f) => (
            <span
              key={f}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-2)',
                letterSpacing: '0.01em',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={onConnect}
          disabled={isLoading}
          style={{
            width: '100%',
            background: isLoading ? 'var(--surface)' : 'var(--accent)',
            border: 'none',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            color: isLoading ? 'var(--text-2)' : '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'filter 0.15s, transform 0.15s',
            letterSpacing: '-0.01em',
          }}
        >
          {isLoading ? (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="9" cy="9" r="7" stroke="var(--text-2)" strokeWidth="2" strokeOpacity="0.3" />
                <path d="M9 2a7 7 0 017 7" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Loading…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
          Your keys, your money · Free to use
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
