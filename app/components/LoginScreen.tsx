'use client';

import Image from 'next/image';

interface LoginScreenProps {
  onConnect: () => void;
  isLoading: boolean;
}

export function LoginScreen({ onConnect, isLoading }: LoginScreenProps) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px 52px', maxWidth: '430px', margin: '0 auto',
    }}>

      {/* Logo */}
      <div style={{ paddingTop: '52px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Image src="/icon-black.png" alt="Cavos" width={26} height={26} style={{ filter: 'invert(1)', opacity: 0.7 }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.12em', color: 'var(--text-2)', textTransform: 'uppercase' }}>
          Cavos
        </span>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '0 8px' }}>
        {/* Subtle glow badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(124,110,245,0.1)', border: '1px solid rgba(124,110,245,0.25)', borderRadius: '100px', padding: '5px 12px', marginBottom: '28px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.04em' }}>Available on Starknet</span>
        </div>

        <h1 style={{ fontSize: 'clamp(38px, 11vw, 58px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '18px' }}>
          Your money.<br />
          <span style={{ color: 'var(--text-2)' }}>Simple.</span>
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.65, fontWeight: 400, marginBottom: '32px', maxWidth: '300px', margin: '0 auto 32px' }}>
          Hold Bitcoin and USDC.<br />Sign in with just your Google account.
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {['No seed phrases', 'Free transfers', 'Your keys, always'].map(f => (
            <span key={f} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '5px 12px',
              fontSize: '11px', fontWeight: 500, color: 'var(--text-2)',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.02em',
            }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onConnect}
          disabled={isLoading}
          style={{
            width: '100%',
            background: isLoading ? 'var(--surface)' : 'var(--accent)',
            border: 'none', borderRadius: '14px', padding: '16px',
            fontSize: '15px', fontWeight: 600,
            color: isLoading ? 'var(--text-2)' : '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'filter 0.15s, transform 0.15s',
            letterSpacing: '-0.01em',
          }}
        >
          {isLoading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
                <circle cx="8" cy="8" r="6" stroke="var(--text-2)" strokeWidth="1.5" strokeOpacity="0.3" />
                <path d="M8 2a6 6 0 016 6" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5, fontFamily: 'JetBrains Mono, monospace' }}>
          Free to use · Non-custodial
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
