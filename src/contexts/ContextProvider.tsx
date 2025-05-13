'use client';

import { FC, ReactNode, useCallback, useMemo } from 'react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CloverWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-adapter-mobile';  // :contentReference[oaicite:0]{index=0}
import { clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';

import { AutoConnectProvider, useAutoConnect } from './AutoConnectProvider';
import {
  NetworkConfigurationProvider,
  useNetworkConfiguration,
} from './NetworkConfigurationProvider';
import { notify } from '../utils/notifications';

// SSR‐safe Wallet Modal
const WalletModalProvider = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletModalProvider),
  { ssr: false }
);

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { autoConnect } = useAutoConnect();
  const { networkConfiguration } = useNetworkConfiguration();
  const network = networkConfiguration as WalletAdapterNetwork;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Mobile adapter (deep‐links into Phantom Mobile, etc.)
  const mobileWallet = useMemo(
    () =>
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: 'Reveal255',
          uri: 'https://reveal255.vercel.app',
          icon: '/favicon.ico',
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: network,                                  // use WalletAdapterNetwork
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
    [network]
  );

  // Desktop & standard wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new CloverWalletAdapter(),
      mobileWallet,
    ],
    [network, mobileWallet]
  );

  const onError = useCallback(
    (error: WalletError) => {
      notify({ type: 'error', message: error.name, description: error.message });
      console.error(error);
    },
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => (
  <NetworkConfigurationProvider>
    <AutoConnectProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </AutoConnectProvider>
  </NetworkConfigurationProvider>
);
