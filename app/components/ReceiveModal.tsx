'use client';

import { useState } from 'react';

interface ReceiveModalProps {
  asset: 'BTC' | 'USDC';
  address: string;
  onClose: () => void;
}

export function ReceiveModal({ asset, address, onClose }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);
  const assetColor = asset === 'BTC' ? '#F7931A' : '#2775CA';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Minimal QR-like grid pattern (decorative, not a real QR)
  const gridSize = 11;
  const pattern = Array.from({ length: gridSize * gridSize }, (_, i) => {
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    // Corner squares
    const inCorner = (x < 3 && y < 3) || (x >= gridSize - 3 && y < 3) || (x < 3 && y >= gridSize - 3);
    const onBorder = (x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1);
    const innerBorder = (x === 1 || x === gridSize - 2 || y === 1 || y === gridSize - 2) && !inCorner;
    const innerInner = ((x >= 2 && x <= gridSize - 3) && (y >= 2 && y <= gridSize - 3));
    // Use address chars to create pseudo-random fill
    const charCode = address.charCodeAt((i * 7) % address.length) || 0;
    const isFilled = inCorner || (innerInner && !innerBorder && charCode % 3 !== 0);
    return { x, y, filled: isFilled };
  });

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="drag-handle" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: assetColor,
                display: 'inline-block',
                boxShadow: `0 0 8px ${assetColor}`,
              }}
            />
            <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)' }}>
              Receive {asset}
            </h2>
          </div>
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

        {/* QR placeholder */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              display: 'inline-block',
              position: 'relative',
            }}
          >
            <svg
              width={gridSize * 14}
              height={gridSize * 14}
              viewBox={`0 0 ${gridSize * 14} ${gridSize * 14}`}
              fill="none"
            >
              {pattern.map(({ x, y, filled }) => (
                filled && (
                  <rect
                    key={`${x}-${y}`}
                    x={x * 14 + 1}
                    y={y * 14 + 1}
                    width={12}
                    height={12}
                    rx={2}
                    fill="#0A0A0C"
                  />
                )
              ))}
            </svg>

            {/* Center logo dot */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: assetColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                {asset === 'BTC' ? '₿' : '$'}
              </span>
            </div>
          </div>
        </div>

        {/* Address display */}
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}
          >
            Your Starknet address
          </p>
          <p
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
              lineHeight: 1.6,
            }}
          >
            {address}
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="btn-primary w-full"
          style={{
            padding: '14px',
            fontSize: '15px',
            background: copied ? 'rgba(61, 214, 140, 0.15)' : undefined,
            color: copied ? '#3DD68C' : undefined,
            border: copied ? '1px solid rgba(61, 214, 140, 0.3)' : undefined,
          }}
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 5V4a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 002 2h1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Copy address
            </>
          )}
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '12px',
          }}
        >
          Only send {asset} on Starknet to this address
        </p>
      </div>
    </div>
  );
}
