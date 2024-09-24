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
  const [output, setOutput] = useState<string>('Loading...');

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  const sortedApys = Object.entries(data.apys)
    .sort(([, a], [, b]) => b - a)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

  const sortedData: ApyData = {
    apys: sortedApys,
    errs: data.errs
  };




  return (

    <div className={styles.container}>
        <main className={styles.main}>
            <header className="bg-gray-800 text-white p-4">
                <h1 className="text-2xl">Sanctum LSTs APY Data</h1>
            </header>

            <div className="p-4">
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                    {output}
                </pre>
            </div>
    <div>
      <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
        {JSON.stringify(sortedData, null, 2)}
      </pre>
    </div>
    </main>
    </div>
    
  );
};

export default SortedApyData;