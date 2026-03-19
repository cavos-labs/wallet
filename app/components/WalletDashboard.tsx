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

/* ── Icon components ── */
function UsdcIcon({ size = 42 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'rgba(39,117,202,0.15)', border: '1px solid rgba(39,117,202,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#2775CA" strokeWidth="1.5" />
        <path d="M15 8.5C14.3 7.3 13.1 6.5 11.5 6.5c-2.5 0-4.5 2-4.5 5s2 5 4.5 5c1.6 0 2.8-.8 3.5-2M12 9v1.5M12 13.5V15" stroke="#2775CA" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9.5 10.5h4c.6 0 1 .4 1 1s-.4 1-1 1h-4c-.6 0-1 .4-1 1s.4 1 1 1h4" stroke="#2775CA" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function BtcIcon({ size = 42 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'rgba(247,147,26,0.12)', border: '1px solid rgba(247,147,26,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M9 8h5.5a2 2 0 010 4H9M9 12h6a2 2 0 010 4H9M9 8V6M9 16v2M12 8V6M12 16v2" stroke="#F7931A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function WalletDashboard() {
  const { address, user, logout, execute, getOnramp, walletStatus } = useCavos();
  const [modal, setModal]             = useState<ModalState>(null);
  const [activeTab, setActiveTab]     = useState<Tab>('account');
  const [btc, setBtc]                 = useState('0');
  const [usdc, setUsdc]               = useState('0');
  const [isLoading, setIsLoading]     = useState(true);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [toast, setToast]             = useState<string | null>(null);
  const [addrCopied, setAddrCopied]   = useState(false);

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
    const dec  = asset === 'BTC' ? 8 : 6;
    const wei  = BigInt(Math.floor(parseFloat(amount) * 10 ** dec));
    const m    = (BigInt(1) << BigInt(128)) - BigInt(1);
    const hash = await execute({ contractAddress: addr, entrypoint: 'transfer', calldata: [to, (wei & m).toString(), (wei >> BigInt(128)).toString()] });
    showToast(`Sent · ${hash.slice(0, 10)}…`);
    setTimeout(fetchBalances, 5000);
  };

  const handleSwap = async (calls: Call[]) => {
    const hash = await execute(calls);
    showToast(`Done · ${hash.slice(0, 10)}…`);
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

  const btcN    = parseFloat(btc);
  const usdcN   = parseFloat(usdc);
  const btcUsd  = btcN * BTC_PRICE_USD;
  const totalUsd = btcUsd + usdcN;

  const fmtUsd = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtBtc = (n: number) => {
    if (n === 0) return '0.0000';
    if (n < 0.0001) return n.toFixed(8);
    return n.toFixed(4);
  };

  const isSettingUp  = walletStatus.isDeploying || walletStatus.isRegistering;
  const statusLabel  = isSettingUp ? 'Setting up…' : walletStatus.isReady ? 'Ready' : 'Starting…';
  const shortAddr    = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '';
  const initials     = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email ? user.email[0].toUpperCase() : '?';

  /* shared icon stroke for action buttons */
  const iconStroke = 'var(--accent)';

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 20px 56px' }}>

      {/* ── Header ── */}
      <header className="page-entry" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', paddingBottom: '4px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Image src="/icon-black.png" alt="Cavos" width={22} height={22} style={{ filter: 'invert(1)', opacity: 0.55 }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-2)', textTransform: 'uppercase' }}>Cavos</span>
        </div>

        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '100px', padding: '5px 11px',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isSettingUp ? 'var(--accent)' : walletStatus.isReady ? 'var(--green)' : 'var(--text-3)',
            boxShadow: walletStatus.isReady ? '0 0 6px var(--green)' : 'none',
            animation: isSettingUp ? 'pulse 1.4s ease-in-out infinite' : 'none',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.01em' }}>{statusLabel}</span>
        </div>

        {/* Avatar */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            color: 'var(--text-2)', letterSpacing: '0.02em',
          }}
        >{initials}</button>
      </header>

      {/* ── Balance ── */}
      <div className="page-entry page-entry-delay-1" style={{ textAlign: 'center', paddingTop: '44px', paddingBottom: '32px' }}>
        {isLoading ? (
          <div className="shimmer" style={{ width: '160px', height: '56px', borderRadius: '12px', margin: '0 auto 20px' }} />
        ) : balanceHidden ? (
          <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', alignItems: 'center', height: '60px', marginBottom: '8px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-2)' }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'clamp(40px, 11vw, 56px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' }}>
            {fmtUsd(totalUsd)}
          </p>
        )}

        <button
          onClick={() => setBalanceHidden(h => !h)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '8px' }}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            {balanceHidden
              ? <path d="M10 4C5 4 1 10 1 10s4 6 9 6 9-6 9-6-4-6-9-6zm0 9a3 3 0 110-6 3 3 0 010 6z" stroke="var(--text-3)" strokeWidth="1.5" />
              : <path d="M3 3l14 14M10 4C5 4 1 10 1 10s1.6 2.4 4 4M17 8c1.1 1.2 2 2 2 2s-4 6-9 6a8 8 0 01-3.5-.8" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" />
            }
          </svg>
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
            {balanceHidden ? 'Show' : 'Hide'}
          </span>
        </button>

        {/* Address */}
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={copyAddress}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '6px 12px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-2)' }}>{shortAddr}</span>
            {addrCopied
              ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="var(--text-3)" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="var(--text-3)" strokeWidth="1.2" /></svg>
            }
          </button>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="action-row page-entry page-entry-delay-2" style={{ marginBottom: '32px' }}>
        {/* Fund */}
        <button className="action-btn" onClick={handleFund}>
          <div className="action-btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="action-btn-label">Fund</span>
        </button>

        {/* Send */}
        <button className="action-btn" onClick={() => setModal({ type: 'send', asset: activeTab === 'bitcoin' ? 'BTC' : 'USDC' })}>
          <div className="action-btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 19L19 5M19 5H10M19 5v9" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Send</span>
        </button>

        {/* Receive */}
        <button className="action-btn" onClick={() => setModal({ type: 'receive', asset: activeTab === 'bitcoin' ? 'BTC' : 'USDC' })}>
          <div className="action-btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19M5 19h9M5 19v-9" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Receive</span>
        </button>

        {/* Swap */}
        <button className="action-btn" onClick={() => setModal({ type: btcN > 0 ? 'sell' : 'buy' })}>
          <div className="action-btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M7 16V4M7 4L4 7M7 4l3 3" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 8v12M17 20l3-3M17 20l-3-3" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Swap</span>
        </button>
      </div>

      {/* ── Tabs + asset list ── */}
      <div className="page-entry page-entry-delay-3" style={{ flex: 1 }}>
        <div className="tab-bar" style={{ marginBottom: '4px' }}>
          <button className={`tab-item${activeTab === 'account' ? ' active' : ''}`} onClick={() => setActiveTab('account')}>Cash</button>
          <button className={`tab-item${activeTab === 'bitcoin' ? ' active' : ''}`} onClick={() => setActiveTab('bitcoin')}>Bitcoin</button>
        </div>

        {/* USDC tab */}
        {activeTab === 'account' && (
          isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
              <div className="shimmer" style={{ width: '42px', height: '42px', borderRadius: '12px' }} />
              <div><div className="shimmer" style={{ width: '70px', height: '13px', marginBottom: '6px' }} /><div className="shimmer" style={{ width: '45px', height: '11px' }} /></div>
            </div>
          ) : (
            <>
              <div className="asset-row" onClick={() => setModal({ type: 'send', asset: 'USDC' })}>
                <UsdcIcon />
                <div className="asset-info">
                  <div className="asset-name">USDC</div>
                  <div className="asset-sub">USD Coin</div>
                </div>
                <div className="asset-amount">
                  <div className="asset-amount-main">{balanceHidden ? '••••' : fmtUsd(usdcN)}</div>
                  {usdcN === 0 && <div className="asset-amount-sub">empty</div>}
                </div>
              </div>

              {usdcN === 0 && (
                <button
                  onClick={handleFund}
                  style={{
                    marginTop: '20px', width: '100%',
                    background: 'var(--accent)', border: 'none', borderRadius: '14px',
                    padding: '15px', fontSize: '15px', fontWeight: 600, color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'filter 0.15s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  Add money to get started
                </button>
              )}
            </>
          )
        )}

        {/* Bitcoin tab */}
        {activeTab === 'bitcoin' && (
          isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
              <div className="shimmer" style={{ width: '42px', height: '42px', borderRadius: '12px' }} />
              <div><div className="shimmer" style={{ width: '70px', height: '13px', marginBottom: '6px' }} /><div className="shimmer" style={{ width: '55px', height: '11px' }} /></div>
            </div>
          ) : (
            <>
              <div className="asset-row">
                <BtcIcon />
                <div className="asset-info">
                  <div className="asset-name">Bitcoin</div>
                  <div className="asset-sub">{balanceHidden ? '•••' : `${fmtBtc(btcN)} BTC`}</div>
                </div>
                <div className="asset-amount">
                  <div className="asset-amount-main">{balanceHidden ? '••••' : fmtUsd(btcUsd)}</div>
                  {btcN === 0 && <div className="asset-amount-sub">≈ {fmtUsd(BTC_PRICE_USD)}/BTC</div>}
                </div>
              </div>

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
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
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
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  Sell
                </button>
              </div>
            </>
          )
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'send' && (
        <SendModal asset={modal.asset} balance={modal.asset === 'BTC' ? btc : usdc} onClose={() => setModal(null)} onSend={async (to, amt) => { await handleSend(modal.asset, to, amt); }} />
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
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
}
