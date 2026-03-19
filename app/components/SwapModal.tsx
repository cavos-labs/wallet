'use client';

import { useState, useEffect, useRef } from 'react';
import { Call } from 'starknet';

const AVNU_API = 'https://starknet.api.avnu.fi';

interface Quote {
  quoteId: string;
  buyAmount: string;
  buyAmountInUsd: number;
  sellAmountInUsd: number;
  priceRatioUsd: number;
}

interface SwapModalProps {
  direction: 'buy' | 'sell';
  usdcBalance: string;
  btcBalance: string;
  address: string;
  onClose: () => void;
  onSwap: (calls: Call[]) => Promise<void>;
}

const USDC = '0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb';
const WBTC = '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac';

function hexToAmount(hex: string, decimals: number): string {
  const n = parseInt(hex, 16) / 10 ** decimals;
  if (decimals === 8) return n.toFixed(6);
  return n.toFixed(2);
}

export function SwapModal({ direction, usdcBalance, btcBalance, address, onClose, onSwap }: SwapModalProps) {
  const isBuy = direction === 'buy';
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxBalance = isBuy ? usdcBalance : btcBalance;
  const sellDecimals = isBuy ? 6 : 8;
  const sellToken = isBuy ? USDC : WBTC;
  const buyToken = isBuy ? WBTC : USDC;
  const accentColor = isBuy ? '#F7931A' : '#2775CA';

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsQuoting(true);
      setError(null);
      try {
        const sellAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** sellDecimals));
        const res = await fetch(
          `${AVNU_API}/swap/v2/quotes?sellTokenAddress=${sellToken}&buyTokenAddress=${buyToken}&sellAmount=0x${sellAmount.toString(16)}&takerAddress=${address}&size=1`
        );
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('No route found');
        setQuote(data[0]);
      } catch {
        setError('Could not get a price right now');
        setQuote(null);
      } finally {
        setIsQuoting(false);
      }
    }, 500);
  }, [amount, address, sellToken, buyToken, sellDecimals]);

  const handleSwap = async () => {
    if (!quote) return;
    setIsSwapping(true);
    setError(null);
    try {
      const res = await fetch(`${AVNU_API}/swap/v2/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.quoteId, takerAddress: address, slippage: 0.005 }),
      });
      const data = await res.json();
      if (!data.calls || data.calls.length === 0) throw new Error('Failed to build swap');
      await onSwap(data.calls);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const buyDecimals = isBuy ? 8 : 6;
  const receiveAmount = quote ? hexToAmount(quote.buyAmount, buyDecimals) : null;
  const receiveSymbol = isBuy ? 'BTC' : 'USDC';
  const spendSymbol = isBuy ? 'USDC' : 'BTC';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="drag-handle" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, display: 'inline-block', boxShadow: `0 0 8px ${accentColor}` }} />
            <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)' }}>
              {isBuy ? 'Buy Bitcoin' : 'Sell Bitcoin'}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(247,147,26,0.12)', border: '1px solid rgba(247,147,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#F7931A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>Swap confirmed</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Your {receiveSymbol} will arrive shortly</p>
            <button onClick={onClose} className="btn-primary w-full" style={{ padding: '14px', fontSize: '15px' }}>Done</button>
          </div>
        ) : (
          <>
            {/* You spend */}
            <div style={{ marginBottom: '12px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  You spend
                </label>
                <button
                  onClick={() => setAmount(maxBalance)}
                  style={{ fontSize: '11px', color: accentColor, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}
                >
                  MAX · {parseFloat(maxBalance).toFixed(isBuy ? 2 : 6)} {spendSymbol}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="wallet-input"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ paddingRight: '72px', fontSize: '18px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', pointerEvents: 'none' }}>
                  {spendSymbol}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M3 8l4 4 4-4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* You receive */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                You receive
              </label>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {isQuoting ? (
                  <div className="shimmer" style={{ width: '100px', height: '20px', borderRadius: '6px' }} />
                ) : receiveAmount ? (
                  <>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '18px', color: 'var(--text)' }}>{receiveAmount}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{receiveSymbol}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Enter an amount above</span>
                )}
              </div>

              {/* Price info */}
              {quote && !isQuoting && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>
                  1 BTC ≈ ${(quote.buyAmountInUsd / (parseInt(quote.buyAmount, 16) / 1e8)).toLocaleString('en-US', { maximumFractionDigits: 0 })} via Ekubo
                </p>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#FF5C5C' }}>
                {error}
              </div>
            )}

            {/* Free badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1.5 7.5H7L6.5 13L12.5 6.5H7L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              No transaction fees
            </div>

            <button
              onClick={handleSwap}
              disabled={!quote || isQuoting || isSwapping}
              className="btn-primary w-full"
              style={{ padding: '16px', fontSize: '15px' }}
            >
              {isSwapping ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                    <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Swapping…
                </span>
              ) : isBuy ? `Buy ${receiveAmount ? receiveAmount + ' BTC' : 'Bitcoin'}` : `Sell for ${receiveAmount ? '$' + receiveAmount : 'USDC'}`}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
