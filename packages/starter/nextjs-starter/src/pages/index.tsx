import type { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Image from 'next/image';
import React, { useContext, useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { UserContext } from '../UserContext';
import { AtaRecord } from '../types';
import { fetchAtaRecords, insertNewAtaRecord } from '../apiFunctions';
import { Connection, PublicKey } from '@solana/web3.js'
import { delay, formatTime, getSolBalance, getUTCTime } from '../utils';

interface Item {
    id: number;
    created_at: string;
    test: number;
  }
  
  interface HomeProps {
    items: Item[];
  }


const Home: NextPage<HomeProps> = () => {

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
        // sol balance
        const [solBalance, setSolBalance] = useState(0);
        


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

                <div className={styles.mobileLinks}>

                <a href="https://www.youtube.com/watch?v=RNhc0KRa2AI" target="_blank" rel="noopener noreferrer">
                    <h2>
                        Beginner Tutorial
                    </h2>
                </a>
                <a href="https://discord.gg/6DTGbMNYuA" target="_blank" rel="noopener noreferrer">
                    <h2>
                        Discord
                    </h2>
                </a>

                <a href="https://github.com/AlexRubik/rude-bot-solana" target="_blank" rel="noopener noreferrer">
                    <h2>
                        GitHub
                    </h2>
                </a>

                <a href="https://rude-bot-org.gitbook.io/" target="_blank" rel="noopener noreferrer">
                    <h2>
                        Documentation
                    </h2>
                </a>
                </div>



                <p>Time: {currentTime} UTC</p>
                <p hidden={!pubkeyObj}>SOL Balance: {solBalance}</p>


            </main>


            <div>

    </div>
        </div>

        
    );
};


export default Home;
