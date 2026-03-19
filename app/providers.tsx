'use client';

import { CavosProvider } from '@cavos/react';

// Starknet Mainnet token addresses
export const USDC_ADDRESS = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
export const WBTC_ADDRESS = '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac';

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
            allowedContracts: [USDC_ADDRESS, WBTC_ADDRESS],
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
