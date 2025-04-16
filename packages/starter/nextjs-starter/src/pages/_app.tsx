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
import { ChainContextProvider } from '../context/ChainContextProvider';
import { SelectedWalletAccountContextProvider } from '../context/SelectedWalletAccountProvider';
import { RpcContextProvider } from '../context/RpcContextProvider';
import { Theme } from '@radix-ui/themes'; // TODO: remove all radix

// Use require instead of import since order matters

require('../styles/globals.css');



const Context: FC<{ children: ReactNode }> = ({ children }) => {


    return (
            <ChainContextProvider>
                <SelectedWalletAccountContextProvider>
                    <RpcContextProvider>
                        {children}
                </RpcContextProvider>
                </SelectedWalletAccountContextProvider>
            </ChainContextProvider>
    );
};

const App: FC<{ Component: FC<any>; pageProps: any }> = ({ Component, pageProps }) => {

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
