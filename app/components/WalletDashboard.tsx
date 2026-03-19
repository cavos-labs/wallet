'use client';

import { useState, useEffect, useCallback } from 'react';
import { RpcProvider, uint256, Call } from 'starknet';
import Image from 'next/image';
import { useCavos } from '@cavos/react';
import { SendModal } from './SendModal';
import { ReceiveModal } from './ReceiveModal';
import { AssetPickerModal } from './AssetPickerModal';
import { SwapModal } from './SwapModal';
import { USDC_ADDRESS, WBTC_ADDRESS } from '../providers';

const BTC_PRICE_USD = 97000;

const rpc = new RpcProvider({
  nodeUrl: 'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/dql5pMT88iueZWl7L0yzT56uVk0EBU4L',
});

type ModalState =
  | { type: 'send'; asset: 'BTC' | 'USDC' }
  | { type: 'receive'; asset: 'BTC' | 'USDC' }
  | { type: 'buy' }
  | { type: 'sell' }
  | null;

export function WalletDashboard() {
  const { address, user, logout, execute, getOnramp, walletStatus } = useCavos();
  const [modal, setModal] = useState<ModalState>(null);
  const [btc, setBtc] = useState('0');
  const [usdc, setUsdc] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [addrCopied, setAddrCopied] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    try {
      const [b, u] = await Promise.all([
        rpc.callContract({ contractAddress: WBTC_ADDRESS, entrypoint: 'balanceOf', calldata: [address] }),
        rpc.callContract({ contractAddress: USDC_ADDRESS, entrypoint: 'balanceOf', calldata: [address] }),
      ]);
      setBtc((Number(uint256.uint256ToBN({ low: b[0], high: b[1] })) / 1e8).toString());
      setUsdc((Number(uint256.uint256ToBN({ low: u[0], high: u[1] })) / 1e6).toString());
    } catch (e) { console.error('[Wallet]', e); }
    finally { setIsLoading(false); }
  }, [address]);

  useEffect(() => {
    fetchBalances();
    const t = setInterval(fetchBalances, 30_000);
    return () => clearInterval(t);
  }, [fetchBalances]);

  const handleSend = async (asset: 'BTC' | 'USDC', to: string, amount: string) => {
    const addr = asset === 'BTC' ? WBTC_ADDRESS : USDC_ADDRESS;
    const dec = asset === 'BTC' ? 8 : 6;
    const wei = BigInt(Math.floor(parseFloat(amount) * 10 ** dec));
    const m = (BigInt(1) << BigInt(128)) - BigInt(1);
    const hash = await execute({ contractAddress: addr, entrypoint: 'transfer', calldata: [to, (wei & m).toString(), (wei >> BigInt(128)).toString()] });
    showToast(`Sent · ${hash.slice(0, 12)}…`);
    setTimeout(fetchBalances, 5000);
  };

  const handleSwap = async (calls: Call[]) => {
    const hash = await execute(calls);
    showToast(`Swapped · ${hash.slice(0, 12)}…`);
    setTimeout(fetchBalances, 8000);
  };

  const handleFund = () => {
    try { window.open(getOnramp('RAMP_NETWORK'), '_blank', 'noopener,noreferrer'); }
    catch { showToast('Fund is only available on mainnet'); }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2000);
  };

  const btcN = parseFloat(btc);
  const usdcN = parseFloat(usdc);
  const btcUsd = btcN * BTC_PRICE_USD;
  const totalUsd = btcUsd + usdcN;

  function fmt(n: number) {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function fmtBtc(n: number) {
    if (n === 0) return '0.0000';
    if (n < 0.0001) return n.toFixed(8);
    return n.toFixed(4);
  }

  const statusLabel = walletStatus.isDeploying ? 'Setting up…' : walletStatus.isRegistering ? 'Almost ready…' : walletStatus.isReady ? 'Ready' : 'Starting…';
  const statusColor = walletStatus.isReady ? '#3DD68C' : (walletStatus.isDeploying || walletStatus.isRegistering) ? '#F7931A' : 'var(--text-muted)';
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?';
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden" style={{ maxWidth: '420px', margin: '0 auto', padding: '0 20px 40px' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '5%', right: '-15%', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(247,147,26,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '-15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(39,117,202,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header className="page-entry flex items-center justify-between" style={{ paddingTop: '24px', paddingBottom: '8px' }}>
        <Image src="/icon-black.png" alt="Cavos" width={26} height={26} style={{ filter: 'invert(1)', opacity: 0.6 }} />
        <div className="flex items-center gap-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '100px', padding: '4px 10px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor, boxShadow: walletStatus.isReady ? `0 0 5px ${statusColor}` : 'none', display: 'inline-block', animation: (walletStatus.isDeploying || walletStatus.isRegistering) ? 'pulse 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: '10px', color: statusColor, fontFamily: 'DM Mono, monospace' }}>{statusLabel}</span>
          </div>
          <button onClick={logout} title="Sign out" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >{initials}</button>
        </div>
      </header>

      {/* ── Total balance ── */}
      <div className="page-entry page-entry-delay-1" style={{ paddingTop: '28px', paddingBottom: '24px' }}>
        {firstName && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>
            Hey, {firstName}
          </p>
        )}
        {isLoading
          ? <div className="shimmer" style={{ width: '150px', height: '56px', borderRadius: '12px' }} />
          : <p className="font-display" style={{ fontSize: '56px', color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt(totalUsd)}</p>
        }

        {/* Address — compact, secondary */}
        <button onClick={copyAddress}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{shortAddr}</span>
          {addrCopied
            ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="#3DD68C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="var(--text-muted)" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="var(--text-muted)" strokeWidth="1.2" /></svg>
          }
        </button>
      </div>

      {/* ── ACCOUNT card (USDC) ── */}
      <div className="page-entry page-entry-delay-2" style={{
        background: 'linear-gradient(135deg, rgba(39,117,202,0.12) 0%, rgba(39,117,202,0.04) 100%)',
        border: '1px solid rgba(39,117,202,0.2)',
        borderRadius: '22px', padding: '20px', marginBottom: '10px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top row: label + balance */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2775CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5A6.5 6.5 0 101.5 8 6.5 6.5 0 008 1.5zm0 11.5A5 5 0 1113 8a5 5 0 01-5 5z" fill="white" fillOpacity="0.4" />
                <path d="M8.4 7.66c-.86-.23-1.15-.47-1.15-.84 0-.42.39-.7 1.04-.7.68 0 .93.32.95.8h.84c-.03-.66-.43-1.27-1.23-1.47V4.8h-1.1v.64c-.76.16-1.36.64-1.36 1.38 0 .88.72 1.32 1.79 1.57.95.22 1.14.56 1.14.9 0 .26-.18.68-1.04.68-.8 0-1.1-.35-1.15-.8H6.5c.06.84.67 1.3 1.41 1.47v.66h1.1v-.65c.76-.14 1.36-.58 1.36-1.36 0-1.04-.9-1.4-1.97-1.63z" fill="white" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>Account</p>
              <p style={{ fontSize: '11px', color: 'rgba(39,117,202,0.8)' }}>USD Coin</p>
            </div>
          </div>

          {isLoading
            ? <div className="shimmer" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
            : (
              <div style={{ textAlign: 'right' }}>
                <p className="font-display" style={{ fontSize: '28px', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(usdcN)}</p>
                <p style={{ fontSize: '10px', color: 'rgba(39,117,202,0.7)', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>available</p>
              </div>
            )
          }
        </div>

        {/* Fund: hero button full-width */}
        <button onClick={handleFund}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: '#3DD68C', border: 'none', borderRadius: '14px', padding: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: '#0A0A0C', marginBottom: '8px', transition: 'opacity 0.15s, transform 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add money
        </button>

        {/* Send / Receive: secondary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => setModal({ type: 'send', asset: 'USDC' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '11px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 11l8-8M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Send
          </button>
          <button onClick={() => setModal({ type: 'receive', asset: 'USDC' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '11px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 11h6M3 11V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Receive
          </button>
        </div>

        {/* Empty state */}
        {!isLoading && usdcN === 0 && (
          <p style={{ fontSize: '11px', color: 'rgba(39,117,202,0.6)', textAlign: 'center', marginTop: '10px', fontFamily: 'DM Mono, monospace' }}>
            Add money to start buying Bitcoin
          </p>
        )}
      </div>

      {/* ── BITCOIN card ── */}
      <div className="page-entry page-entry-delay-3" style={{
        background: 'linear-gradient(135deg, rgba(247,147,26,0.1) 0%, rgba(247,147,26,0.03) 100%)',
        border: '1px solid rgba(247,147,26,0.18)',
        borderRadius: '22px', padding: '20px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top row: label + balance */}
        <div className="flex items-start justify-between" style={{ marginBottom: '20px' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F7931A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M13.7 8.8c.2-1.3-.8-2-2.1-2.4l.4-1.8-1.1-.3-.4 1.7-.7-.2.4-1.7-1.1-.3-.5 1.8-1.6-.4-.3 1.1.8.2c.4.1.5.4.5.7L7.4 9.7l-.2.1.2.1-.8 3.1c-.1.2-.3.4-.6.4l-.8-.2-.6 1.2 1.6.4.6.2-.5 1.8 1.1.3.5-1.8.7.2-.5 1.8 1.1.3.5-1.8c2.1.4 3.7.2 4.4-1.7.6-1.5-.1-2.4-1.1-2.9.7-.2 1.3-.8 1.5-1.9zm-2.6 3.6c-.4 1.5-3.1.7-4 .5l.7-2.9c.9.2 3.7.6 3.3 2.4zm.5-3.6c-.4 1.4-2.7.7-3.5.5l.6-2.5c.8.2 3.3.5 2.9 2z" fill="white" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>Bitcoin</p>
              <p style={{ fontSize: '11px', color: 'rgba(247,147,26,0.8)' }}>BTC</p>
            </div>
          </div>

          {isLoading
            ? <div className="shimmer" style={{ width: '110px', height: '40px', borderRadius: '8px' }} />
            : btcN === 0
            ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '13px', color: 'rgba(247,147,26,0.5)', fontStyle: 'italic' }}>No Bitcoin yet</p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>1 BTC ≈ {fmt(BTC_PRICE_USD)}</p>
              </div>
            )
            : (
              <div style={{ textAlign: 'right' }}>
                <p className="font-display" style={{ fontSize: '28px', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmtBtc(btcN)}
                  <span style={{ fontSize: '13px', color: 'rgba(247,147,26,0.7)', marginLeft: '4px' }}>BTC</span>
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>{fmt(btcUsd)}</p>
              </div>
            )
          }
        </div>

        {/* Buy / Sell */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: btcN > 0 ? '8px' : '0' }}>
          <button onClick={() => setModal({ type: 'buy' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--text)', border: 'none', borderRadius: '14px', padding: '13px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--bg)', transition: 'opacity 0.15s, transform 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Buy
          </button>
          <button onClick={() => setModal({ type: 'sell' })} disabled={btcN === 0}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: btcN > 0 ? 'rgba(255,255,255,0.06)' : 'transparent', border: `1px solid ${btcN > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '14px', padding: '13px', cursor: btcN === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500, color: btcN === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: btcN === 0 ? 0.35 : 1, transition: 'background 0.15s' }}
            onMouseEnter={e => { if (btcN > 0) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { if (btcN > 0) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Sell
          </button>
        </div>

        {/* Send / Receive BTC — only shown when has balance */}
        {btcN > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => setModal({ type: 'send', asset: 'BTC' })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '9px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
            >
              Send BTC
            </button>
            <button onClick={() => setModal({ type: 'receive', asset: 'BTC' })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '9px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
            >
              Receive BTC
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="page-entry page-entry-delay-4" style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', opacity: 0.6 }}>Transfers are always free</p>
      </div>

      {/* Modals */}
      {modal?.type === 'send' && <SendModal asset={modal.asset} balance={modal.asset === 'BTC' ? btc : usdc} onClose={() => setModal(null)} onSend={async (to, amt) => { await handleSend(modal.asset, to, amt); }} />}
      {modal?.type === 'receive' && address && <ReceiveModal asset={modal.asset} address={address} onClose={() => setModal(null)} />}
      {modal?.type === 'buy' && address && <SwapModal direction="buy" usdcBalance={usdc} btcBalance={btc} address={address} onClose={() => setModal(null)} onSwap={handleSwap} />}
      {modal?.type === 'sell' && address && <SwapModal direction="sell" usdcBalance={usdc} btcBalance={btc} address={address} onClose={() => setModal(null)} onSwap={handleSwap} />}

      {toast && <div className="toast">{toast}</div>}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
