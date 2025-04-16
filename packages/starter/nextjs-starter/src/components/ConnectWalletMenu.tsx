import { StandardConnect, StandardDisconnect } from '@wallet-standard/core';
import type { UiWallet } from '@wallet-standard/react';
import { uiWalletAccountBelongsToUiWallet, useWallets } from '@wallet-standard/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { SelectedWalletAccountContext } from '../context/SelectedWalletAccountContext';
import { ConnectWalletMenuItem } from './ConnectWalletMenuItem';
import { DisconnectButton } from './DisconnectButton';
import { UnconnectableWalletMenuItem } from './UnconnectableWalletMenuItem';
import { WalletAccountIcon } from './WalletAccountIcon';

import styles from '../styles/ConnectWalletMenu.module.css';

type Props = Readonly<{
    children: React.ReactNode;
}>;

export function ConnectWalletMenu({ children }: Props) {
    const { current: NO_ERROR } = useRef(Symbol());
    const wallets = useWallets();
    const [selectedWalletAccount, setSelectedWalletAccount] = useContext(SelectedWalletAccountContext);
    const [error, setError] = useState(NO_ERROR);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Filter wallets that support Solana mainnet
    const filteredWallets = wallets.filter(wallet => 
        wallet.chains.some(chain => 
            chain === 'solana:mainnet' || chain === 'solana:mainnet.beta'
        )
    );
    
    // Find all connected wallets (wallets with accounts)
    const connectedWallets = filteredWallets.filter(wallet => wallet.accounts.length > 0);
    
    
    // If we have connected wallets but no selected wallet account, select the first account of the first wallet
    useEffect(() => {
        if (!selectedWalletAccount && connectedWallets.length > 0 && connectedWallets[0].accounts.length > 0) {
            setSelectedWalletAccount(connectedWallets[0].accounts[0]);
        }
        console.log('connectedWallets', connectedWallets);
        console.log('selectedWalletAccount', selectedWalletAccount);
    }, [connectedWallets, selectedWalletAccount, setSelectedWalletAccount]);
    
    // Close the menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    
    function renderItem(wallet: UiWallet, index: number) {
        return (
            <ErrorBoundary
                fallbackRender={({ error }) => <UnconnectableWalletMenuItem error={error} wallet={wallet} />}
                key={`wallet:${wallet.name}:${index}`}
            >
                <ConnectWalletMenuItem
                    onAccountSelect={account => {
                        setSelectedWalletAccount(account);
                        setIsOpen(false);
                    }}
                    onDisconnect={wallet => {
                        if (selectedWalletAccount && uiWalletAccountBelongsToUiWallet(selectedWalletAccount, wallet)) {
                            // If we're disconnecting the selected wallet, find another connected wallet to select
                            const otherConnectedWallets = connectedWallets.filter(w => w !== wallet);
                            if (otherConnectedWallets.length > 0 && otherConnectedWallets[0].accounts.length > 0) {
                                setSelectedWalletAccount(otherConnectedWallets[0].accounts[0]);
                            } else {
                                setSelectedWalletAccount(undefined);
                            }
                        }
                    }}
                    onError={setError}
                    wallet={wallet}
                />
            </ErrorBoundary>
        );
    }
    
    const walletsThatSupportStandardConnect = [];
    const unconnectableWallets = [];
    
    for (let i = 0; i < filteredWallets.length; i++) {
        const wallet = filteredWallets[i];
        if (wallet.features.includes(StandardConnect) && wallet.features.includes(StandardDisconnect)) {
            walletsThatSupportStandardConnect.push(wallet);
        } else {
            unconnectableWallets.push(wallet);
        }
    }
    
    return (
        <div className={styles.container} ref={menuRef}>
            <button 
                className={styles.button} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedWalletAccount ? (
                    <>
                        <WalletAccountIcon account={selectedWalletAccount} width="18" height="18" />
                        <span>{selectedWalletAccount.address.slice(0, 8)}</span>
                    </>
                ) : (
                    children
                )}
                <span className={styles.chevron}>▼</span>
            </button>
            
            {isOpen && (
                <div className={styles.dropdown}>
                    {filteredWallets.length === 0 ? (
                        <div className={styles.callout}>
                            <span className={styles.warningIcon}>⚠️</span>
                            <span>This browser has no wallets installed.</span>
                        </div>
                    ) : (
                        <>
                            {connectedWallets.length > 0 && (
                                <>
                                    <div className={styles.walletsHeader}>
                                        Connected Wallets
                                    </div>
                                    {connectedWallets.map((wallet, index) => (
                                        <div key={`connected-wallet-${wallet.name}-${index}`} className={styles.connectedSection}>
                                            <div className={styles.connectedHeader}>
                                                <div className={styles.walletInfo}>
                                                    {wallet.icon && (
                                                        <img 
                                                            src={wallet.icon}
                                                            alt={`${wallet.name} icon`}
                                                            className={styles.walletIcon}
                                                        />
                                                    )}
                                                    <span>{wallet.name}</span>
                                                </div>
                                                <DisconnectButton 
                                                    wallet={wallet}
                                                    className={styles.disconnectButton}
                                                    onDisconnect={() => {
                                                        // If we're disconnecting the selected wallet, find another connected wallet to select
                                                        if (selectedWalletAccount && uiWalletAccountBelongsToUiWallet(selectedWalletAccount, wallet)) {
                                                            const otherConnectedWallets = connectedWallets.filter(w => w !== wallet);
                                                            if (otherConnectedWallets.length > 0 && otherConnectedWallets[0].accounts.length > 0) {
                                                                setSelectedWalletAccount(otherConnectedWallets[0].accounts[0]);
                                                            } else {
                                                                setSelectedWalletAccount(undefined);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {wallet.accounts.length > 0 && (
                                                <div className={styles.accountsList}>
                                                    {wallet.accounts.map(account => (
                                                        <div 
                                                            key={account.address}
                                                            className={`${styles.accountItem} ${
                                                                selectedWalletAccount?.address === account.address ? styles.selectedAccount : ''
                                                            }`}
                                                            onClick={() => {
                                                                setSelectedWalletAccount(account);
                                                                setIsOpen(false);
                                                            }}
                                                        >
                                                            <span className={styles.accountAddress}>
                                                                {account.address.slice(0, 8)}...{account.address.slice(-6)}
                                                            </span>
                                                            {selectedWalletAccount?.address === account.address && (
                                                                <span className={styles.checkmark}>✓</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className={styles.separator}></div>
                                </>
                            )}
                            
                            <div className={styles.walletsHeader}>
                                Available Wallets
                            </div>
                            
                            {walletsThatSupportStandardConnect.map((wallet, index) => renderItem(wallet, index))}
                            {unconnectableWallets.length > 0 && (
                                <>
                                    <div className={styles.separator}></div>
                                    {unconnectableWallets.map((wallet, index) => 
                                        renderItem(wallet, index + walletsThatSupportStandardConnect.length)
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
            
            {error !== NO_ERROR && (
                <div className={styles.errorDialog}>
                    <div className={styles.errorDialogContent}>
                        <h3>Error</h3>
                        <p>{typeof error === 'object' && error !== null && 'message' in error 
                            ? (error as Error).message 
                            : String(error)}</p>
                        <button onClick={() => setError(NO_ERROR)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
