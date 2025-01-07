import { useEffect, useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import styles from '../styles/Apy.module.css';
import { fetchSanctumApys, calculateTop5Average } from '../utils';

type ApyData = {
  protocol_name: string;
  tokens: {
    token_ticker: string;
    avg_apy: number;
  }[];
};

interface DashboardProps {
  initialData: {
    data: ApyData[];
    lastUpdateTime: number;
  };
}

const ApyDashboard: NextPage<DashboardProps> = ({ initialData }) => {
  const [apyData, setApyData] = useState<ApyData[]>(initialData.data);
  const [lstAverage, setLstAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(initialData.lastUpdateTime);

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
    return `Yields updated ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  };

  // New function to reorganize data by token
  const getTokenTables = () => {
    const tokenMap = new Map<string, { protocol: string; apy: number }[]>();
    
    apyData.forEach((protocol) => {
      protocol.tokens.forEach((token) => {
        if (!tokenMap.has(token.token_ticker)) {
          tokenMap.set(token.token_ticker, []);
        }
        tokenMap.get(token.token_ticker)?.push({
          protocol: protocol.protocol_name,
          apy: token.avg_apy,
        });
      });
    });

    return Array.from(tokenMap.entries()).map(([token, data]) => ({
      token,
      data: data.sort((a, b) => b.apy - a.apy), // Sort by APY descending
    }));
  };

  const getTokenTablesWithLst = () => {
    const tables = getTokenTables();
    
    // Find the SOL table and add the LST average, then sort by APY
    return tables.map(table => {
      if (table.token === 'SOL' && lstAverage !== null) {
        return {
          ...table,
          data: [
            { protocol: 'Top LSTs', apy: lstAverage },
            ...table.data
          ].sort((a, b) => b.apy - a.apy) // Sort by APY descending
        };
      }
      return {
        ...table,
        data: table.data.sort((a, b) => b.apy - a.apy) // Sort all tables by APY descending
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
      'Solend': 'https://save.finance/dashboard'
    };
    return links[protocolName] || null;
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
      <h1 className={styles.title}>Lending APY Dashboard</h1>
      <p className={styles.updateTime}>{getTimeSinceUpdate()}</p>
      
      {tokenTables.map(({ token, data }) => (
        <div key={token} className={styles.protocolTableContainer}>
          <h2 className={styles.protocolTitle}>{token} Yields</h2>
          <table className={styles.apyTable}>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>
                  24hr APY (%) 
                  <span 
                    className={`${styles.infoIcon} ${styles.tooltipElementHelp}`}
                    title="Updated every hour"
                  >
                    ⓘ
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={`${token}-${item.protocol}`}>
                  <td>
                    {item.protocol === 'Top LSTs' ? (
                      <a 
                        href="https://app.sanctum.so/lsts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.protocolLink} ${styles.tooltipElement}`}
                        title="Sort LSTs by APY at Sanctum"
                      >
                        {item.protocol}
                      </a>
                    ) : getProtocolLink(item.protocol) ? (
                      <a 
                        href={getProtocolLink(item.protocol)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.protocolLink}
                      >
                        {item.protocol}
                      </a>
                    ) : (
                      item.protocol
                    )}
                  </td>
                  <td>{item.apy.toFixed(2)}%</td>
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