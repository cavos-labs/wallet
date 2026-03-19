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
  | { type: 'pick-send' }
  | { type: 'pick-receive' }
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

  // Derived
  const btcN = parseFloat(btc);
  const usdcN = parseFloat(usdc);
  const btcUsd = btcN * BTC_PRICE_USD;
  const totalUsd = btcUsd + usdcN;
  const hasAny = totalUsd > 0;

  function fmt(n: number, prefix = '$') {
    return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function fmtBtc(n: number) {
    if (n === 0) return '0.0000';
    if (n < 0.0001) return n.toFixed(8);
    return n.toFixed(4);
  }

  const statusLabel = walletStatus.isDeploying ? 'Setting up…' : walletStatus.isRegistering ? 'Almost ready…' : walletStatus.isReady ? 'Ready' : 'Starting…';
  const statusColor = walletStatus.isReady ? '#3DD68C' : (walletStatus.isDeploying || walletStatus.isRegistering) ? '#F7931A' : 'var(--text-muted)';
  const shortAddr = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?';
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden" style={{ maxWidth: '420px', margin: '0 auto', padding: '0 20px 40px' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '10%', right: '-10%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(247,147,26,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '-10%', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(39,117,202,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header className="page-entry flex items-center justify-between" style={{ paddingTop: '24px', paddingBottom: '8px' }}>
        <Image src="/icon-black.png" alt="Cavos" width={28} height={28} style={{ filter: 'invert(1)', opacity: 0.7 }} />
        <div className="flex items-center gap-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '100px', padding: '5px 12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, boxShadow: walletStatus.isReady ? `0 0 6px ${statusColor}` : 'none', display: 'inline-block', animation: (walletStatus.isDeploying || walletStatus.isRegistering) ? 'pulse 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: '11px', color: statusColor, fontFamily: 'DM Mono, monospace' }}>{statusLabel}</span>
          </div>
          <button onClick={logout} title="Sign out" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'border-color 0.15s, opacity 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >{initials}</button>
        </div>
      </header>

      {/* Total */}
      <div className="page-entry page-entry-delay-1" style={{ paddingTop: '32px', paddingBottom: '24px' }}>
        {firstName && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Hey, {firstName}</p>}
        {isLoading
          ? <div className="shimmer" style={{ width: '160px', height: '52px', borderRadius: '12px' }} />
          : <p className="font-display" style={{ fontSize: '52px', color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt(totalUsd)}</p>
        }
        <button onClick={copyAddress} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
        >
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{shortAddr}</span>
          {addrCopied
            ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="#3DD68C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="var(--text-muted)" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="var(--text-muted)" strokeWidth="1.2" /></svg>
          }
        </button>
      </div>

      {/* ── ACCOUNT section (USDC) ── */}
      <div className="page-entry page-entry-delay-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(39,117,202,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#2775CA" />
              <path d="M10 3.75A6.25 6.25 0 103.75 10 6.25 6.25 0 0010 3.75zm0 11.25A5 5 0 1115 10a5 5 0 01-5 5z" fill="white" fillOpacity="0.4" />
              <path d="M10.5 9.57c-1.07-.29-1.43-.58-1.43-1.04 0-.52.49-.88 1.3-.88.85 0 1.16.41 1.19 1.01h1.05c-.04-.83-.54-1.59-1.54-1.84V6h-1.4v.8c-.94.2-1.7.8-1.7 1.72 0 1.1.91 1.65 2.24 1.97 1.18.28 1.42.7 1.42 1.13 0 .33-.23.85-1.3.85-1 0-1.38-.44-1.44-1.01H8.35c.07 1.05.84 1.64 1.76 1.84v.82h1.4v-.81c.95-.18 1.7-.72 1.7-1.7-.01-1.31-1.12-1.76-2.21-2.04z" fill="white" />
            </svg>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Account</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>USD Coin</p>
            </div>
          </div>
          {isLoading
            ? <div className="shimmer" style={{ width: '80px', height: '28px', borderRadius: '8px' }} />
            : <p className="font-display" style={{ fontSize: '26px', color: 'var(--text)', letterSpacing: '-0.02em' }}>{fmt(usdcN)}</p>
          }
        </div>

        {/* USDC actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Fund', color: '#3DD68C', bg: 'rgba(61,214,140,0.1)', border: 'rgba(61,214,140,0.2)', onClick: handleFund,
              icon: <path d="M8 3v10M3 8h10" stroke="#3DD68C" strokeWidth="1.8" strokeLinecap="round" /> },
            { label: 'Send', color: 'var(--text-muted)', bg: 'var(--surface-2)', border: 'var(--border)', onClick: () => setModal({ type: 'send', asset: 'USDC' }),
              icon: <path d="M3 13l10-10M13 3H6M13 3v7" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> },
            { label: 'Receive', color: 'var(--text-muted)', bg: 'var(--surface-2)', border: 'var(--border)', onClick: () => setModal({ type: 'receive', asset: 'USDC' }),
              icon: <path d="M13 3L3 13M3 13h7M3 13V6" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: btn.bg, border: `1px solid ${btn.border}`, borderRadius: '12px', padding: '12px 8px', cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{btn.icon}</svg>
              <span style={{ fontSize: '11px', fontWeight: 500, color: btn.color }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!isLoading && usdcN === 0 && (
          <button onClick={handleFund} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', background: 'rgba(61,214,140,0.06)', border: '1px dashed rgba(61,214,140,0.25)', borderRadius: '12px', padding: '12px 16px', cursor: 'pointer', width: '100%', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(61,214,140,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(61,214,140,0.06)'; }}
          >
            <p style={{ fontSize: '13px', color: '#3DD68C', fontWeight: 500 }}>Add money to get started →</p>
          </button>
        )}
      </div>

      {/* ── BITCOIN section ── */}
      <div className="page-entry page-entry-delay-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(247,147,26,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#F7931A" />
              <path d="M13.7 8.8c.2-1.3-.8-2-2.1-2.4l.4-1.8-1.1-.3-.4 1.7-.7-.2.4-1.7-1.1-.3-.5 1.8-1.6-.4-.3 1.1.8.2c.4.1.5.4.5.7L7.4 9.7l-.2.1.2.1-.8 3.1c-.1.2-.3.4-.6.4l-.8-.2-.6 1.2 1.6.4.6.2-.5 1.8 1.1.3.5-1.8.7.2-.5 1.8 1.1.3.5-1.8c2.1.4 3.7.2 4.4-1.7.6-1.5-.1-2.4-1.1-2.9.7-.2 1.3-.8 1.5-1.9zm-2.6 3.6c-.4 1.5-3.1.7-4 .5l.7-2.9c.9.2 3.7.6 3.3 2.4zm.5-3.6c-.4 1.4-2.7.7-3.5.5l.6-2.5c.8.2 3.3.5 2.9 2z" fill="white" />
            </svg>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Bitcoin</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BTC</p>
            </div>
          </div>
          {isLoading
            ? <div className="shimmer" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
            : (
              <div style={{ textAlign: 'right' }}>
                <p className="font-display" style={{ fontSize: '26px', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtBtc(btcN)} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>BTC</span></p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>{fmt(btcUsd)}</p>
              </div>
            )
          }
        </div>

        {/* Buy / Sell */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => setModal({ type: 'buy' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--text)', border: '1px solid transparent', borderRadius: '12px', padding: '13px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--bg)', transition: 'opacity 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            Buy
          </button>
          <button onClick={() => setModal({ type: 'sell' })}
            disabled={btcN === 0}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '13px', cursor: btcN === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500, color: btcN === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: btcN === 0 ? 0.4 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={e => { if (btcN > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; }}
            onMouseLeave={e => { if (btcN > 0) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            Sell
          </button>
        </div>

        {/* Send/Receive BTC — secondary */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button onClick={() => setModal({ type: 'send', asset: 'BTC' })} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', padding: '8px', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            Send BTC
          </button>
          <button onClick={() => setModal({ type: 'receive', asset: 'BTC' })} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', padding: '8px', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            Receive BTC
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="page-entry page-entry-delay-4" style={{ marginTop: '28px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Transfers are always free</p>
      </div>

      {/* Modals */}
      {modal?.type === 'pick-send' && <AssetPickerModal title="Send" onSelect={a => setModal({ type: 'send', asset: a })} onClose={() => setModal(null)} />}
      {modal?.type === 'pick-receive' && <AssetPickerModal title="Receive" onSelect={a => setModal({ type: 'receive', asset: a })} onClose={() => setModal(null)} />}
      {modal?.type === 'send' && <SendModal asset={modal.asset} balance={modal.asset === 'BTC' ? btc : usdc} onClose={() => setModal(null)} onSend={async (to, amt) => { await handleSend(modal.asset, to, amt); }} />}
      {modal?.type === 'receive' && address && <ReceiveModal asset={modal.asset} address={address} onClose={() => setModal(null)} />}
      {modal?.type === 'buy' && address && <SwapModal direction="buy" usdcBalance={usdc} btcBalance={btc} address={address} onClose={() => setModal(null)} onSwap={handleSwap} />}
      {modal?.type === 'sell' && address && <SwapModal direction="sell" usdcBalance={usdc} btcBalance={btc} address={address} onClose={() => setModal(null)} onSwap={handleSwap} />}

      {toast && <div className="toast">{toast}</div>}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
