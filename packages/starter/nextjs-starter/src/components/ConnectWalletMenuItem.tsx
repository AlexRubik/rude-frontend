import { StandardConnect, StandardDisconnect } from '@wallet-standard/core';
import type { UiWallet, UiWalletAccount } from '@wallet-standard/react';
import { uiWalletAccountsAreSame, useConnect, useDisconnect } from '@wallet-standard/react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { SelectedWalletAccountContext } from '../context/SelectedWalletAccountContext';
import styles from '../styles/ConnectWalletMenuItem.module.css';

type Props = Readonly<{
    onAccountSelect(account: UiWalletAccount | undefined): void;
    onDisconnect(wallet: UiWallet): void;
    onError(err: unknown): void;
    wallet: UiWallet;
}>;

export function ConnectWalletMenuItem({ onAccountSelect, onDisconnect, onError, wallet }: Props) {
    // Check if wallet supports standard:connect
    const supportsConnect = wallet.features.includes(StandardConnect);
    const supportsDisconnect = wallet.features.includes(StandardDisconnect);
    
    // Only use these hooks if the wallet supports the features
    const [isConnecting, connect] = supportsConnect ? useConnect(wallet) : [false, async () => wallet.accounts];
    const [isDisconnecting, disconnect] = supportsDisconnect ? useDisconnect(wallet) : [false, async () => {}];
    
    const isPending = isConnecting || isDisconnecting;
    const isConnected = wallet.accounts.length > 0;
    const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const submenuRef = useRef<HTMLDivElement>(null);
    
    // Close submenu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
                setIsSubmenuOpen(false);
            }
        }
        
        if (isSubmenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSubmenuOpen]);
    
    const handleConnectClick = useCallback(async () => {
        try {
            if (!supportsConnect) {
                // For wallets that don't support standard:connect
                if (wallet.accounts.length > 0) {
                    onAccountSelect(wallet.accounts[0]);
                }
                return;
            }
            
            const existingAccounts = [...wallet.accounts];
            const nextAccounts = await connect();
            // Try to choose the first never-before-seen account.
            for (const nextAccount of nextAccounts) {
                if (!existingAccounts.some(existingAccount => uiWalletAccountsAreSame(nextAccount, existingAccount))) {
                    onAccountSelect(nextAccount);
                    return;
                }
            }
            // Failing that, choose the first account in the list.
            if (nextAccounts[0]) {
                onAccountSelect(nextAccounts[0]);
            }
        } catch (e) {
            onError(e);
        }
    }, [connect, onAccountSelect, onError, wallet.accounts, supportsConnect]);
    
    const handleDisconnectClick = useCallback(async () => {
        try {
            if (supportsDisconnect) {
                await disconnect();
            }
            onDisconnect(wallet);
            setIsSubmenuOpen(false);
        } catch (e) {
            onError(e);
        }
    }, [disconnect, onDisconnect, onError, supportsDisconnect, wallet]);
    
    const handleItemClick = () => {
        if (isConnected) {
            setIsSubmenuOpen(!isSubmenuOpen);
        } else {
            handleConnectClick();
        }
    };
    
    return (
        <div className={styles.menuItemContainer} ref={submenuRef}>
            <div 
                className={`${styles.menuItem} ${isPending ? styles.disabled : ''}`}
                onClick={handleItemClick}
            >
                <div className={styles.walletInfo}>
                    {wallet.icon && (
                        <img 
                            src={wallet.icon}
                            alt={`${wallet.name} icon`}
                            className={styles.walletIcon}
                        />
                    )}
                    <span className={styles.walletName}>{wallet.name}</span>
                </div>
                {isPending && <div className={styles.spinner}></div>}
                {isConnected && <span className={styles.chevron}>▶</span>}
            </div>
            
            {isSubmenuOpen && isConnected && (
                <div className={styles.submenu}>
                    <div className={styles.submenuLabel}>Accounts</div>
                    <div className={styles.accountsList}>
                        {wallet.accounts.map(account => (
                            <div 
                                key={account.address}
                                className={`${styles.accountItem} ${
                                    selectedWalletAccount?.address === account.address ? styles.selected : ''
                                }`}
                                onClick={() => {
                                    onAccountSelect(account);
                                    setIsSubmenuOpen(false);
                                }}
                            >
                                {account.address.slice(0, 8)}...
                                {selectedWalletAccount?.address === account.address && (
                                    <span className={styles.checkmark}>✓</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={styles.submenuSeparator}></div>
                    <div 
                        className={styles.submenuItem}
                        onClick={async (e) => {
                            e.stopPropagation();
                            await handleConnectClick();
                        }}
                    >
                        Connect More
                    </div>
                    <div 
                        className={`${styles.submenuItem} ${styles.disconnectItem}`}
                        onClick={async (e) => {
                            e.stopPropagation();
                            await handleDisconnectClick();
                        }}
                    >
                        Disconnect
                    </div>
                </div>
            )}
        </div>
    );
}
