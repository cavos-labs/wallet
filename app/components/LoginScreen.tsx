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
          Hold Bitcoin and USDC without seed phrases,
          <br />
          hardware wallets, or browser extensions.
          <br />
          Just your Google account.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['No seed phrases', 'Gasless txns', 'Self-custodial'].map((f) => (
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 10.3a6.5 6.5 0 01-4.87-2.19c.62-.93 2.13-1.81 4.87-1.81s4.25.88 4.87 1.81A6.5 6.5 0 0110 15.8z" fill="currentColor" />
              </svg>
              Get started
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
          Powered by Starknet · Non-custodial · Open source
        </p>
      </div>
    </div>
  );
}
