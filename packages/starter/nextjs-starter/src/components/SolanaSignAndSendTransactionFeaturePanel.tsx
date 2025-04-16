import {
    address,
    appendTransactionMessageInstruction,
    assertIsTransactionMessageWithSingleSendingSigner,
    createTransactionMessage,
    getBase58Decoder,
    lamports,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signAndSendTransactionMessageWithSigners,
} from '@solana/kit';
import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import { getTransferSolInstruction } from '@solana-program/system';
import { getUiWalletAccountStorageKey, type UiWalletAccount, useWallets } from '@wallet-standard/react';
import type { SyntheticEvent } from 'react';
import { useContext, useId, useMemo, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import { ChainContext } from '../context/ChainContext';
import { RpcContext } from '../context/RpcContext';
import { ErrorDialog } from './ErrorDialog';

type Props = Readonly<{
    account: UiWalletAccount;
}>;

function solStringToLamports(solQuantityString: string) {
    if (Number.isNaN(parseFloat(solQuantityString))) {
        throw new Error('Could not parse token quantity: ' + String(solQuantityString));
    }
    
    // Convert to lamports directly using Number instead of BigInt
    const solValue = parseFloat(solQuantityString);
    const lamportsValue = BigInt(Math.round(solValue * 1e9)); // 1 SOL = 10^9 lamports
    
    return lamports(lamportsValue);
}

export function SolanaSignAndSendTransactionFeaturePanel({ account }: Props) {
    const { mutate } = useSWRConfig();
    const { current: NO_ERROR } = useRef(Symbol());
    const { rpc } = useContext(RpcContext);
    const wallets = useWallets();
    const [isSendingTransaction, setIsSendingTransaction] = useState(false);
    const [error, setError] = useState(NO_ERROR);
    const [lastSignature, setLastSignature] = useState<Uint8Array | undefined>();
    const [solQuantityString, setSolQuantityString] = useState<string>('');
    const [recipientAccountStorageKey, setRecipientAccountStorageKey] = useState<string | undefined>();
    const recipientAccount = useMemo(() => {
        if (recipientAccountStorageKey) {
            for (const wallet of wallets) {
                for (const account of wallet.accounts) {
                    if (getUiWalletAccountStorageKey(account) === recipientAccountStorageKey) {
                        return account;
                    }
                }
            }
        }
    }, [recipientAccountStorageKey, wallets]);
    const { chain: currentChain, solanaExplorerClusterName } = useContext(ChainContext);
    const transactionSendingSigner = useWalletAccountTransactionSendingSigner(account, currentChain);
    const lamportsInputId = useId();
    const recipientSelectId = useId();
    
    return (
        <div style={{ width: '100%' }}>
            <form
                onSubmit={async e => {
                    e.preventDefault();
                    setError(NO_ERROR);
                    setIsSendingTransaction(true);
                    try {
                        const amount = solStringToLamports(solQuantityString);
                        if (!recipientAccount) {
                            throw new Error('The address of the recipient could not be found');
                        }
                        const { value: latestBlockhash } = await rpc
                            .getLatestBlockhash({ commitment: 'confirmed' })
                            .send();
                        const message = pipe(
                            createTransactionMessage({ version: 0 }),
                            m => setTransactionMessageFeePayerSigner(transactionSendingSigner, m),
                            m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
                            m =>
                                appendTransactionMessageInstruction(
                                    getTransferSolInstruction({
                                        amount,
                                        destination: address(recipientAccount.address),
                                        source: transactionSendingSigner,
                                    }),
                                    m,
                                ),
                        );
                        assertIsTransactionMessageWithSingleSendingSigner(message);
                        const signature = await signAndSendTransactionMessageWithSigners(message);
                        void mutate({ address: transactionSendingSigner.address, chain: currentChain });
                        void mutate({ address: recipientAccount.address, chain: currentChain });
                        setLastSignature(signature);
                        setSolQuantityString('');
                    } catch (e) {
                        setLastSignature(undefined);
                        setError(e as any);
                    } finally {
                        setIsSendingTransaction(false);
                    }
                }}
            >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ minWidth: '90px', maxWidth: '130px' }}>
                        <input
                            id={lamportsInputId}
                            disabled={isSendingTransaction}
                            placeholder="Amount"
                            onChange={(e: SyntheticEvent<HTMLInputElement>) =>
                                setSolQuantityString(e.currentTarget.value)
                            }
                            style={{ width: '100%' }}
                            type="number"
                            value={solQuantityString}
                        />
                    </div>
                    <div>
                        <label htmlFor={recipientSelectId}>To Account</label>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <select
                            id={recipientSelectId}
                            disabled={isSendingTransaction}
                            onChange={(e) => setRecipientAccountStorageKey(e.target.value)}
                            value={recipientAccount ? getUiWalletAccountStorageKey(recipientAccount) : ''}
                            style={{ width: '100%' }}
                        >
                            <option value="">Select a Connected Account</option>
                            {wallets.flatMap(wallet =>
                                wallet.accounts
                                    .filter(({ chains }) => chains.includes(currentChain))
                                    .map(account => {
                                        const key = getUiWalletAccountStorageKey(account);
                                        return (
                                            <option key={key} value={key}>
                                                {account.address}
                                            </option>
                                        );
                                    }),
                            )}
                        </select>
                    </div>
                    <button
                        disabled={solQuantityString === '' || !recipientAccount || isSendingTransaction}
                        type="submit"
                    >
                        {isSendingTransaction ? 'Sending...' : 'Transfer'}
                    </button>
                </div>
                
                {lastSignature && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>You transferred tokens!</h3>
                            <div>
                                <p>Signature:</p>
                                <pre>
                                    {getBase58Decoder().decode(lastSignature)}
                                </pre>
                                <p>
                                    <a
                                        href={`https://explorer.solana.com/tx/${getBase58Decoder().decode(
                                            lastSignature,
                                        )}?cluster=${solanaExplorerClusterName}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View this transaction
                                    </a>{' '}
                                    on Explorer
                                </p>
                            </div>
                            <div>
                                <button onClick={() => setLastSignature(undefined)}>
                                    Cool!
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {error !== NO_ERROR && (
                    <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Transfer failed" />
                )}
            </form>
        </div>
    );
}
