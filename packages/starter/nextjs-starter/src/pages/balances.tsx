import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useContext, useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { UserContext } from '../UserContext';
import { AtaRecord } from '../types';
import { fetchAtaRecords, insertNewAtaRecord } from '../apiFunctions';
import { Connection, PublicKey } from '@solana/web3.js'
import { Account, getAccount } from '@solana/spl-token'
import { delay, formatTime, getSolBalance, getUTCTime, roundToFourDecimals } from '../utils';

interface Item {
    id: number;
    created_at: string;
    test: number;
  }
  
  interface HomeProps {
    items: Item[];
  }


const Balances: NextPage<HomeProps> = () => {

    const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=56f5d18f-ce0f-495b-a381-f77fe1e237da', 'confirmed');
    const connection2 = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');


    const pubkeyObj = useContext(UserContext)

        // Define a state variable to hold the input value
        const [ataInputValue, setAtaInputValue] = useState('');
        const [tokenNameInputValue, setTokenNameInputValue] = useState('');
        const [ataRecords, setAtaRecords] = useState<AtaRecord[]>([]);
        const [triggerUseEffect, setTriggerUseEffect] = useState(false);
        const [currentTime, setCurrentTime] = useState(getUTCTime());
        // tokens refreshing bool status
        const [refreshingTokens, setRefreshingTokens] = useState(false);
        // adding token
        const [addingToken, setAddingToken] = useState(false);
        // sol balance
        const [solBalance, setSolBalance] = useState(0);
        


        // Update inputValue whenever the user types in the input field
        const handleAtaInputChange = (e: any) => {
            setAtaInputValue(e.target.value);
        };

        const handleTokenNameInputChange = (e: any) => {
            setTokenNameInputValue(e.target.value);
        };


        const refreshTokens = async () => { 
            setRefreshingTokens(true);
            setTriggerUseEffect(!triggerUseEffect);

        };
        const addTokenOnClick = async () => {
            setAddingToken(true);
            await addToken();
            setAddingToken(false);


        }
        // add token function
        const addToken = async () => {
            console.log('Adding ata...');

            const alreadyExists = ataRecords.find((record) => record.ata === ataInputValue);
            if (alreadyExists) {
                return;
            }

            if (ataInputValue.length > 30 && tokenNameInputValue.length > 0 && tokenNameInputValue.length < 20 && pubkeyObj) {

                const ataPk = new PublicKey(ataInputValue);
                let ataAcc: Account | null = null;

                let attempts = 0;
                const maxRetries = 3;
    
                while (attempts < maxRetries && !ataAcc) {
                    try {
                        ataAcc = await getAccount(connection, ataPk, 'confirmed');
                        console.log('Account found for mint:', ataAcc.mint.toBase58());
                        if (!ataAcc) {
                            // If ataAcc is still null, try the second connection
                            console.log('Trying second connection...');
                            ataAcc = await getAccount(connection2, ataPk, 'confirmed');
                            console.log('Account found for mint:', ataAcc.mint.toBase58());
                        }
                    } catch (error) {
                        console.error('Attempt to get account failed:', error);
                        attempts++;
                        // Wait a bit before retrying
                        console.log('Retrying to get account...');
                        await delay(1000);
                    }
                }
            
                if (!ataAcc) {
                    setAddingToken(false);
                    throw new Error(`Failed to get account after ${maxRetries} attempts`);
                }
                const mint = ataAcc?.mint.toBase58();
                if (mint === null || mint === undefined) {
                    setAddingToken(false);
                    throw new Error('Failed to get mint address for: ' + ataInputValue);
                }
                // remove any whitespace from the ataInputValue
                const finalAtaStr = ataInputValue.replace(/\s/g, '');
                
                const ataRecord: AtaRecord = {
                    pubkey_ata: `${pubkeyObj.toBase58()}_${ataInputValue}`,
                    pubkey: pubkeyObj.toBase58(),
                    ata: finalAtaStr,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    daily_starting_bal: null,
                    weekly_starting_bal: null,
                    monthly_starting_bal: null,
                    decimals: null,
                    mint_address: mint,
                    mint_name: tokenNameInputValue,
                    current_bal: null,
                    difference: null,
                };

                const response = await insertNewAtaRecord(ataRecord);
                console.log(response);

                setAtaRecords([...ataRecords, ataRecord]);

                setAtaInputValue('');
                setTokenNameInputValue('');
                setAddingToken(false);
                setTriggerUseEffect(!triggerUseEffect);
            }
        };

        // console log the pubkeyObj when it changes
        useEffect(() => {
            (async () => {

                setCurrentTime(getUTCTime());
                const tempAtaRecords:AtaRecord[] = [];

                await fetchAtaRecords(pubkeyObj?.toBase58()).then((records) => {
                    setAtaRecords(records);
                    tempAtaRecords.push(...records);
                });
                await delay(700);


                // get all atas for the pubkey and then get the balance for each ata and assign it to the ata record current_bal
                console.log(pubkeyObj?.toBase58());
                console.log(ataRecords);
                console.log(tempAtaRecords);
                if (pubkeyObj !== null && pubkeyObj !== undefined) {
                    const solBalance = await getSolBalance(connection, pubkeyObj.toBase58());
                    setSolBalance(solBalance);
                    console.log(solBalance);
                    if (ataRecords.length > 0 || tempAtaRecords.length > 0) {
                        const updatedAtaRecords: AtaRecord[] = [];
                        // if ataRecords is empty, use tempAtaRecords
                        const ataRecordsToLoop = ataRecords.length > 0 ? ataRecords : tempAtaRecords;
                        setRefreshingTokens(true);
                        for (const ataRecord of ataRecordsToLoop) {
                            const ataPk = new PublicKey(ataRecord.ata);
                            await connection.getTokenAccountBalance(ataPk, 'confirmed').then((info) => {
                                ataRecord.current_bal = info.value.uiAmount;
                                ataRecord.difference = ataRecord.daily_starting_bal !== null && info.value.uiAmount !== null ? info.value.uiAmount - ataRecord.daily_starting_bal : null;
                                updatedAtaRecords.push(ataRecord);
                                
                            });
                            await delay(700);

                        }
                        setAtaRecords(updatedAtaRecords);
                        setRefreshingTokens(false);
                    }

                }

                
            })();
        }, [pubkeyObj, triggerUseEffect]);
    return (
        <div className={styles.container}>
            <Head>
                <title>Solana Arbitrage</title>
                <meta name="description" content="Everything you need to arbitrage on the Solana blockchain." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>

                
                <p className={styles.description}>
                   <code className={styles.code}>Token Balance Tracker</code>
                </p>
                <p>Start tracking balances for: {pubkeyObj?.toBase58()}</p>
                <input className={styles.input} type="text" value={ataInputValue} onChange={handleAtaInputChange} placeholder="Enter your associated token account address" />
                <input className={styles.input} type="text" value={tokenNameInputValue} onChange={handleTokenNameInputChange} placeholder="Enter the token name" />
                <button className={styles.button} hidden={pubkeyObj === null || pubkeyObj === undefined || addingToken} onClick={addTokenOnClick}>Add Token</button>
                <p>Time: {currentTime} UTC</p>
                <p>SOL Balance: {solBalance}</p>
                <button className={styles.button} hidden={refreshingTokens || pubkeyObj === null || pubkeyObj === undefined} onClick={refreshTokens}>Refresh Tokens</button>
                <p hidden={!refreshingTokens}>Fetching balances...</p>

      <ul>
      <table className={styles.table}>
            <tbody>
            <tr>
                <th>Token</th>
                <th>Today's Starting Balance</th>
                <th>Current Balance</th>
                <th>Difference</th>
                </tr>
                {ataRecords?.map((item) => (
      <tr key={item.ata}>
        <td title={item.mint_address !== null ? item.mint_address : ''}>{item.mint_name || 'N/A'}</td>
        <td>{item.daily_starting_bal !== null ? roundToFourDecimals(item.daily_starting_bal) : 'N/A'}</td>
        <td>{item.current_bal ? roundToFourDecimals(item.current_bal) : 'N/A'}</td>
        <td>{item.difference ? roundToFourDecimals(item.difference) : 'N/A'}</td>
      </tr>
    ))}
            </tbody>
            </table>
      </ul>

            </main>


            <div>

    </div>
        </div>

        
    );
};

// export const getServerSideProps: GetServerSideProps = async () => {
//     const items = await getAt();
//     return { props: { items } };
//   };

export default Balances;