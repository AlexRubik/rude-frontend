import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { AdrenaAccountData } from '../server-utils';
import styles from '../styles/Adrena.module.css';

const AdrenaPage: NextPage = () => {
  const [stakingData, setStakingData] = useState<AdrenaAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStakingData() {
      try {
        const response = await fetch('/api/staking-data');
        const data = await response.json();
        
        if (response.ok) {
          setStakingData(data);
        } else {
          setError(data.error || 'Failed to fetch staking data');
        }
      } catch (err) {
        setError('Error connecting to API');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStakingData();
  }, []);

  // Format numbers for display
  const formatNumber = (value: string) => {
    if (!value) return '0';
    
    // If the value contains a formatted number in parentheses, extract it
    const match = value.match(/\(([\d,\.]+)/);
    if (match) return match[1];
    
    return value;
  };

  return (
    <div>
      <Head>
        <title>Adrena Staking Data</title>
        <meta name="description" content="View Adrena staking data" />
      </Head>

      <main className={styles.container}>
        <h1 className={styles.title}>Adrena Staking Data</h1>
        
        {loading && <p className={styles.loading}>Loading staking data...</p>}
        
        {error && (
          <div className={styles.errorContainer}>
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {stakingData && stakingData.summary && (
          <div>
            <h2 className={styles.subtitle}>Staking Account Summary</h2>
            
            <div className={styles.dataSection}>
              <h3 className={styles.sectionTitle}>Basic Info</h3>
              <p><strong>Address:</strong> {stakingData.basicInfo.address}</p>
              <p><strong>Owner:</strong> {stakingData.basicInfo.owner}</p>
              <p><strong>SOL Balance:</strong> {stakingData.basicInfo.solBalance.toFixed(6)} SOL</p>
              <p><strong>Account Type:</strong> {stakingData.accountType}</p>
            </div>
            
            <div className={styles.dataSection}>
              <h3 className={styles.sectionTitle}>Staking Info</h3>
              <p><strong>Staking Type:</strong> {stakingData.summary.stakingType}</p>
              <p><strong>Current Price:</strong> {stakingData.summary.tokenPrice} <span className={styles.timestamp}>(as of {new Date(stakingData.summary.priceTimestamp).toLocaleString()})</span></p>
              <p><strong>Locked Tokens:</strong> {stakingData.summary.lockedTokens} {stakingData.summary.stakingType} <span className={styles.usdValue}>({stakingData.summary.lockedTokensUsd})</span></p>
              <p><strong>Liquid Tokens:</strong> {stakingData.summary.liquidTokens} {stakingData.summary.stakingType} <span className={styles.usdValue}>({stakingData.summary.liquidTokensUsd})</span></p>
              <p><strong>Total Staked:</strong> {stakingData.summary.totalStaked} {stakingData.summary.stakingType} <span className={styles.usdValue}>({stakingData.summary.totalStakedUsd})</span></p>
              <p><strong>Total Supply:</strong> {stakingData.summary.totalSupply} {stakingData.summary.stakingType} <span className={styles.usdValue}>({stakingData.summary.totalSupplyUsd})</span></p>
              <p><strong>Percentage Staked:</strong> {stakingData.summary.percentageStaked}</p>
              <p><strong>Staked Token Mint:</strong> <span className={styles.address}>{stakingData.summary.stakedTokenMint}</span></p>
            </div>
            
            <div className={styles.dataSection}>
              <h3 className={styles.sectionTitle}>Reward Info</h3>
              <p><strong>Resolved Reward Token Amount:</strong> {formatNumber(stakingData.summary.resolvedRewardTokenAmount)}</p>
              <p><strong>Resolved Staked Token Amount:</strong> {formatNumber(stakingData.summary.resolvedStakedTokenAmount)}</p>
              <p><strong>Resolved LM Reward Token Amount:</strong> {formatNumber(stakingData.summary.resolvedLmRewardTokenAmount)}</p>
              <p><strong>Resolved LM Staked Token Amount:</strong> {formatNumber(stakingData.summary.resolvedLmStakedTokenAmount)}</p>
              <p><strong>USDC Reward Vault Balance:</strong> {stakingData.summary.usdcRewardVaultBalance} USDC</p>
              <p><strong>Pending USDC Rewards (Current Round):</strong> {stakingData.summary.pendingUsdcRewards} USDC</p>
            </div>
            
            <div className={styles.dataSection}>
              <h3 className={styles.sectionTitle}>Current Staking Round</h3>
              <p><strong>Start Time:</strong> {stakingData.summary.currentStakingRound.startTime}</p>
              <p><strong>End Time:</strong> {stakingData.summary.currentStakingRound.endTime}</p>
              <p><strong>Rate:</strong> {stakingData.summary.currentStakingRound.rate}</p>
              <p><strong>Total Stake:</strong> {formatNumber(stakingData.summary.currentStakingRound.totalStake)}</p>
              <p><strong>Total Claim:</strong> {formatNumber(stakingData.summary.currentStakingRound.totalClaim)}</p>
              <p><strong>LM Rate:</strong> {stakingData.summary.currentStakingRound.lmRate}</p>
              <p><strong>LM Total Stake:</strong> {formatNumber(stakingData.summary.currentStakingRound.lmTotalStake)}</p>
              <p><strong>LM Total Claim:</strong> {formatNumber(stakingData.summary.currentStakingRound.lmTotalClaim)}</p>
            </div>
            
            <div className={styles.dataSection}>
              <h3 className={styles.sectionTitle}>All Staking Rounds</h3>
              {stakingData.summary.fullData.resolvedStakingRounds && (
                <div className={styles.roundsContainer}>
                  {stakingData.summary.fullData.resolvedStakingRounds.map((round: any, index: number) => (
                    <div key={index} className={styles.roundItem}>
                      <h4 className={styles.roundTitle}>Round {index + 1}</h4>
                      <p><strong>Start Time:</strong> {round.startTime}</p>
                      <p><strong>End Time:</strong> {round.endTime}</p>
                      <p><strong>Rate:</strong> {round.rate}</p>
                      <p><strong>Total Stake:</strong> {formatNumber(round.totalStake)}</p>
                      <p><strong>Total Claim:</strong> {formatNumber(round.totalClaim)}</p>
                      <p><strong>LM Rate:</strong> {round.lmRate}</p>
                      <p><strong>LM Total Stake:</strong> {formatNumber(round.lmTotalStake)}</p>
                      <p><strong>LM Total Claim:</strong> {formatNumber(round.lmTotalClaim)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {stakingData && !stakingData.summary && (
          <div className={styles.noData}>
            <h2>Account Data</h2>
            <p>This account does not contain staking data or could not be decoded properly.</p>
            <pre>{JSON.stringify(stakingData, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdrenaPage;
