'use client';

interface AssetPickerModalProps {
  title: string;
  onSelect: (asset: 'BTC' | 'USDC') => void;
  onClose: () => void;
}

const ASSETS = [
  {
    symbol: 'BTC' as const,
    name: 'Bitcoin',
    color: '#F7931A',
    dimColor: 'rgba(247, 147, 26, 0.1)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          d="M21.7 13.9c.3-2.1-1.3-3.2-3.5-3.9l.7-2.9-1.7-.4-.7 2.8-1.1-.3.7-2.9-1.7-.4-.7 2.9-2.7-.7-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-1 3.7-.2.1c.1 0 .2 0 .3.1l-1.3 5.1c-.1.3-.4.7-1.1.5l-1.3-.3-.9 2 2.5.6.9.2-.7 2.9 1.7.4.7-2.9 1.1.3-.7 2.9 1.7.4.7-2.9c3.5.7 6.1.3 7.2-2.7.9-2.4-.1-3.8-1.8-4.7 1.2-.3 2.1-1.1 2.3-2.8zm-4.1 5.8c-.7 2.5-5.1 1.1-6.5.8l1.2-4.6c1.4.4 6 1 5.3 3.8zm.7-5.9c-.6 2.3-4.4 1.1-5.7.8l1.1-4.2c1.3.3 5.3.9 4.6 3.4z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    symbol: 'USDC' as const,
    name: 'USD Coin',
    color: '#2775CA',
    dimColor: 'rgba(39, 117, 202, 0.1)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2775CA" />
        <path
          d="M16 6A10 10 0 106 16 10 10 0 0016 6zm0 18a8 8 0 110-16 8 8 0 010 16z"
          fill="white"
          fillOpacity="0.4"
        />
        <path
          d="M16.8 15.3c-1.7-.4-2.3-.9-2.3-1.6 0-.8.8-1.4 2.1-1.4 1.4 0 1.9.7 1.9 1.6h1.7c-.1-1.4-.9-2.6-2.6-3V9h-2.3v1.9c-1.5.3-2.7 1.3-2.7 2.8 0 1.8 1.5 2.7 3.6 3.1 1.9.4 2.3 1.1 2.3 1.9 0 .5-.4 1.4-2.1 1.4-1.6 0-2.2-.7-2.3-1.6h-1.7c.1 1.8 1.4 2.7 2.9 3V23h2.3v-1.9c1.5-.3 2.7-1.2 2.7-2.8-.1-2.1-1.8-2.8-3.5-3z"
          fill="white"
        />
      </svg>
    ),
  },
];

export function AssetPickerModal({ title, onSelect, onClose }: AssetPickerModalProps) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="drag-handle" />

        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)' }}>
            {title} — pick a coin
          </h2>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              fontSize: '20px',
              lineHeight: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => onSelect(asset.symbol)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = asset.color;
                (e.currentTarget as HTMLButtonElement).style.background = asset.dimColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)';
              }}
            >
              {asset.icon}
              <div>
                <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
                  {asset.symbol}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {asset.name}
                </p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12l4-4-4-4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
