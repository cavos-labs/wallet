'use client';

import { useState } from 'react';

interface SendModalProps {
  asset: 'BTC' | 'USDC';
  balance: string;
  onClose: () => void;
  onSend: (to: string, amount: string) => Promise<void>;
}

export function SendModal({ asset, balance, onClose, onSend }: SendModalProps) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assetColor = asset === 'BTC' ? '#F7931A' : '#2775CA';

  const handleSend = async () => {
    if (!to.trim() || !amount.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      await onSend(to.trim(), amount.trim());
      setTxHash('pending');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleSetMax = () => setAmount(balance);

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
              Send {asset}
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

        {txHash ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(61, 214, 140, 0.12)',
                border: '1px solid rgba(61, 214, 140, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#3DD68C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
              Transaction sent
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Your {asset} is on its way
            </p>
            <button
              onClick={onClose}
              className="btn-primary w-full"
              style={{ padding: '14px', fontSize: '15px' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* To address */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}
              >
                To address
              </label>
              <input
                className="wallet-input"
                type="text"
                placeholder="0x..."
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '24px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  Amount
                </label>
                <button
                  onClick={handleSetMax}
                  style={{
                    fontSize: '11px',
                    color: assetColor,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'DM Mono, monospace',
                  }}
                >
                  MAX · {balance} {asset}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="wallet-input"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ paddingRight: '60px' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    pointerEvents: 'none',
                  }}
                >
                  {asset}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: 'rgba(255, 92, 92, 0.08)',
                  border: '1px solid rgba(255, 92, 92, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#FF5C5C',
                }}
              >
                {error}
              </div>
            )}

            {/* Free transfers badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1.5 7.5H7L6.5 13L12.5 6.5H7L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              Transfer fees are on us
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!to.trim() || !amount.trim() || isSending}
              className="btn-primary w-full"
              style={{ padding: '16px', fontSize: '15px' }}
            >
              {isSending ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Sending…
                </span>
              ) : (
                `Send ${amount || '0'} ${asset}`
              )}
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
