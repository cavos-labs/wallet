'use client';

import { CavosProvider } from '@cavos/react';

// Starknet Mainnet token addresses
export const USDC_ADDRESS = '0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb';
export const WBTC_ADDRESS = '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac';
// AVNU router — needed for swap approvals
const AVNU_ROUTER = '0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CavosProvider
      config={{
        appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID || '',
        network: 'mainnet',
        paymasterApiKey: process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY || '',
        enableLogging: false,
        session: {
          defaultPolicy: {
            allowedContracts: [USDC_ADDRESS, WBTC_ADDRESS, AVNU_ROUTER],
            spendingLimits: [],
            maxCallsPerTx: 3,
          },
        },
      }}
      modal={{
        appName: 'Cavos Wallet',
        appLogo: '/icon-black.png',
        providers: ['google', 'apple'],
        theme: 'dark',
      }}
    >
      {children}
    </CavosProvider>
  );
}
