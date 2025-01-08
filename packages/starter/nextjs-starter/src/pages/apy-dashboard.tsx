import { useEffect, useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import styles from '../styles/Apy.module.css';
import { fetchSanctumApys, calculateTop5Average } from '../utils';
import Head from 'next/head';
import { getLast24HourProtocolApys } from '../db';

type ApyData = {
  protocol_name: string;
  tokens: {
    token_ticker: string;
    avg_apy: number;
    latest_apy: number;
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
};

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
  }, []);

  const getTimeSinceUpdate = () => {
    if (!lastUpdateTime) return '';
    const now = Math.floor(Date.now() / 1000);
    const diffInMinutes = Math.floor((now - lastUpdateTime) / 60);
    return `Updated ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  };

  // New function to reorganize data by token
  const getTokenTables = () => {
    const tokenMap = new Map<string, { protocol: string; apy: number; latestApy: number }[]>();
    
    apyData.forEach((protocol) => {
      protocol.tokens.forEach((token) => {
        if (!tokenMap.has(token.token_ticker)) {
          tokenMap.set(token.token_ticker, []);
        }
        tokenMap.get(token.token_ticker)?.push({
          protocol: protocol.protocol_name,
          apy: token.avg_apy,
          latestApy: token.latest_apy,
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
      if (table.token === 'SOL' && lstAverage !== null) {
        const tableWithLst = {
          ...table,
          data: [
            { protocol: 'Top LSTs', apy: lstAverage, latestApy: lstAverage },
            ...table.data
          ].sort((a, b) => b.apy - a.apy)
        };
        return tableWithLst;
      }
      return {
        ...table,
        data: table.data.sort((a, b) => b.apy - a.apy)
      };
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
                  title={item.protocol === 'Top LSTs' ? 'This data is updated from Sanctum every 24hrs so it is not exactly like the rest of the data in the table but it is similar enough to be useful for comparison' : ''}
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
                  <td>
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
      console.log('API cache failed, fetching from DB');
      // If API cache fails, fetch directly from DB
      const { protocols, lastUpdateTime } = await getLast24HourProtocolApys();
      return {
        props: {
          initialData: {
            data: protocols,
            lastUpdateTime
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