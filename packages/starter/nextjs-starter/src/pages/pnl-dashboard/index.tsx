import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/PnlDashboard.module.css';

const PnlDashboardIndex: NextPage = () => {
  const [pubkeys, setPubkeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPubkeys = async () => {
      try {
        const response = await fetch('/api/uniquePubkeys');
        const result = await response.json();

        if (result.success) {
          setPubkeys(result.data);
        } else {
          setError(result.error || 'Failed to fetch pubkeys');
        }
      } catch (err) {
        setError('Failed to fetch pubkeys');
      } finally {
        setLoading(false);
      }
    };

    fetchPubkeys();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.main}>
          Loading wallets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.main}>
          <span className={styles.negative}>Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>PnL Dashboard - Wallet List</title>
      </Head>

      <div className={styles.main}>
        <h1 className={styles.title}>LP PnL Dashboard - Wallet List</h1>
        
        {pubkeys.length === 0 ? (
          <p className={styles.subtitle}>No wallets found with LP positions.</p>
        ) : (
          <div className={styles.walletList}>
            {pubkeys.map((pubkey) => (
              <Link 
                key={pubkey}
                href={`/pnl-dashboard/${pubkey}`}
                className={styles.walletLink}
              >
                <div className={styles.walletLinkContent}>
                  <span className={styles.walletAddress}>{pubkey}</span>
                  
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PnlDashboardIndex; 