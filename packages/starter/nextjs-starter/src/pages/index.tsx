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
import { ConnectWalletMenu } from '../components/ConnectWalletMenu';
import { WalletAccountIcon } from '../components/WalletAccountIcon';
import { SelectedWalletAccountContext } from '../context/SelectedWalletAccountContext';
import { SolanaSignAndSendTransactionFeaturePanel } from '../components/SolanaSignAndSendTransactionFeaturePanel';

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
        const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
        


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
                <title>Rude Labs</title>
                <meta name="description" content="DeFi Suite on Solana." />
                <link rel="icon" href="/favicon.ico" />
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
                            transition: 'opacity 0.9s ease-in',
                            marginTop: '1.6rem'
                        }}
                        className={styles.floatingLogo}
                        onLoadingComplete={() => setLogoLoaded(true)}
                    />
                </div>
                        <p>{selectedWalletAccount?.address}</p>
                {selectedWalletAccount && <SolanaSignAndSendTransactionFeaturePanel account={selectedWalletAccount} />}


                <div className={styles.socialLinks}>
                    <a href="https://discord.gg/6DTGbMNYuA" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                        <FaDiscord className={styles.socialIcon} />
                        <span>Discord</span>
                    </a>
                    <a href="https://x.com/RudeLabs_io" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                        <FaXTwitter className={styles.socialIcon} />
                        <span>X</span>
                    </a>
                </div>

                <div className={styles.dropdownContainer}>
                    <h2 
                        className={styles.dropdownTitle}
                        onClick={() => setIsLpBotDropdownOpen(!isLpBotDropdownOpen)}
                    >
                        LP Bot <span className={styles.comingSoon}>Coming Soon</span> {isLpBotDropdownOpen ? '▼' : '▶'}
                    </h2>
                    
                    <div className={styles.dropdownContent} style={{
                        maxHeight: isLpBotDropdownOpen ? '500px' : '0',
                        opacity: isLpBotDropdownOpen ? 1 : 0,
                        padding: isLpBotDropdownOpen ? '1rem' : '0 1rem',
                        marginTop: isLpBotDropdownOpen ? '0.5rem' : '0',
                        overflow: 'hidden'
                    }}>
                        <a href="https://x.com/Trader_Hamilton" target="_blank" rel="noopener noreferrer">
                            <h2><FaXTwitter className={styles.linkIcon} /> Lead Dev</h2>
                        </a>
                    </div>
                </div>

                <div className={styles.dropdownContainer}>
                    <h2 
                        className={styles.dropdownTitle}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        Arbitrage Bot {isDropdownOpen ? '▼' : '▶'}
                    </h2>
                    
                    <div className={styles.dropdownContent} style={{
                        maxHeight: isDropdownOpen ? '500px' : '0',
                        opacity: isDropdownOpen ? 1 : 0,
                        padding: isDropdownOpen ? '1rem' : '0 1rem',
                        marginTop: isDropdownOpen ? '0.5rem' : '0',
                        overflow: 'hidden'
                    }}>
                        <a href="https://www.youtube.com/playlist?list=PLMIFlNMah1MnCqDsEJ0P2QhDr93O9KYmF" target="_blank" rel="noopener noreferrer">
                            <h2><FaYoutube className={styles.linkIcon} /> Beginner Video Tutorial</h2>
                        </a>
                        <a href="https://github.com/AlexRubik/rude-bot-solana" target="_blank" rel="noopener noreferrer">
                            <h2><FaGithub className={styles.linkIcon} /> GitHub</h2>
                        </a>
                        <a href="https://rude-bot-org.gitbook.io/" target="_blank" rel="noopener noreferrer">
                            <h2><FaBook className={styles.linkIcon} /> Documentation</h2>
                        </a>
                        <a href="/source-code">
                            <h2><FaExternalLinkAlt className={styles.linkIcon} /> Purchase Source Code</h2>
                        </a>
                        <a href="https://solscan.io/account/3tZPEagumHvtgBhivFJCmhV9AyhBHGW9VgdsK52i4gwP" target="_blank" rel="noopener noreferrer">
                            <h2><FaExternalLinkAlt className={styles.linkIcon} /> On Chain Program 1</h2>
                        </a>
                        <a href="https://solscan.io/account/72FXMcchZS4JRgQ62pKweYhHAkFA19PFoaqAUhWZmEFU" target="_blank" rel="noopener noreferrer">
                            <h2><FaExternalLinkAlt className={styles.linkIcon} /> On Chain Program 2</h2>
                        </a>
                    </div>
                </div>

                <p>Time: {currentTime} UTC</p>
                <p hidden={!pubkeyObj}>SOL Balance: {solBalance}</p>
            </main>
        </div>
    );
};


export default Home;
