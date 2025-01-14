import { useEffect, useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import styles from '../styles/Apy.module.css';
import { fetchSanctumApys, calculateTop5Average } from '../utils';
import Head from 'next/head';

type ApyData = {
  protocol_name: string;
  tokens: {
    token_ticker: string;
    avg_apy: number;
    latest_apy: number;
    latest_update_time: number;
  }[];
};

interface DashboardProps {
  initialData: {
    data: ApyData[];
    lastUpdateTime: number;
  };
}

type TableData = {
  protocol: string;
  apy: number;
  latestApy: number;
  latest_update_time: number;
};

function shouldRefreshData() {
  const now = new Date();
  const minutes = now.getMinutes();
  
  // Special case for top of the hour: wait until 2 minutes past
  if (minutes === 2) return true;
  
  // For all other cases, refresh at 10-minute increments
  return minutes !== 0 && minutes % 10 === 0; // True at 10, 20, 30, 40, 50 minutes
}

const ApyDashboard: NextPage<DashboardProps> = ({ initialData }) => {
  const [apyData, setApyData] = useState<ApyData[]>(initialData.data);
  const [lstAverage, setLstAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(initialData.lastUpdateTime);
  const [show24hrApyModal, setShow24hrApyModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdateInfoModal, setShowUpdateInfoModal] = useState(false);

  useEffect(() => {
    // Check every 30 seconds if we should refresh
    const intervalId = setInterval(() => {
      if (shouldRefreshData()) {
        console.log('Refreshing data at:', new Date().toISOString());
        refreshData();
      }
    }, 30000); // 30 seconds

    // Initial fetch of Sanctum data
    const fetchSanctumData = async () => {
      try {
        const sanctumData = await fetchSanctumApys();
        const top5Data = calculateTop5Average(sanctumData.apys);
        setLstAverage(top5Data.averageApy * 100);
      } catch (err) {
        setError('Failed to fetch LST data');
      }
    };

    fetchSanctumData();

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const getTimeSinceUpdate = () => {
    if (!lastUpdateTime) return '';
    const now = Math.floor(Date.now() / 1000);
    const diffInMinutes = Math.floor((now - lastUpdateTime) / 60);
    return `Updated ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  };

  // New function to reorganize data by token
  const getTokenTables = () => {
    const tokenMap = new Map<string, { protocol: string; apy: number; latestApy: number; latest_update_time: number }[]>();
    
    apyData.forEach((protocol) => {
      protocol.tokens.forEach((token) => {
        if (!tokenMap.has(token.token_ticker)) {
          tokenMap.set(token.token_ticker, []);
        }
        tokenMap.get(token.token_ticker)?.push({
          protocol: protocol.protocol_name,
          apy: token.avg_apy,
          latestApy: token.latest_apy,
          latest_update_time: token.latest_update_time
        });
      });
    });

    return Array.from(tokenMap.entries()).map(([token, data]) => ({
      token,
      data: data.sort((a, b) => b.apy - a.apy),
    }));
  };

  const getTokenTablesWithLst = () => {
    const tables = getTokenTables();
    
    return tables.map(table => {
      if (table.token === 'SOL' && lstAverage !== null && !error) {
        const tableWithLst = {
          ...table,
          data: [
            { 
              protocol: 'Top LSTs', 
              apy: lstAverage, 
              latestApy: lstAverage,
              latest_update_time: Math.floor(Date.now() / 1000)
            },
            ...table.data
          ].sort((a, b) => b.apy - a.apy)
        };
        return tableWithLst;
      }
      return table;
    });
  };

  const getProtocolLink = (protocolName: string): string | null => {
    const links: { [key: string]: string } = {
      'DeFiTuna': 'https://defituna.com/lending',
      'Drift': 'https://app.drift.trade/earn/borrow-lend',
      'Kamino': 'https://app.kamino.finance/',
      'Kam_alt': 'https://app.kamino.finance/',
      'Kamino_jlp': 'https://app.kamino.finance/',
      'Marginfi': 'https://app.marginfi.com/',
      'Solend': 'https://save.finance/dashboard',
      'Carrot': 'https://use.deficarrot.com/'
    };
    return links[protocolName] || null;
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/apyData');
      const result = await response.json();
      
      if (result.success) {
        setApyData(result.data);
        setLastUpdateTime(result.lastUpdateTime);
      }

      // Refresh LST data
      const sanctumData = await fetchSanctumApys();
      const top5Data = calculateTop5Average(sanctumData.apys);
      setLstAverage(top5Data.averageApy * 100);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimestamp = (unixTimestamp: number): string => {
    const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // Converts to local time format
  };

  if (loading) {
    return <div className={styles.dashboardContainer}>
      <h1 className={styles.title}>Loading APY data...</h1>
    </div>;
  }

  if (error) {
    return <div className={styles.dashboardContainer}>Error: {error}</div>;
  }

  const tokenTables = getTokenTablesWithLst();

  return (
    <div className={styles.dashboardContainer}>
      <Head>
        <title>APY Dashboard</title>
      </Head>

      {show24hrApyModal && (
        <div className={styles.rolling24hrModalOverlay} onClick={() => setShow24hrApyModal(false)}>
          <div className={styles.rolling24hrModal} onClick={e => e.stopPropagation()}>
            <p>Rolling 24hr data updated every hour.</p>
            <p>It is an average of the last 24 hours of data.</p>
            <button className={styles.rolling24hrCloseButton} onClick={() => setShow24hrApyModal(false)}>×</button>
          </div>
        </div>
      )}

      {showUpdateInfoModal && (
        <div className={styles.updateInfoModalOverlay} onClick={() => setShowUpdateInfoModal(false)}>
          <div className={styles.updateInfoModal} onClick={e => e.stopPropagation()}>
            <p>New Data Every Hour</p>
            <button className={styles.updateInfoCloseButton} onClick={() => setShowUpdateInfoModal(false)}>×</button>
          </div>
        </div>
      )}

      <div className={styles.titleContainer}>
        <h1 className={styles.title}>
          Lending APY Dashboard
          <button 
            onClick={refreshData} 
            className={`${styles.refreshButton} ${isRefreshing ? styles.spinning : ''}`}
            disabled={isRefreshing}
          >
            ↻
          </button>
        </h1>
        <a 
          href="https://lulo.fi"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.luloCredit}
        >
          Thanks to Lulo for aggregating most of this data ↗
        </a>
      </div>
      <p className={styles.updateTime}>
        {getTimeSinceUpdate()}
        <span 
          className={`${styles.infoIcon} ${styles.tooltipElement} ${styles.clickable}`}
          title="New Data Every Hour"
          onClick={() => setShowUpdateInfoModal(true)}
        >
          ⓘ
        </span>
      </p>
      
      {tokenTables.map(({ token, data }) => (
        <div key={token} className={styles.protocolTableContainer}>
          <h2 className={styles.protocolTitle}>{token} Yields</h2>
          <table className={styles.apyTable}>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>
                  <span 
                    className={`${styles.tooltipElement} ${styles.clickable}`} 
                    title="Rolling 24hr data updated every hour"
                    onClick={() => setShow24hrApyModal(true)}
                  >
                    24hr APY (%)
                  </span>
                </th>
                <th>Latest APY (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr 
                  key={`${token}-${item.protocol}`}
                  className={`${item.protocol === 'Top LSTs' ? styles.grayedOut : ''} ${item.protocol === 'Top LSTs' ? styles.tooltipElementHelp : ''}`}
                  title={item.protocol === 'Top LSTs' ? 'This data is updated from Sanctum every epoch (2-3 days)' : ''}
                >
                  <td>
                    {item.protocol === 'Top LSTs' ? (
                      <a 
                        href="https://app.sanctum.so/lsts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.protocolLink} ${styles.tooltipElement}`}
                        title="Sort LSTs by APY at Sanctum"
                      >
                        {item.protocol} <span className={styles.linkIcon}>↗</span>
                      </a>
                    ) : getProtocolLink(item.protocol) ? (
                      <a 
                        href={getProtocolLink(item.protocol)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.protocolLink}
                      >
                        {item.protocol} <span className={styles.linkIcon}>↗</span>
                      </a>
                    ) : (
                      item.protocol
                    )}
                  </td>
                  <td>{item.apy.toFixed(2)}%</td>
                  <td 
                    className={item.protocol !== 'Top LSTs' ? styles.tooltipContainer : ''}
                    title={item.protocol !== 'Top LSTs' ? `Last updated: ${formatTimestamp(item.latest_update_time)}` : ''}
                  >
                    {item.latestApy.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/apyData`);
    const initialData = await response.json();

    if (!initialData.success) {
      console.log('API cache failed');
      // Return empty because we can't import the db here because we dont want to expose env variables to the client
      return {
        props: {
          initialData: {
            data: [],
            lastUpdateTime: null
          }
        }
      };
    }

    return {
      props: {
        initialData
      }
    };
  } catch (error) {
    return {
      props: {
        initialData: {
          data: [],
          lastUpdateTime: null
        }
      }
    };
  }
};

export default ApyDashboard; 