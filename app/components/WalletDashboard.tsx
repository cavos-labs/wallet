'use client';

import { useState, useEffect, useCallback } from 'react';
import { RpcProvider, uint256 } from 'starknet';
import Image from 'next/image';
import { useCavos } from '@cavos/react';
import { AssetCard } from './AssetCard';
import { SendModal } from './SendModal';
import { ReceiveModal } from './ReceiveModal';
import { USDC_ADDRESS, WBTC_ADDRESS } from '../providers';

// Mainnet RPC
const provider = new RpcProvider({
  nodeUrl: 'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/dql5pMT88iueZWl7L0yzT56uVk0EBU4L',
});

type ModalState =
  | { type: 'send'; asset: 'BTC' | 'USDC' }
  | { type: 'receive'; asset: 'BTC' | 'USDC' }
  | null;

interface Balances {
  btc: string;
  usdc: string;
}

export function WalletDashboard() {
  const { address, user, logout, execute, walletStatus } = useCavos();
  const [modal, setModal] = useState<ModalState>(null);
  const [balances, setBalances] = useState<Balances>({ btc: '0.00000000', usdc: '0.00' });
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    try {
      const [btcResult, usdcResult] = await Promise.all([
        provider.callContract({
          contractAddress: WBTC_ADDRESS,
          entrypoint: 'balanceOf',
          calldata: [address],
        }),
        provider.callContract({
          contractAddress: USDC_ADDRESS,
          entrypoint: 'balanceOf',
          calldata: [address],
        }),
      ]);

      const btcBal = uint256.uint256ToBN({ low: btcResult[0], high: btcResult[1] });
      const usdcBal = uint256.uint256ToBN({ low: usdcResult[0], high: usdcResult[1] });

      setBalances({
        btc: (Number(btcBal) / 1e8).toFixed(8),
        usdc: (Number(usdcBal) / 1e6).toFixed(2),
      });
    } catch (e) {
      console.error('[Wallet] Balance fetch error:', e);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const handleSend = async (asset: 'BTC' | 'USDC', to: string, amount: string) => {
    const tokenAddress = asset === 'BTC' ? WBTC_ADDRESS : USDC_ADDRESS;
    const decimals = asset === 'BTC' ? 8 : 6;
    const amountWei = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
    const mask128 = (BigInt(1) << BigInt(128)) - BigInt(1);

    const txHash = await execute({
      contractAddress: tokenAddress,
      entrypoint: 'transfer',
      calldata: [
        to,
        (amountWei & mask128).toString(),
        (amountWei >> BigInt(128)).toString(),
      ],
    });

    showToast(`Transaction sent · ${txHash.slice(0, 12)}…`);
    setTimeout(fetchBalances, 5000);
    return txHash;
  };

  // Wallet status badge
  const statusLabel = walletStatus.isDeploying
    ? 'Deploying…'
    : walletStatus.isRegistering
    ? 'Activating…'
    : walletStatus.isReady
    ? 'Active'
    : 'Pending';

  const statusColor = walletStatus.isReady
    ? '#3DD68C'
    : walletStatus.isDeploying || walletStatus.isRegistering
    ? '#F7931A'
    : 'var(--text-muted)';

  // Truncate address
  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  // User initials
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : '?';

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{ maxWidth: '420px', margin: '0 auto', padding: '0 20px 40px' }}
    >
      {/* Background ambients */}
      <div
        style={{
          position: 'fixed',
          top: '10%',
          right: '-10%',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(247,147,26,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '15%',
          left: '-10%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(39,117,202,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <header
        className="page-entry flex items-center justify-between"
        style={{ paddingTop: '24px', paddingBottom: '8px' }}
      >
        <Image
          src="/icon-black.png"
          alt="Cavos"
          width={28}
          height={28}
          style={{ filter: 'invert(1)', opacity: 0.7 }}
        />

        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '5px 12px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: statusColor,
                boxShadow: walletStatus.isReady ? `0 0 6px ${statusColor}` : 'none',
                display: 'inline-block',
                animation:
                  walletStatus.isDeploying || walletStatus.isRegistering
                    ? 'pulse 1.5s infinite'
                    : 'none',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                color: statusColor,
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.02em',
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Avatar */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              transition: 'border-color 0.15s, opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Portfolio summary */}
      <div
        className="page-entry page-entry-delay-1"
        style={{ paddingTop: '36px', paddingBottom: '8px' }}
      >
        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          Portfolio
        </p>

        <div className="flex items-end gap-3 flex-wrap">
          {/* Address chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {shortAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'var(--border)',
          margin: '20px 0',
        }}
      />

      {/* Asset cards */}
      <div
        className="page-entry page-entry-delay-2 flex flex-col gap-4"
        style={{ flex: 1 }}
      >
        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '4px',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          Assets
        </p>

        <AssetCard
          symbol="BTC"
          name="Bitcoin"
          balance={balances.btc}
          usdValue={`≈ $${(parseFloat(balances.btc) * 97000).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`}
          isLoading={isLoadingBalances}
          onSend={() => setModal({ type: 'send', asset: 'BTC' })}
          onReceive={() => setModal({ type: 'receive', asset: 'BTC' })}
        />

        <AssetCard
          symbol="USDC"
          name="USD Coin"
          balance={balances.usdc}
          usdValue={`≈ $${parseFloat(balances.usdc).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`}
          isLoading={isLoadingBalances}
          onSend={() => setModal({ type: 'send', asset: 'USDC' })}
          onReceive={() => setModal({ type: 'receive', asset: 'USDC' })}
        />
      </div>

      {/* Footer note */}
      <div
        className="page-entry page-entry-delay-3"
        style={{ marginTop: '32px', textAlign: 'center' }}
      >
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          Starknet Mainnet · Gasless
        </p>
      </div>

      {/* Modals */}
      {modal?.type === 'send' && (
        <SendModal
          asset={modal.asset}
          balance={modal.asset === 'BTC' ? balances.btc : balances.usdc}
          onClose={() => setModal(null)}
          onSend={async (to, amount) => { await handleSend(modal.asset, to, amount); }}
        />
      )}

      {modal?.type === 'receive' && address && (
        <ReceiveModal
          asset={modal.asset}
          address={address}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
