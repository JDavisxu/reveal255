import { FC } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkConfiguration } from '../contexts/NetworkConfigurationProvider';

const NetworkSwitcher: FC = () => {
  const { networkConfiguration, setNetworkConfiguration } = useNetworkConfiguration();

  return (
    <select
      value={networkConfiguration}
      onChange={(e) => setNetworkConfiguration(e.target.value)}
      className="w-full px-3 py-2 text-sm bg-white text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
    >
      <option value="mainnet-beta">main</option>
      <option value="devnet">dev</option>
      <option value="testnet">test</option>
    </select>
  );
};

export default dynamic(() => Promise.resolve(NetworkSwitcher), { ssr: false });
