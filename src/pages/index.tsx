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
import { delay, getSolBalance, getUTCTime } from '../utils';
import { FaDiscord, FaGithub, FaYoutube, FaBook, FaXTwitter } from 'react-icons/fa6';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface Item {
    id: number;
    created_at: string;
    test: number;
  }
  
  interface HomeProps {
    items: Item[];
  }


const Home: NextPage<HomeProps> = () => {

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
    const connection2 = new Connection('https://mainnet.helius-rpc.com/?api-key=00a5355d-b3d8-4780-be65-58e83e1e0132', 'confirmed');


    const pubkeyObj = useContext(UserContext)

        // Define a state variable to hold the input value
        const [triggerUseEffect, setTriggerUseEffect] = useState(false);
        const [currentTime, setCurrentTime] = useState(getUTCTime());
        // tokens refreshing bool status
        // sol balance
        const [solBalance, setSolBalance] = useState(0);
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const [isLpBotDropdownOpen, setIsLpBotDropdownOpen] = useState(false);
        const [logoLoaded, setLogoLoaded] = useState(false);
        


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

    // Add a new useEffect to update the time every 40 seconds
    useEffect(() => {
        // Update time immediately when component mounts
        setCurrentTime(getUTCTime());
        
        // Set up interval to update time every 40 seconds
        const timeInterval = setInterval(() => {
            setCurrentTime(getUTCTime());
        }, 40000); // 40 seconds in milliseconds
        
        // Clean up interval on component unmount
        return () => clearInterval(timeInterval);
    }, []); // Empty dependency array means this runs once on mount

    return (
        <div className={styles.container}>
            <Head>
                <title>Rude Labs</title>
                <meta name="description" content="DeFi Suite on Solana" />
                <link rel="icon" href="/logoWithRing1.png" />
            </Head>

            <main className={styles.main}>
                <div className={styles.logoContainer}>
                    <Image 
                        src="/Rude_Labs_Color_Vector.svg" 
                        alt="Rude Labs Logo" 
                        width={160} 
                        height={160} 
                        priority
                        style={{ 
                            objectFit: 'contain',
                            opacity: logoLoaded ? 1 : 0,
                            transition: 'opacity 0.9s ease-in'
                        }}
                        className={styles.floatingLogo}
                        onLoadingComplete={() => setLogoLoaded(true)}
                    />
                </div>

                <div className={styles.socialLinks}>
                    <a href="https://discord.gg/6DTGbMNYuA" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                        <FaDiscord className={styles.socialIcon} />
                        <span>Discord</span>
                    </a>
                    <a href="https://x.com/Trader_Hamilton" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                        <FaXTwitter className={styles.socialIcon} />
                        <span>X</span>
                    </a>
                    <a href="https://github.com/AlexRubik" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                        <FaGithub className={styles.socialIcon} />
                        <span>GitHub</span>
                    </a>
                </div>


                <p className={styles.rainbowText}>{currentTime} UTC</p>
                <p hidden={!pubkeyObj}>SOL Balance: {solBalance}</p>
            </main>
        </div>
    );
};


export default Home;
