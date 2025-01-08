import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { Connection } from '@solana/web3.js';
import { createUrlFromToml } from '../utils';

type ApyData = {
  apys: Record<string, number>;
  errs?: Record<string, { message: string | null; code: string }>;
};

const SortedApyData: React.FC = () => {
  const [data, setData] = useState<ApyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [epochOutput, setOutput] = useState<string>('Loading...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sanctumUrl = await createUrlFromToml();
        const response = await fetch(sanctumUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result: ApyData = await response.json();
        setData(result);
      } catch (error) {
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEpochInfo = async () => {
        try {
          const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=1e853175-d3ec-4696-b09c-510e81011a8d', 'confirmed');
          const info = await connection.getEpochInfo();
          
          const slotsRemaining = info.slotsInEpoch - info.slotIndex;
          const secondsRemaining = slotsRemaining * 0.4; // Assuming 400ms per slot
          const endTime = new Date(Date.now() + secondsRemaining * 1000);
  
          const rawOutput = `
  Current Epoch: ${info.epoch}
  Slot: ${info.absoluteSlot}
  Slots in Epoch: ${info.slotsInEpoch}
  Slots Remaining: ${slotsRemaining}
  Epoch Estimated Complete: ${endTime.toUTCString()}
          `.trim();
  
          setOutput(rawOutput);
        } catch (err) {
          setOutput('Failed to fetch epoch info');
          console.error(err);
        }
      };
  

    fetchEpochInfo();
    fetchData();
  }, []);

  const formatApyData = (data: ApyData | null) => {
    if (!data || !data.apys) return null;

    const sortedApys = Object.entries(data.apys)
      .map(([token, apy]) => ({ token, apy }))
      .sort((a, b) => b.apy - a.apy);

    return (
      <div className={styles.apyList}>
        <table className={styles.apyTable}>
          <thead>
            <tr>
              <th>Token</th>
              <th>APY (%)</th>
            </tr>
          </thead>
          <tbody>
            {sortedApys.map(({ token, apy }) => (
              <tr key={token}>
                <td>
                  <a 
                    href={`https://solscan.io/token/${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.tokenLink}
                  >
                    {token.slice(0, 4)}...{token.slice(-4)} ↗
                  </a>
                </td>
                <td>{(apy * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.errs && Object.keys(data.errs).length > 0 && (
          <div className={styles.errors}>
            <h3>Errors:</h3>
            {Object.entries(data.errs).map(([token, error]) => (
              <div key={token} className={styles.error}>
                <strong>{token}:</strong> {error.message || error.code}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h2>Sanctum LSTs APY Data</h2>
        <div className="p-4">
          <pre className={styles.pre}>
            {epochOutput}
          </pre>
          <div className={styles.updateNote}>
            Data is updated every epoch by{' '}
            <a 
              href="https://app.sanctum.so/lsts"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sanctumLink}
            >
              Sanctum ↗
            </a>
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            formatApyData(data)
          )}
        </div>
      </main>
    </div>
  );
};

export default SortedApyData;