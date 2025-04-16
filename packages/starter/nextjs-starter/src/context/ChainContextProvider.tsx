import { mainnet, testnet } from '@solana/kit';
import { useMemo, useState } from 'react';

import { ChainContext, DEFAULT_CHAIN_CONFIG } from './ChainContext';

const STORAGE_KEY = 'solana-example-react-app:selected-chain';

export function ChainContextProvider({ children }: { children: React.ReactNode }) {
    const [chain, setChain] = useState('solana:mainnet');
    const contextValue = useMemo<ChainContext>(() => {
        switch (chain) {
            
            case 'solana:mainnet':
                if (process.env.ENABLE_MAINNET === 'true') {
                    return {
                        chain: 'solana:mainnet',
                        displayName: 'Mainnet',
                        solanaExplorerClusterName: 'mainnet-beta',
                        solanaRpcSubscriptionsUrl: mainnet('wss://api.mainnet-beta.solana.com'),
                        solanaRpcUrl: mainnet(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'),
                    };
                }
            // falls through
            // case 'solana:testnet':
                
            //     return {
            //         chain: 'solana:testnet',
            //         displayName: 'Testnet',
            //         solanaExplorerClusterName: 'testnet',
            //         solanaRpcSubscriptionsUrl: testnet('wss://api.testnet.solana.com'),
            //         solanaRpcUrl: testnet('https://api.testnet.solana.com'),
            //     };
            // case 'solana:devnet':
            default:
                if (chain !== 'solana:mainnet') {
                    localStorage.removeItem(STORAGE_KEY);
                    console.error(`Unrecognized chain \`${chain}\``);
                }
                return DEFAULT_CHAIN_CONFIG;
        }
    }, [chain]);
    return (
        <ChainContext.Provider
            value={useMemo(
                () => ({
                    ...contextValue,
                    setChain(chain) {
                        localStorage.setItem(STORAGE_KEY, chain);
                        setChain(chain);
                    },
                }),
                [contextValue],
            )}
        >
            {children}
        </ChainContext.Provider>
    );
}