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
    const connection2 = new Connection('https://mainnet.helius-rpc.com/?api-key=00a5355d-b3d8-4780-be65-58e83e1e0132', 'confirmed');


    const pubkeyObj = useContext(UserContext)

        // Define a state variable to hold the input value
        const [triggerUseEffect, setTriggerUseEffect] = useState(false);
        const [currentTime, setCurrentTime] = useState(getUTCTime());
        // tokens refreshing bool status
        // sol balance
        const [solBalance, setSolBalance] = useState(0);
        


        // console log the pubkeyObj when it changes
        useEffect(() => {
            (async () => {

                try {
                    setCurrentTime(getUTCTime());

                    if (!pubkeyObj) {
                        return;
                    }

                    let solBalance;
                    let cnx = connection;
                    let count = 0;
                    while (solBalance === undefined && count < 6) {
                        console.log(`Attempt ${count} to get sol balance`);
                        if (count > 3) {
                            cnx = connection2;
                        }
                    count++;
                    await delay(800);
                    solBalance = await getSolBalance(cnx, pubkeyObj);
                    setSolBalance(solBalance);

                    }
                    
                } catch (error) {
                    console.error(error);
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
                <a href="https://x.com/solanarbitrage" target="_blank" rel="noopener noreferrer">
                    <h2>
                        Twitter
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

                <a href="https://solscan.io/account/3tZPEagumHvtgBhivFJCmhV9AyhBHGW9VgdsK52i4gwP" target="_blank" rel="noopener noreferrer">
                    <h2>
                        On Chain Program 1
                    </h2>
                </a>

                <a href="https://solscan.io/account/72FXMcchZS4JRgQ62pKweYhHAkFA19PFoaqAUhWZmEFU" target="_blank" rel="noopener noreferrer">
                    <h2>
                        On Chain Program 2
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
