// pages/_app.tsx
import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC, useEffect } from 'react';
import { ContextProvider } from '../contexts/ContextProvider';
import { AppBar } from '../components/AppBar';
import { Footer } from '../components/Footer';
import NotificationList from '../components/Notification';

// ✅ Order matters: Tailwind first, wallet styles next
import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const App: FC<AppProps> = ({ Component, pageProps }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'customglass');
    }
  }, []);

  return (
    <>
      <Head>
        <title>YourApp</title>
      </Head>

      <ContextProvider>
        <div className="flex flex-col min-h-screen">
          <NotificationList />

          {/* fixed header */}
          <AppBar />

          {/* main content */}
          <main className="flex-1 pt-20 px-4">
            <Component {...pageProps} />
          </main>

          <Footer />
        </div>
      </ContextProvider>
    </>
  );
};

export default App;
