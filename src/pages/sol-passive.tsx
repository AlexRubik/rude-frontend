import React from 'react';
import Head from 'next/head';
import styles from '../styles/SolPassive.module.css';
import { FaXTwitter, FaGlobe, FaBook } from 'react-icons/fa6';

interface PassiveProject {
  name: string;
  description: string;
  xProfile: string;
  website: string;
  documentation: string;
  audited: boolean;
  lockup: boolean;
}

const SolPassivePage: React.FC = () => {
  const passiveProjects: PassiveProject[] = [
        {
            name: "Lulo",
            description: "Stablecoin yield aggregator that automatically reallocates your funds to maximize yield",
            xProfile: "https://x.com/uselulo",
            website: "https://lulo.fi/",
            documentation: "https://docs.lulo.fi/",
            audited: true,
            lockup: false
          },
          {
            name: "Carrot",
            description: "Yield bearing token where yield is earned through automated optimization algorithms that smart-routes stablecoin lending, ensuring that funds are continually rebalanced to capture the best rates.",
            xProfile: "https://x.com/deficarrot",
            website: "https://deficarrot.com/",
            documentation: "https://docs.deficarrot.com/",
            audited: true,
            lockup: false
          },
          {
            name: "Huma",
            description: "Huma primarily generates yield from PayFi—real-world payment financing activities such as global settlement, card payments, trade finance",
            xProfile: "https://x.com/humafinance",
            website: "https://huma.finance/",
            documentation: "https://docs.huma.finance/",
            audited: true,
            lockup: false
          },
          {
      name: "Elemental",
      description: "Fixed yield fund focusing on Delta Neutral Funding Rate Farming, Liquidity Pools, Lending Loops and Arbitrage",
      xProfile: "https://x.com/elementaldefi",
      website: "https://elemental.fund/",
      documentation: "https://docs.elemental.fund/",
      audited: false,
      lockup: true
    }

  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Solana Passive Yield | Rude Labs</title>
        <meta name="description" content="Directory of passive income opportunities on Solana" />
        <link rel="icon" href="/logoWithRing1.png" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Solana Passive Yield</h1>
        <p className={styles.description}>
          A curated list of notable passive yield opportunities on Solana
        </p>

        <div className={styles.grid}>
          {passiveProjects.map((project, index) => (
            <div key={index} className={styles.card}>
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              
              <div className={styles.statusContainer}>
                <div className={styles.auditStatus} title={project.audited ? "This project has been audited" : "This project has not been audited"}>
                  Audited: <span>{project.audited ? "✅" : "❌"}</span>
                </div>
                
                <div className={styles.lockupStatus} title={project.lockup ? "Deposited funds are not available for immediate withdrawal" : "Deposited funds are available for immediate withdrawal"}>
                  Lockup: <span>{project.lockup ? "✅" : "❌"}</span>
                </div>
              </div>
              
              <div className={styles.links}>
                <a 
                  href={project.xProfile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <FaXTwitter className={styles.icon} /> X
                </a>
                <a 
                  href={project.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <FaGlobe className={styles.icon} /> Website
                </a>
                <a 
                  href={project.documentation} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <FaBook className={styles.icon} /> Docs
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SolPassivePage; 