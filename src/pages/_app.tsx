import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { LedgerWalletAdapter, PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import type { AppProps } from 'next/app';
import type { FC, ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import {UserContext} from '../UserContext';
import dynamic from 'next/dynamic';
import Navbar from '../components/navbar';
import { Router } from 'next/router';
import styles from '../styles/Loading.module.css';

// Use require instead of import since order matters
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');



const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Mainnet;

    // You can also provide a custom RPC endpoint.
    //clusterApiUrl(network)
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
        ],
        [network]
    );


    return (
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        {children}
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
    );
};

const App: FC<{ Component: FC<any>; pageProps: any }> = ({ Component, pageProps }) => {
    const WalletMultiButtonDynamic = dynamic(
        async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
        { ssr: false }
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        Router.events.on('routeChangeStart', () => {
            timer = setTimeout(() => setLoading(true), 250);
        });

        Router.events.on('routeChangeComplete', () => {
            clearTimeout(timer);
            setLoading(false);
        });

        Router.events.on('routeChangeError', () => {
            clearTimeout(timer);
            setLoading(false);
        });

        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.loadingSpinner}></div>
                </div>
            )}
            <Context>
            {/* <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1, margin: 12 }}>
            <WalletMultiButtonDynamic />
            </div> */}
                <Navbar />

                <Content Component={Component} pageProps={pageProps} />
            </Context>

        </>

    );
};

const Content: FC<{ Component: FC<any>; pageProps: any }> = ({ Component, pageProps }) => {

    const { publicKey } = useWallet();



    useEffect(() => {

        (async() => {

            try {
        
console.log("publicKey", publicKey)
                
            } catch (error) {
        
                console.log(error)
                
            }
        
        
        })();


    }, [publicKey]);



    return(

        <UserContext.Provider value={publicKey}>
<Component {...pageProps} />
    </UserContext.Provider>


    


    ) ;
};

export default App;
