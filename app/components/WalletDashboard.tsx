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

type Tab = 'account' | 'bitcoin';

function UsdcIcon() {
  return (
    <div className="asset-icon" style={{ background: '#2775CA' }}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2775CA" />
        <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.234-2.194-.702-2.194-1.518 0-.816.61-1.356 1.828-1.356 1.1 0 1.708.39 2.012 1.35.064.195.234.312.445.312h1.017a.42.42 0 00.423-.423v-.058a3.277 3.277 0 00-2.93-2.685V9.384a.45.45 0 00-.45-.45h-.966a.45.45 0 00-.45.45v1.17c-1.65.234-2.7 1.296-2.7 2.7 0 2.01 1.216 2.793 3.776 3.097 1.7.312 2.258.702 2.258 1.635 0 .933-.818 1.57-1.944 1.57-1.524 0-2.07-.643-2.24-1.575-.044-.234-.234-.39-.468-.39h-1.075a.42.42 0 00-.423.423v.058c.234 1.7 1.368 2.91 3.152 3.21v1.185c0 .248.202.45.45.45h.966a.45.45 0 00.45-.45V21.86c1.66-.312 2.673-1.44 2.673-2.934l-.001-.802z" fill="white" />
      </svg>
    </div>
  );
}

function BtcIcon() {
  return (
    <div className="asset-icon" style={{ background: '#F7931A' }}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path d="M22.2 13.8c.3-2-.8-3-2.8-3.6l.6-2.5-1.5-.4-.6 2.4-.9-.2.6-2.4-1.5-.4-.6 2.5-2.1-.5-.4 1.5 1.1.3c.5.1.7.5.6.9l-1.5 6c-.1.3-.4.6-.8.5l-1.1-.3-.8 1.6 2.1.5.7.2-.6 2.5 1.5.4.6-2.5.9.2-.6 2.5 1.5.4.6-2.5c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9.9-.3 1.7-1 1.9-2.5zm-3.5 4.9c-.5 2-4 .9-5.2.6l.9-3.7c1.2.3 4.9.9 4.3 3.1zm.6-5c-.5 1.8-3.5 1-4.6.7l.8-3.3c1.1.3 4.3.8 3.8 2.6z" fill="white" />
      </svg>
    </div>
  );
}

