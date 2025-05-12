// src/views/basic.tsx/index.tsx
import { FC } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { GameCard } from '../../components/GameCard';

export const PlayView: FC = () => {
  const wallet = useAnchorWallet();

  return (
    // add vertical padding to push content away from header/footer
    <div className="w-full flex items-center justify-center py-20 px-4">
      {!wallet ? (
        <div className="w-full max-w-sm p-6 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-lg">
          <p className="text-white text-lg font-semibold text-center mb-6">
            Please connect your wallet to play
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      ) : (
        <GameCard />
      )}
    </div>
  );
};
