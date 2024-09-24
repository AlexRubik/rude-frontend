import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { Connection } from '@solana/web3.js';

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
        const response = await fetch('https://sanctum-extra-api.ngrok.dev/v1/apy/latest?lst=fpSoL8EJ7UA5yJxFKWk1MFiWi35w8CbH36G5B9d7DsV&lst=Fi5GayacZzUrfaCRCJtBz2vSYkGF56xjgCceZx5SbXwq&lst=pathdXw4He1Xk3eX84pDdDZnGKEme3GivBamGCVPZ5a&lst=jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v&lst=BgYgFYq4A9a2o5S1QbWkmYVFBh7LBQL8YvugdhieFg38&lst=phaseZSfPxTDBpiVb96H4XFSD8xHeHxZre5HerehBJG&lst=BANXyWgPpa519e2MtQF1ecRbKYKKDMXPF1dyBxUq9NQG&lst=iceSdwqztAQFuH6En49HWwMxwthKMnGzLFQcMN3Bqhj&lst=fmSoLKzBY6h9b5RQ67UVs7xE3Ym6mx2ChpPxHdoaVho&lst=AxM7a5HNmRNHbND6h5ZMSsU8n3NLa1tskoN6m5mAgVvL&lst=MLLWWq9TLHK3oQznWqwPyqD7kH4LXTHSKXK4yLz7LjD&lst=SnKAf8aNjeYz8pY8itYn3VxFhT6Q8WNdPwy17s9USgC&lst=9zecJ6ryY3PXfW1wTd1Nz1GR9hzWhMYw62KDbvSyEJAj&lst=uPtSoL2qszk4SuPHNE2zqk1gDtqCq21ZE1yZCqvFTqq&lst=43CXsrQV7WyMvBsUiiZQMNU5Sdp28Jy61YMtx4J3RT7T&lst=pWrSoLAhue6jUxUkbWgmEy5rD9VJzkFmvfTDV5KgNuu&lst=suPer8CPwxoJPQ7zksGMwFvjBQhjAHwUMmPV4FVatBw&lst=jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC&lst=BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs&lst=Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ&lst=Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h&lst=picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX&lst=GRJQtWwdJmp5LLpy8JWjPgn5FnLyqSJGNhn5ZnCTFUwM&lst=HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX&lst=strng7mqqc1MBJJV6vMzYbEqnwVGvKKGKedeCvtktWA&lst=LnTRntk2kTfWEY6cVB8K9649pgJbt6dJLS1Ns1GZCWg&lst=st8QujHLPsX3d6HG9uQg9kJ91jFxUgruwsb1hyYXSNd&lst=pumpkinsEq8xENVZE6QgTS93EN4r9iKvNxNALS1ooyp&lst=he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A&lst=LSoLi4A4Pk4i8DPFYcfHziRdEbH9otvSJcSrkMVq99c&lst=CgnTSoL3DgY9SFHxcLj6CgCgKKoTBr6tp4CPAEWy25DE&lst=LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X&lst=vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7&lst=bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1&lst=GEJpt3Wjmr628FqXxTgxMce1pLntcPV4uFi8ksxMyPQh&lst=J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn&lst=7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn&lst=LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp&lst=Zippybh3S5xYYam2nvL6hVJKz1got6ShgV4DyD1XQYF&lst=edge86g9cVz87xcpKpy3J77vbp4wYd9idEV562CCntt&lst=ELSoL1owwMWQ9foMsutweCsMKbTPVBD9pFqxQGidTaMC&lst=aeroXvCT6tjGVNyTvZy86tFDwE4sYsKCh7FbNDcrcxF&lst=BNso1VUJnh4zcfpZa6986Ea66P6TCp59hvtNJ8b1X85&lst=ThUGsoLWtoTCfb24AmQTKDVjTTUBbNrUrozupJeyPsy&lst=WensoLXxZJnev2YvihHFchn1dVVFnFLYvgomXWvvwRu&lst=camaK1kryp4KJ2jS1HDiZuxmK7S6dyEtr9DA7NsuAAB&lst=2LuXDpkn7ZWMqufwgUv7ZisggGkSE5FpeHCHBsRgLg3m&lst=D1gittVxgtszzY4fMwiTfM4Hp7uL5Tdi1S9LYaepAUUm&lst=3bfv2scCdbvumVBc3Sar5QhYXx7Ecsi8EFF2akjxe329&lst=DLGToUUnqy9hXxpJTm5VaiBKqnw9Zt1qzvrpwKwUmuuZ&lst=DUAL6T9pATmQUFPYmrWq2BkkGdRxLtERySGScYmbHMER&lst=haSo1Vz5aTsqEnz8nisfnEsipvbAAWpgzRDh2WhhMEh&lst=HausGKcq9G9zM3azwNmgZyzUvYeeqR8h8663PmZpxuDj&lst=KUMAgSzADhUmwXwNiUbNHYnMBnd89u4t9obZThJ4dqg&lst=nordEhq2BnR6weCyrdezNVk7TwC3Ej94znPZxdBnfLM&lst=PoLaRbHgtHnmeSohWQN83LkwA4xnQt91VUqL5hx5VTc&lst=EPCz5LK372vmvCkZH3HgSuGNKACJJwwxsofW6fypCPZL&lst=RSoLp7kddnNwvvvaz4b1isQy8vcqdSwXjgm1wXaMhD8&lst=spkyB5SzVaz2x3nNzSBuhpLSEF8otbRDbufc73fuLXg&lst=stkrHcjQGytQggswj3tCF77yriaJYYhrRxisRqe9AiZ&lst=B5GgNAZQDN8vPrQ15jPrXmJxVtManHLqHogj9B9i4zSs&lst=fuseYvhNJbSzdDByyTCrLcogsoNwAviB1WeewhbqgFc&lst=MangmsBgFqJhW4cLUR9LxfVgMboY1xAoP8UUBiWwwuY&lst=apySoLhdVa6QbvNyEjXCbET3FdUm9cCdEvYyjCU7icM&lst=StPsoHokZryePePFV8N7iXvfEmgUoJ87rivABX7gaW6&lst=uSo1ynGWS3qc2B1nN2MmEHN5cYaNbT7vJp87LtgkpV8&lst=gangqfNY8fA7eQY3tHyjrevxHCLnhKRrLGRwUMBR4y6&lst=eon5tgYNk5FjJUcBUcLno49t2GfpmWZDzJHeYkbh9Zo&lst=gSvP9zBJ33pX7W2finzAYJZp6Q9ipNAQ19xU9PrCirz&lst=Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B&lst=rug3uop5ibttn6FoQe5WLiZ1cW6wTUymnSECB6GXvta&lst=5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm&lst=7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj&lst=mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So');
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