import { FC, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAutoConnect } from '../contexts/AutoConnectProvider';
import NetworkSwitcher from './NetworkSwitcher';
import NavElement from './nav-element';
import { Cog } from 'lucide-react';
import Image from 'next/image';



const WalletMultiButtonDynamic = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export const AppBar: FC = () => {
  const { autoConnect, setAutoConnect } = useAutoConnect();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--body-bg)] border-b border-[var(--card-border)] shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 md:px-10 h-20">
        {/* Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
          <Image src="/Logo1.png" alt="Logo" width={40} height={40} />
          </Link>
          <nav className="hidden md:flex gap-6">
            <NavElement
              label="Home"
              href="/"
              navigationStarts={() => setIsNavOpen(false)}
              className="text-[var(--text-main)]"
            />
            <NavElement
              label="Play"
              href="/play"
              navigationStarts={() => setIsNavOpen(false)}
              className="text-[var(--text-main)]"
            />
          </nav>
        </div>

        {/* Wallet + Settings + Hamburger */}
        <div className="flex items-center gap-4">
          <WalletMultiButtonDynamic />

          {/* Settings Dropdown */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-square btn-sm bg-gray-100 text-gray-800 hover:bg-gray-200">
              <Cog className="w-5 h-5" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-3 space-y-3 shadow-lg bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--card-border)] rounded-xl w-52"
            >
              <li>
                <label className="flex justify-between items-center cursor-pointer">
                  <span>Autoconnect</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={autoConnect}
                    onChange={(e) => setAutoConnect(e.target.checked)}
                  />
                </label>
              </li>
              <li>
                <NetworkSwitcher />
              </li>
            </ul>
          </div>

          {/* Mobile Nav Toggle */}
          <button
            onClick={() => setIsNavOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 border border-[var(--card-border)] rounded-md bg-[var(--body-bg)] transition"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
          >
            <span
              className={`block h-0.5 w-6 bg-[var(--text-main)] transition-transform ${
                isNavOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-[var(--text-main)] my-1 transition-opacity ${
                isNavOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-[var(--text-main)] transition-transform ${
                isNavOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isNavOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--body-bg)] border-b border-[var(--card-border)] px-4 py-4 z-40">
          <nav className="flex flex-col gap-4">
            <NavElement
              label="Home"
              href="/"
              navigationStarts={() => setIsNavOpen(false)}
              className="text-[var(--text-main)]"
            />
            <NavElement
              label="Play"
              href="/play"
              navigationStarts={() => setIsNavOpen(false)}
              className="text-[var(--text-main)]"
            />
          </nav>
        </div>
      )}
    </header>
  );
};
