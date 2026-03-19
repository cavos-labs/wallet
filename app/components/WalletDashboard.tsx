'use client';

import { useState, useEffect, useCallback } from 'react';
import { RpcProvider, uint256, Call } from 'starknet';
import Image from 'next/image';
import { useCavos } from '@cavos/react';
import { SendModal } from './SendModal';
import { ReceiveModal } from './ReceiveModal';
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
    catch { showToast('Funding is only available on mainnet'); }
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

  const isSettingUp = walletStatus.isDeploying || walletStatus.isRegistering;
  const statusLabel = walletStatus.isDeploying ? 'Setting up…' : walletStatus.isRegistering ? 'Almost ready…' : walletStatus.isReady ? 'Ready' : 'Starting…';
  const statusColor = walletStatus.isReady ? 'var(--green)' : isSettingUp ? 'var(--btc)' : 'var(--cream-muted)';
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?';
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div
      className="min-h-dvh flex flex-col relative"
      style={{ maxWidth: '420px', margin: '0 auto', padding: '0 20px 48px' }}
    >
      {/* Header */}
      <header className="page-entry flex items-center justify-between" style={{ paddingTop: '24px', paddingBottom: '4px' }}>
        <Image src="/icon-black.png" alt="Cavos" width={24} height={24} style={{ filter: 'invert(1)', opacity: 0.5 }} />
        <div className="flex items-center gap-2">
          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '100px', padding: '4px 10px',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: statusColor,
              boxShadow: walletStatus.isReady ? `0 0 6px var(--green)` : 'none',
              display: 'inline-block',
              animation: isSettingUp ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '10px', color: statusColor, fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>
              {statusLabel}
            </span>
          </div>
          {/* Avatar / logout */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '11px', fontWeight: 500,
              color: 'var(--cream-dim)', transition: 'border-color 0.15s',
            }}
          >{initials}</button>
        </div>
      </header>

      {/* ── Total balance ── */}
      <div className="page-entry page-entry-delay-1" style={{ paddingTop: '32px', paddingBottom: '28px' }}>
        {firstName && (
          <p style={{ fontSize: '11px', color: 'var(--cream-muted)', marginBottom: '8px', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {firstName}
          </p>
        )}
        {isLoading
          ? <div className="shimmer" style={{ width: '160px', height: '64px', borderRadius: '12px' }} />
          : (
            <p
              className="font-display"
              style={{ fontSize: 'clamp(52px, 14vw, 72px)', color: 'var(--cream)', letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              {fmt(totalUsd)}
            </p>
          )
        }

        {/* Address */}
        <button
          onClick={copyAddress}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--cream-muted)' }}>{shortAddr}</span>
          {addrCopied
            ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="var(--cream-muted)" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="var(--cream-muted)" strokeWidth="1.2" /></svg>
          }
        </button>
      </div>

      {/* ── ACCOUNT card (USDC) ── */}
      <div className="section-card usdc page-entry page-entry-delay-2" style={{ padding: '22px', marginBottom: '12px' }}>
        {/* Label row */}
        <div className="flex items-center justify-between" style={{ marginBottom: '18px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--usdc)', marginBottom: '2px' }}>
              Account
            </p>
            <p style={{ fontSize: '10px', color: 'var(--cream-muted)', fontFamily: 'DM Mono, monospace' }}>USD Coin</p>
          </div>
          {isLoading
            ? <div className="shimmer" style={{ width: '80px', height: '36px', borderRadius: '8px' }} />
            : (
              <div style={{ textAlign: 'right' }}>
                <p className="font-display" style={{ fontSize: '32px', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmt(usdcN)}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--cream-muted)', fontFamily: 'DM Mono, monospace', marginTop: '3px' }}>available</p>
              </div>
            )
          }
        </div>

        {/* Fund: hero CTA */}
        <button className="btn-fund" onClick={handleFund} style={{ marginBottom: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add money
        </button>

        {/* Send / Receive */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => setModal({ type: 'send', asset: 'USDC' })}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 11l8-8M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Send
          </button>
          <button className="btn-secondary" onClick={() => setModal({ type: 'receive', asset: 'USDC' })}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 11h6M3 11V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Receive
          </button>
        </div>

        {!isLoading && usdcN === 0 && (
          <p style={{ fontSize: '11px', color: 'var(--cream-muted)', textAlign: 'center', marginTop: '12px', fontFamily: 'DM Mono, monospace' }}>
            Add money to start buying Bitcoin
          </p>
        )}
      </div>

      {/* ── BITCOIN card ── */}
      <div className="section-card btc page-entry page-entry-delay-3" style={{ padding: '22px' }}>
        {/* Label row */}
        <div className="flex items-start justify-between" style={{ marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--btc)', marginBottom: '2px' }}>
              Bitcoin
            </p>
            <p style={{ fontSize: '10px', color: 'var(--cream-muted)', fontFamily: 'DM Mono, monospace' }}>BTC</p>
          </div>
          {isLoading
            ? <div className="shimmer" style={{ width: '110px', height: '44px', borderRadius: '8px' }} />
            : btcN === 0
            ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '13px', color: 'var(--cream-muted)', fontStyle: 'italic', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  No Bitcoin yet
                </p>
                <p style={{ fontSize: '10px', color: 'var(--cream-muted)', marginTop: '3px', fontFamily: 'DM Mono, monospace' }}>
                  1 BTC ≈ {fmt(BTC_PRICE_USD)}
                </p>
              </div>
            )
            : (
              <div style={{ textAlign: 'right' }}>
                <p className="font-display" style={{ fontSize: '32px', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {fmtBtc(btcN)}
                  <span style={{ fontSize: '14px', color: 'var(--btc)', marginLeft: '5px', opacity: 0.8 }}>BTC</span>
                </p>
                <p style={{ fontSize: '11px', color: 'var(--cream-muted)', fontFamily: 'DM Mono, monospace', marginTop: '3px' }}>
                  {fmt(btcUsd)}
                </p>
              </div>
            )
          }
        </div>

        {/* Buy / Sell */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: btcN > 0 ? '8px' : '0' }}>
          <button className="btn-buy" onClick={() => setModal({ type: 'buy' })}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Buy
          </button>
          <button className="btn-sell" onClick={() => setModal({ type: 'sell' })} disabled={btcN === 0}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Sell
          </button>
        </div>

        {/* Send / Receive BTC — only when has balance */}
        {btcN > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => setModal({ type: 'send', asset: 'BTC' })}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 11l8-8M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Send BTC
            </button>
            <button className="btn-secondary" onClick={() => setModal({ type: 'receive', asset: 'BTC' })}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 11h6M3 11V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Receive BTC
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="page-entry page-entry-delay-4" style={{ marginTop: '28px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: 'var(--cream-muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>
          Transfers are always free
        </p>
      </div>

      {/* Modals */}
      {modal?.type === 'send' && (
        <SendModal
          asset={modal.asset}
          balance={modal.asset === 'BTC' ? btc : usdc}
          onClose={() => setModal(null)}
          onSend={async (to, amt) => { await handleSend(modal.asset, to, amt); }}
        />
      )}
      {modal?.type === 'receive' && address && (
        <ReceiveModal asset={modal.asset} address={address} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'buy' && address && (
        <SwapModal direction="buy" usdcBalance={usdc} btcBalance={btc} address={address} onClose={() => setModal(null)} onSwap={handleSwap} />
      )}
      {modal?.type === 'sell' && address && (
        <SwapModal direction="sell" usdcBalance={usdc} btcBalance={btc} address={address} onClose={() => setModal(null)} onSwap={handleSwap} />
      )}

      {toast && <div className="toast">{toast}</div>}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
