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

type Tab = 'cash' | 'bitcoin';

/* ────────────────────────────────────── */

export function WalletDashboard() {
  const { address, user, logout, execute, getOnramp, walletStatus } = useCavos();

  const [modal, setModal]                   = useState<ModalState>(null);
  const [tab, setTab]                       = useState<Tab>('cash');
  const [btc, setBtc]                       = useState('0');
  const [usdc, setUsdc]                     = useState('0');
  const [loading, setLoading]               = useState(true);
  const [hidden, setHidden]                 = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);
  const [copied, setCopied]                 = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    try {
      const [b, u] = await Promise.all([
        rpc.callContract({ contractAddress: WBTC_ADDRESS, entrypoint: 'balanceOf', calldata: [address] }),
        rpc.callContract({ contractAddress: USDC_ADDRESS, entrypoint: 'balanceOf', calldata: [address] }),
      ]);
      setBtc((Number(uint256.uint256ToBN({ low: b[0], high: b[1] })) / 1e8).toString());
      setUsdc((Number(uint256.uint256ToBN({ low: u[0], high: u[1] })) / 1e6).toString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
    showToast(`Swapped · ${hash.slice(0, 10)}…`);
    setTimeout(fetchBalances, 8000);
  };

  const handleFund = () => {
    try { window.open(getOnramp('RAMP_NETWORK'), '_blank', 'noopener,noreferrer'); }
    catch { showToast('Funding unavailable right now'); }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Derived values ── */
  const btcN     = parseFloat(btc);
  const usdcN    = parseFloat(usdc);
  const btcUsd   = btcN * BTC_PRICE_USD;
  const total    = btcUsd + usdcN;

  const fmtUsd = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtBtc = (n: number) =>
    n === 0 ? '0.0000' : n < 0.0001 ? n.toFixed(8) : n.toFixed(4);

  const isSettingUp = walletStatus.isDeploying || walletStatus.isRegistering;
  const statusLabel = isSettingUp
    ? (walletStatus.isDeploying ? 'Setting up…' : 'Almost ready…')
    : walletStatus.isReady ? 'Ready' : 'Starting…';
  const shortAddr  = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
  const initials   = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email ? user.email[0].toUpperCase() : '?';

  /* ── Shared icon stroke ── */
  const S = 'rgba(255,255,255,0.85)';

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 20px 60px', position: 'relative', zIndex: 1 }}>

      {/* ── Header ── */}
      <header className="page-entry" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '22px', paddingBottom: '4px' }}>

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Image
            src="/icon-black.png"
            alt=""
            width={18}
            height={18}
            style={{ filter: 'invert(1)', opacity: 0.6 }}
          />
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '10px',
            letterSpacing: '0.14em',
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Cavos
          </span>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          padding: '5px 10px',
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: walletStatus.isReady
              ? 'var(--green)'
              : isSettingUp ? 'rgba(255,255,255,0.5)' : 'var(--text-3)',
            boxShadow: walletStatus.isReady ? '0 0 5px var(--green)' : 'none',
            animation: isSettingUp ? 'pulse 1.4s ease-in-out infinite' : 'none',
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.01em' }}>
            {statusLabel}
          </span>
        </div>

        {/* Avatar */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            color: 'var(--text-2)', letterSpacing: '0.02em',
            transition: 'border-color 0.15s',
          }}
        >
          {initials}
        </button>
      </header>

      {/* ── Balance ── */}
      <div className="page-entry page-entry-delay-1" style={{ textAlign: 'center', paddingTop: '52px', paddingBottom: '40px' }}>

        {loading ? (
          <div className="shimmer" style={{ width: '180px', height: '66px', borderRadius: '10px', margin: '0 auto 20px' }} />
        ) : hidden ? (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', height: '66px', marginBottom: '8px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--text-2)' }} />
            ))}
          </div>
        ) : (
          <p style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            fontSize: 'clamp(44px, 12vw, 60px)',
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            {fmtUsd(total)}
          </p>
        )}

        {/* Toggle */}
        <button
          onClick={() => setHidden(h => !h)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 6px', marginBottom: '18px' }}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            {hidden
              ? <><path d="M10 4C5 4 1 10 1 10s4 6 9 6 9-6 9-6-4-6-9-6z" stroke="var(--text-3)" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.5" stroke="var(--text-3)" strokeWidth="1.5" /></>
              : <><path d="M3 3l14 14M10 4C5 4 1 10 1 10s1.5 2.2 3.8 3.9M17.2 8.1C18.3 9.3 19 10 19 10s-4 6-9 6a8.1 8.1 0 01-3.5-.8" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" /></>
            }
          </svg>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>
            {hidden ? 'Show balance' : 'Hide'}
          </span>
        </button>

        {/* Address */}
        <div>
          <button
            onClick={copyAddress}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 11px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-2)' }}>
              {shortAddr}
            </span>
            {copied
              ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              : <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="var(--text-3)" strokeWidth="1.2" /><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="var(--text-3)" strokeWidth="1.2" /></svg>
            }
          </button>
        </div>
      </div>

      {/* ── Action row ── */}
      <div className="page-entry page-entry-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '36px' }}>

        <button className="action-btn" onClick={handleFund}>
          <div className="action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke={S} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="action-btn-label">Fund</span>
        </button>

        <button className="action-btn" onClick={() => setModal({ type: 'send', asset: tab === 'bitcoin' ? 'BTC' : 'USDC' })}>
          <div className="action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 19L19 5M19 5H10M19 5v9" stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Send</span>
        </button>

        <button className="action-btn" onClick={() => setModal({ type: 'receive', asset: tab === 'bitcoin' ? 'BTC' : 'USDC' })}>
          <div className="action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19M5 19h9M5 19v-9" stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Receive</span>
        </button>

        <button className="action-btn" onClick={() => setModal({ type: btcN > 0 ? 'sell' : 'buy' })}>
          <div className="action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 16V4M7 4L4 7M7 4l3 3" stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 8v12M17 20l3-3M17 20l-3-3" stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="action-btn-label">Swap</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="page-entry page-entry-delay-3" style={{ flex: 1 }}>
        <div className="tab-bar" style={{ marginBottom: '4px' }}>
          <button className={`tab-item${tab === 'cash' ? ' active' : ''}`} onClick={() => setTab('cash')}>
            Cash
          </button>
          <button className={`tab-item${tab === 'bitcoin' ? ' active' : ''}`} onClick={() => setTab('bitcoin')}>
            Bitcoin
          </button>
        </div>

        {/* ── Cash tab ── */}
        {tab === 'cash' && (
          loading ? (
            <SkeletonRow />
          ) : (
            <>
              <div className="asset-row" onClick={() => setModal({ type: 'send', asset: 'USDC' })}>
                <div className="asset-icon" style={{ background: 'rgba(39,117,202,0.1)', border: '1px solid rgba(39,117,202,0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#2775CA" strokeWidth="1.5" />
                    <path d="M14.5 9.5a2.5 2.5 0 00-2.5-2v-1M9.5 14.5a2.5 2.5 0 002.5 2v1M9 10.5h4a1.5 1.5 0 010 3H9.5a1.5 1.5 0 000 3H13" stroke="#2775CA" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="asset-info">
                  <div className="asset-name">USDC</div>
                  <div className="asset-sub">USD Coin</div>
                </div>
                <div className="asset-amount">
                  <div className="asset-amount-main">{hidden ? '••••' : fmtUsd(usdcN)}</div>
                  {usdcN === 0 && <div className="asset-amount-sub">empty</div>}
                </div>
              </div>

              {usdcN === 0 && (
                <div style={{ paddingTop: '24px' }}>
                  <button className="btn-primary" onClick={handleFund} style={{ fontSize: '14px', padding: '14px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                    Add money to get started
                  </button>
                </div>
              )}
            </>
          )
        )}

        {/* ── Bitcoin tab ── */}
        {tab === 'bitcoin' && (
          loading ? (
            <SkeletonRow />
          ) : (
            <>
              <div className="asset-row" style={{ cursor: 'default' }} onClick={undefined}>
                <div className="asset-icon" style={{ background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 8h5a2 2 0 010 4H9m0 0h6a2 2 0 010 4H9M9 8V6M9 16v2M12 8V6M12 16v2" stroke="#F7931A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="asset-info">
                  <div className="asset-name">Bitcoin</div>
                  <div className="asset-sub">{hidden ? '•••' : `${fmtBtc(btcN)} BTC`}</div>
                </div>
                <div className="asset-amount">
                  <div className="asset-amount-main">{hidden ? '••••' : fmtUsd(btcUsd)}</div>
                  {btcN === 0 && <div className="asset-amount-sub">≈ {fmtUsd(BTC_PRICE_USD)}/BTC</div>}
                </div>
              </div>

              {/* Buy / Sell */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '16px' }}>
                <button
                  className="btn-primary"
                  onClick={() => setModal({ type: 'buy' })}
                  style={{ fontSize: '13px', padding: '13px', gap: '6px' }}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  Buy
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setModal({ type: 'sell' })}
                  disabled={btcN === 0}
                  style={{ fontSize: '13px' }}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  Sell
                </button>
              </div>
            </>
          )
        )}
      </div>

      {/* ── Modals ── */}
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
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
      <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="shimmer" style={{ width: '60px', height: '12px', marginBottom: '7px' }} />
        <div className="shimmer" style={{ width: '40px', height: '10px' }} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="shimmer" style={{ width: '70px', height: '12px', marginBottom: '7px' }} />
        <div className="shimmer" style={{ width: '45px', height: '10px', marginLeft: 'auto' }} />
      </div>
    </div>
  );
}
