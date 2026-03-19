'use client';

interface AssetCardProps {
  symbol: 'BTC' | 'USDC';
  name: string;
  balance: string;
  usdValue: string;
  isLoading?: boolean;
}

const ASSET_CONFIG = {
  BTC: {
    color: '#F7931A',
    dimColor: 'rgba(247, 147, 26, 0.1)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#F7931A" />
        <path
          d="M19.2 12.3c.3-1.8-1.1-2.8-3-3.4l.6-2.5-1.5-.4-.6 2.4-.9-.2.6-2.5-1.5-.4-.6 2.5-2.3-.6-.4 1.6s1.1.3 1.1.3c.6.2.7.6.7.9l-.8 3.2-.2.1c.1 0 .2 0 .2.1l-1.1 4.4c-.1.3-.4.6-.9.5l-1.1-.3-.8 1.7 2.2.5.8.2-.6 2.5 1.5.4.6-2.5.9.2-.6 2.5 1.5.4.6-2.5c3 .6 5.3.3 6.2-2.3.8-2.1-.1-3.3-1.5-4.1 1-.2 1.8-1 2-2.5zm-3.6 5.1c-.6 2.1-4.4.9-5.6.7l1-4c1.2.3 5.2.8 4.6 3.3zm.6-5.1c-.5 2-3.8.9-4.9.7l.9-3.6c1.1.3 4.6.7 4 2.9z"
          fill="white"
        />
      </svg>
    ),
  },
  USDC: {
    color: '#2775CA',
    dimColor: 'rgba(39, 117, 202, 0.1)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#2775CA" />
        <path
          d="M14 5.25C9.17 5.25 5.25 9.17 5.25 14S9.17 22.75 14 22.75 22.75 18.83 22.75 14 18.83 5.25 14 5.25zm0 15.75a7 7 0 110-14 7 7 0 010 14z"
          fill="white"
          fillOpacity="0.4"
        />
        <path
          d="M14.7 13.4c-1.5-.4-2-.8-2-1.4 0-.7.7-1.2 1.8-1.2 1.2 0 1.6.6 1.7 1.4h1.5c-.1-1.2-.8-2.2-2.2-2.6V8h-2v1.6c-1.3.3-2.4 1.1-2.4 2.4 0 1.5 1.3 2.3 3.1 2.7 1.7.4 2 1 2 1.6 0 .5-.3 1.2-1.8 1.2-1.4 0-1.9-.6-2-1.5H11c.1 1.5 1.2 2.3 2.5 2.6V20h2v-1.6c1.4-.3 2.4-1 2.4-2.4-.1-1.8-1.5-2.4-3.2-2.6z"
          fill="white"
        />
      </svg>
    ),
  },
};

function formatBtcBalance(raw: string): string {
  const n = parseFloat(raw);
  if (n === 0) return '0.0000';
  if (n < 0.0001) return n.toFixed(8);
  if (n < 0.001) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(4);
}

export function AssetCard({ symbol, name, balance, usdValue, isLoading }: AssetCardProps) {
  const config = ASSET_CONFIG[symbol];
  const displayBalance = symbol === 'BTC' ? formatBtcBalance(balance) : parseFloat(balance).toFixed(2);

  return (
    <div className="asset-card" style={{ padding: '20px 24px' }}>
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '140px',
          height: '140px',
          background: `radial-gradient(circle, ${config.dimColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>{symbol}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{name}</p>
        </div>
      </div>

      {/* Balance */}
      {isLoading ? (
        <div style={{ marginTop: '16px' }}>
          <div className="shimmer" style={{ width: '120px', height: '32px', marginBottom: '6px' }} />
          <div className="shimmer" style={{ width: '80px', height: '18px' }} />
        </div>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <p
            className="font-display"
            style={{ fontSize: '32px', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            {displayBalance}
            <span style={{ fontSize: '16px', marginLeft: '6px', color: 'var(--text-secondary)' }}>
              {symbol}
            </span>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>
            {usdValue}
          </p>
        </div>
      )}
    </div>
  );
}
