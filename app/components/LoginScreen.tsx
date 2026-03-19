'use client';

import Image from 'next/image';

interface LoginScreenProps {
  onConnect: () => void;
  isLoading: boolean;
}

export function LoginScreen({ onConnect, isLoading }: LoginScreenProps) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden">
      {/* Background ambient */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(247,147,26,0.06) 0%, transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '0',
          right: '-80px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(39,117,202,0.06) 0%, transparent 65%)',
        }}
      />

      {/* Logo */}
      <div className="page-entry flex items-center gap-3">
        <Image
          src="/icon-black.png"
          alt="Cavos"
          width={32}
          height={32}
          className="opacity-90 invert"
          style={{ filter: 'invert(1)' }}
        />
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '13px',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          Cavos
        </span>
      </div>

      {/* Hero */}
      <div className="page-entry page-entry-delay-1 flex flex-col items-center text-center gap-6 max-w-sm">
        <div style={{ lineHeight: 1.05 }}>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(48px, 12vw, 72px)', color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            Your money.
          </h1>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(48px, 12vw, 72px)', color: 'var(--text-muted)', letterSpacing: '-0.02em' }}
          >
            Simple.
          </h1>
        </div>

        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          Send and receive Bitcoin and USDC
          <br />
          with just your Google account.
          <br />
          No passwords, no complicated setup.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['No passwords', 'Free transfers', 'Your money, always'].map((f) => (
            <span
              key={f}
              className="tag"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="page-entry page-entry-delay-2 w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="btn-primary w-full"
          style={{ padding: '16px', fontSize: '16px' }}
        >
          {isLoading ? (
            <span style={{ opacity: 0.6 }}>Loading…</span>
          ) : (
            <>
              {/* Google logo */}
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

        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Your keys, your money · Free to use · Open source
        </p>
      </div>
    </div>
  );
}