export function WalletDashboard() {
  const { address, user, logout, execute, getOnramp, walletStatus } = useCavos();
  const [modal, setModal] = useState<ModalState>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [btc, setBtc] = useState('0');
  const [usdc, setUsdc] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);
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
    showToast(`Sent · ${hash.slice(0, 10)}…`);
    setTimeout(fetchBalances, 5000);
  };

  const handleSwap = async (calls: Call[]) => {
    const hash = await execute(calls);
    showToast(`Swapped · ${hash.slice(0, 10)}…`);
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

  const btcN  = parseFloat(btc);
  const usdcN = parseFloat(usdc);
  const btcUsd    = btcN * BTC_PRICE_USD;
  const totalUsd  = btcUsd + usdcN;

  function fmt(n: number) {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function fmtBtc(n: number) {
    if (n === 0) return '0.0000';
    if (n < 0.0001) return n.toFixed(8);
    return n.toFixed(4);
  }

  const isSettingUp = walletStatus.isDeploying || walletStatus.isRegistering;
  const statusLabel = isSettingUp ? 'Setting up…' : walletStatus.isReady ? 'Ready' : 'Starting…';
  const shortAddr = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 20px 48px', position: 'relative' }}>

      {/* ── Header ── */}
      <header className="page-entry" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', paddingBottom: '4px' }}>
        {/* Settings placeholder */}
        <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="2" stroke="var(--text-2)" strokeWidth="1.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.34 4.34l1.42 1.42M14.24 14.24l1.42 1.42M4.34 15.66l1.42-1.42M14.24 5.76l1.42-1.42" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: isSettingUp ? 'rgba(255,107,53,0.15)' : 'var(--surface)',
          border: `1px solid ${isSettingUp ? 'rgba(255,107,53,0.3)' : 'var(--border)'}`,
          borderRadius: '100px', padding: '6px 12px',
        }}>
          <Image src="/icon-black.png" alt="" width={14} height={14} style={{ filter: 'invert(1)', opacity: 0.7 }} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: isSettingUp ? 'var(--accent)' : 'var(--text)', letterSpacing: '-0.01em' }}>
            {statusLabel}
          </span>
          {isSettingUp && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="6" cy="6" r="4.5" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.3" />
              <path d="M6 1.5a4.5 4.5 0 014.5 4.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Avatar */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)',
          }}
        >{initials}</button>
      </header>

      {/* ── Balance + address ── */}
      <div className="page-entry page-entry-delay-1" style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '36px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="shimmer" style={{ width: '12px', height: '12px', borderRadius: '50%' }} />
            ))}
          </div>
        ) : balanceHidden ? (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-2)' }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'clamp(42px, 12vw, 58px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' }}>
            {fmt(totalUsd)}
          </p>
        )}

        {/* Show/hide toggle */}
        <button
          onClick={() => setBalanceHidden(h => !h)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '16px' }}
        >
          {balanceHidden
            ? <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4C5 4 1 10 1 10s4 6 9 6 9-6 9-6-4-6-9-6zm0 9a3 3 0 110-6 3 3 0 010 6z" stroke="var(--text-2)" strokeWidth="1.5" /></svg>
            : <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 3l14 14M10 4C5 4 1 10 1 10s1.6 2.4 4 4M17 8c1.1 1.2 2 2 2 2s-4 6-9 6a8 8 0 01-3.5-.8" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" /></svg>
          }
          <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>
            {balanceHidden ? 'Show balance' : 'Hide balance'}
          </span>
        </button>

        {/* Address pill */}
        <div>
          <button
            onClick={copyAddress}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '100px', padding: '7px 14px',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontFamily: 'ui-monospace, SF Mono, monospace', fontSize: '12px', color: 'var(--text-2)' }}>{shortAddr}</span>
            {addrCopied
              ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="var(--text-2)" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="var(--text-2)" strokeWidth="1.2" /></svg>
            }
          </button>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="page-entry page-entry-delay-2" style={{ display: 'flex', justifyContent: 'space-around', paddingBottom: '36px' }}>
        <button className="action-btn" onClick={handleFund}>
          <div className="action-btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="action-btn-label">Fund</span>
        </button>

        <button className="action-btn" onClick={() => setModal({ type: 'send', asset: activeTab === 'bitcoin' ? 'BTC' : 'USDC' })}>
          <div className="action-btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Send</span>
        </button>

        <button className="action-btn" onClick={() => setModal({ type: 'receive', asset: activeTab === 'bitcoin' ? 'BTC' : 'USDC' })}>
          <div className="action-btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M5 12l7 7 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Receive</span>
        </button>

        <button className="action-btn" onClick={() => setModal({ type: 'buy' })}>
          <div className="action-btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 16L17 6M17 6H9M17 6v8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Buy BTC</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="page-entry page-entry-delay-3">
        <div className="tab-bar">
          <button
            className={`tab-item${activeTab === 'account' ? ' active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Cash
          </button>
          <button
            className={`tab-item${activeTab === 'bitcoin' ? ' active' : ''}`}
            onClick={() => setActiveTab('bitcoin')}
          >
            Bitcoin
          </button>
        </div>

        {/* ── Asset rows ── */}
        <div style={{ paddingTop: '8px' }}>
          {activeTab === 'account' && (
            <>
              {isLoading ? (
                <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="shimmer" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                  <div>
                    <div className="shimmer" style={{ width: '80px', height: '14px', marginBottom: '6px' }} />
                    <div className="shimmer" style={{ width: '50px', height: '11px' }} />
                  </div>
                </div>
              ) : (
                <div className="asset-row" onClick={() => setModal({ type: 'send', asset: 'USDC' })}>
                  <UsdcIcon />
                  <div className="asset-info">
                    <div className="asset-name">USDC</div>
                    <div className="asset-sub">USD Coin</div>
                  </div>
                  <div className="asset-amount">
                    <div className="asset-amount-main">{balanceHidden ? '••••••' : fmt(usdcN)}</div>
                    {usdcN === 0 && (
                      <div className="asset-amount-sub">Add money to start</div>
                    )}
                  </div>
                </div>
              )}

              {/* Fund nudge when empty */}
              {!isLoading && usdcN === 0 && (
                <button
                  onClick={handleFund}
                  style={{
                    width: '100%', marginTop: '16px',
                    background: 'var(--accent)', border: 'none',
                    borderRadius: '14px', padding: '15px',
                    fontSize: '15px', fontWeight: 600, color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'filter 0.15s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  Add money
                </button>
              )}
            </>
          )}

          {activeTab === 'bitcoin' && (
            <>
              {isLoading ? (
                <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="shimmer" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                  <div>
                    <div className="shimmer" style={{ width: '80px', height: '14px', marginBottom: '6px' }} />
                    <div className="shimmer" style={{ width: '50px', height: '11px' }} />
                  </div>
                </div>
              ) : (
                <div className="asset-row" onClick={() => btcN > 0 ? setModal({ type: 'sell' }) : setModal({ type: 'buy' })}>
                  <BtcIcon />
                  <div className="asset-info">
                    <div className="asset-name">Bitcoin</div>
                    <div className="asset-sub">{balanceHidden ? '•••' : `${fmtBtc(btcN)} BTC`}</div>
                  </div>
                  <div className="asset-amount">
                    <div className="asset-amount-main">{balanceHidden ? '••••••' : fmt(btcUsd)}</div>
                    {btcN === 0 && (
                      <div className="asset-amount-sub">Tap to buy</div>
                    )}
                  </div>
                </div>
              )}

              {/* Buy / Sell buttons */}
              {!isLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => setModal({ type: 'buy' })}
                    style={{
                      background: 'var(--accent)', border: 'none', borderRadius: '12px',
                      padding: '13px', fontSize: '14px', fontWeight: 600, color: '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'filter 0.15s',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    Buy
                  </button>
                  <button
                    onClick={() => setModal({ type: 'sell' })}
                    disabled={btcN === 0}
                    style={{
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '13px', fontSize: '14px',
                      fontWeight: 500, color: btcN === 0 ? 'var(--text-3)' : 'var(--text)',
                      cursor: btcN === 0 ? 'not-allowed' : 'pointer',
                      opacity: btcN === 0 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'background 0.15s',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    Sell
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
