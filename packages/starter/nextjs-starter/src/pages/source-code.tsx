import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useContext, useState } from 'react';
import styles from '../styles/Home.module.css';
import { UserContext } from '../UserContext';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getUTCTime } from '../utils';

const Transfer: NextPage = () => {
    const pubkeyObj = useContext(UserContext);
    const [currentTime, setCurrentTime] = useState(getUTCTime());
    const [transferring, setTransferring] = useState(false);
    const [transferStatus, setTransferStatus] = useState('');

    const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=56f5d18f-ce0f-495b-a381-f77fe1e237da', 'confirmed');
    const RECIPIENT_ADDRESS = 'D96EFRTeN2PSxqUfiHEQyKmwHLAE39Lcq23W2v5FJi8V';

    const handleTransfer = async () => {
        if (!pubkeyObj || !window.solana) {
            setTransferStatus('Please connect your wallet first');
            return;
        }

        try {
            setTransferring(true);
            setTransferStatus('Creating transaction...');

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: pubkeyObj,
                    toPubkey: new PublicKey(RECIPIENT_ADDRESS),
                    lamports: 30 * LAMPORTS_PER_SOL
                })
            );

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = pubkeyObj;

            setTransferStatus('Please approve the transaction in your wallet...');
            const signed = await window.solana.signTransaction(transaction);
            
            setTransferStatus('Sending transaction...');
            const signature = await connection.sendRawTransaction(signed.serialize());
            
            setTransferStatus('Confirming transaction...');
            await connection.confirmTransaction(signature);
            
            setTransferStatus('Transfer successful! Signature: ' + signature);
        } catch (error) {
            console.error('Transfer failed:', error);
            setTransferStatus('Transfer failed: ' + (error as Error).message);
        } finally {
            setTransferring(false);
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Source Code Purchase</title>
                <meta name="description" content="Rude Bot Source Code Purchase" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <p className={styles.description}>
                    <code className={styles.code}>Rude Bot Source Code Purchase</code>
                </p>

                <p>Time: {currentTime} UTC</p>
                <p>Connected Wallet: {pubkeyObj?.toBase58() || 'Not Connected'}</p>
                <p>Recipient: {RECIPIENT_ADDRESS}</p>
                <p>Amount: 30 SOL</p>

                <button 
                    className={styles.button}
                    onClick={handleTransfer}
                    disabled={transferring || !pubkeyObj}
                >
                    {transferring ? 'Processing...' : 'Transfer 30 SOL'}
                </button>

                {transferStatus && (
                    <p className={styles.description}>
                        {transferStatus}
                    </p>
                )}
            </main>
        </div>
    );
};

export default Transfer; 