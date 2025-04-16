import type { ClusterUrl } from '@solana/kit';
import { mainnet } from '@solana/kit';
import { createContext } from 'react';

export type ChainContext = Readonly<{
    chain: `solana:${string}`;
    displayName: string;
    setChain?(chain: `solana:${string}`): void;
    solanaExplorerClusterName: 'devnet' | 'mainnet-beta' | 'testnet';
    solanaRpcSubscriptionsUrl: ClusterUrl;
    solanaRpcUrl: ClusterUrl;
}>;

export const DEFAULT_CHAIN_CONFIG = Object.freeze({
    chain: 'solana:mainnet',
    displayName: 'Mainnet',
    solanaExplorerClusterName: 'mainnet-beta',
    solanaRpcSubscriptionsUrl: mainnet('wss://api.mainnet-beta.solana.com'),
    solanaRpcUrl: mainnet(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'),
});

export const ChainContext = createContext<ChainContext>(DEFAULT_CHAIN_CONFIG);