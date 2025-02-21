import React, { useState, useEffect } from 'react';
import styles from '../styles/Lsts.module.css';
import { Connection } from '@solana/web3.js';
import { fetchLstData, LstResponse, Lst } from '../utils';

const SortedApyData: React.FC = () => {
  const [data, setData] = useState<LstResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [epochOutput, setOutput] = useState<string>('Loading...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchLstData();
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

  const formatLstData = (data: LstResponse | null) => {
    if (!data || !data.lsts) return null;

    // Sort LSTs by APY in descending order
    const sortedLsts = [...data.lsts].sort((a, b) => b.data.apy - a.data.apy);

    return (
      <div className={styles.apyList}>
        <table className={styles.apyTable}>
          <thead>
            <tr>
              <th>Token</th>
              <th>Name</th>
              <th>5 Epoch Avg APY</th>
              <th>Past Epoch APY</th>
              <th>TVL (SOL)</th>
              <th>Holders</th>
            </tr>
          </thead>
          <tbody>
            {sortedLsts.map((lst) => (
              <tr key={lst.mint}>
                <td>
                  <a 
                    href={`https://solscan.io/token/${lst.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.tokenLink}
                  >
                    {lst.symbol} ↗
                  </a>
                </td>
                <td>{lst.name}</td>
                <td>{(lst.data.apy * 100).toFixed(2)}%</td>
                <td>{(lst.data.apyPastEpoch * 100).toFixed(2)}%</td>
                <td>{(lst.data.tvl / 1e9).toFixed(0)}</td>
                <td>{lst.data.holders}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            Data from{' '}
            <a 
              href="https://app.sanctum.so/"
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
            formatLstData(data)
          )}
        </div>
      </main>
    </div>
  );
};

export default SortedApyData;