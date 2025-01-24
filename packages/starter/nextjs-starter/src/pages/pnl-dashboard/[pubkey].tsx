import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/PnlDashboard.module.css';

interface LpPosition {
  position_mint_address: string;
  starting_usd_value: number;
  closing_usd_value: number | null;
  pnl_usd: number;
  pnl_percentage: number;
  lower_boundary: number;
  upper_boundary: number;
  entry_price: number;
  closing_price: number | null;
  position_start_time: number;
  position_end_time: number | null;
}

interface Column {
  key: keyof LpPosition;
  label: string;
  visible: boolean;
  format: (value: any) => string;
}

const PnlDashboard: NextPage = () => {
  const router = useRouter();
  const { pubkey } = router.query;
  const [positions, setPositions] = useState<LpPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const formatUSD = (value: number | null | string) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numValue);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatPercentage = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return `${numValue.toFixed(2)}%`;
  };

  const formatPrice = (value: number | null | string) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return numValue.toFixed(4);
  };

  const [columns, setColumns] = useState<Column[]>([
    { 
      key: 'position_mint_address', 
      label: 'Position Mint', 
      visible: true,
      format: (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`
    },
    { 
      key: 'starting_usd_value', 
      label: 'Opening Value', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'closing_usd_value', 
      label: 'Closing Value', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'pnl_usd', 
      label: 'PnL (USD)', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'pnl_percentage', 
      label: 'PnL (%)', 
      visible: true,
      format: formatPercentage
    },
    { 
      key: 'lower_boundary', 
      label: 'Lower Boundary', 
      visible: false,
      format: formatPrice
    },
    { 
      key: 'upper_boundary', 
      label: 'Upper Boundary', 
      visible: false,
      format: formatPrice
    },
    { 
      key: 'entry_price', 
      label: 'Entry Price', 
      visible: false,
      format: formatPrice
    },
    { 
      key: 'closing_price', 
      label: 'Exit Price', 
      visible: false,
      format: formatPrice
    },
    { 
      key: 'position_start_time', 
      label: 'Start Time', 
      visible: false,
      format: formatDate
    },
    { 
      key: 'position_end_time', 
      label: 'End Time', 
      visible: false,
      format: formatDate
    }
  ]);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!pubkey) return;

      try {
        const response = await fetch(`/api/lpPositions?pubkey=${pubkey}`);
        const result = await response.json();

        if (result.success) {
          setPositions(result.data);
        } else {
          setError(result.error || 'Failed to fetch positions');
        }
      } catch (err) {
        setError('Failed to fetch positions');
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [pubkey]);

  const toggleColumn = (columnKey: keyof LpPosition) => {
    setColumns(columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.main}>
          Loading positions...
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
        <title>LP PnL Dashboard</title>
      </Head>

      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerTop}>
              <Link href="/pnl-dashboard" className={styles.backButton}>
                ← Back
              </Link>
              <h1 className={styles.title}>PnL Dashboard</h1>
            </div>
            <h2 className={styles.subtitle}>
              Wallet:{' '}
              <a 
                href={`https://solscan.io/account/${pubkey}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pubkeyLink}
              >
                {pubkey}
              </a>
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={styles.filterButton}
            >
              Columns ▼
            </button>

            {showFilterMenu && (
              <div className={styles.filterMenu}>
                <div className="p-2">
                  {columns.map(column => (
                    <label key={column.key} className={styles.filterMenuItem}>
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => toggleColumn(column.key)}
                        className="mr-2"
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                {columns.filter(col => col.visible).map(column => (
                  <th
                    key={column.key}
                    className={styles.tableHeaderCell}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr 
                  key={position.position_mint_address}
                  className={`${styles.tableRow} ${
                    position.pnl_usd >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {columns
                    .filter(col => col.visible)
                    .map(column => (
                      <td 
                        key={column.key}
                        className={styles.tableCell}
                      >
                        {column.format(position[column.key])}
                      </td>
                    ))
                  }
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PnlDashboard; 