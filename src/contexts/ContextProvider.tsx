import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CloverWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { FC, ReactNode, useCallback, useMemo } from 'react';
import { AutoConnectProvider, useAutoConnect } from './AutoConnectProvider';
import { notify } from '../utils/notifications';
import { NetworkConfigurationProvider, useNetworkConfiguration } from './NetworkConfigurationProvider';
import dynamic from 'next/dynamic';

// Prevent server-side rendering of wallet modal
const ReactUIWalletModalProviderDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletModalProvider),
  { ssr: false }
);

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { autoConnect } = useAutoConnect();
  const { networkConfiguration } = useNetworkConfiguration();
  const network = networkConfiguration as WalletAdapterNetwork;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Manually instantiate wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new CloverWalletAdapter(),
    ],
    [network]
  );

  const onError = useCallback(
    (error: WalletError) => {
      notify({
        type: 'error',
        message: error.message ? `${error.name}: ${error.message}` : error.name,
      });
      console.error(error);
    },
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
        <ReactUIWalletModalProviderDynamic>
          {children}
        </ReactUIWalletModalProviderDynamic>
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
