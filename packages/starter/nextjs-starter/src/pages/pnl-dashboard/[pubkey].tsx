import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/PnlDashboard.module.css';
import { JoinedPosition } from '../../db';

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

interface HedgePosition extends JoinedPosition {
  total_pnl: number;
}

interface Column {
  key: keyof LpPosition;
  label: string;
  visible: boolean;
  format: (value: any) => string | JSX.Element;
}

const PnlDashboard: NextPage = () => {
  const router = useRouter();
  const { pubkey } = router.query;
  const [positions, setPositions] = useState<LpPosition[]>([]);
  const [hedgePositions, setHedgePositions] = useState<HedgePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showAllLpPositions, setShowAllLpPositions] = useState(false);
  const [showAllHedgePositions, setShowAllHedgePositions] = useState(false);
  const [aggregatedPnl, setAggregatedPnl] = useState<{
    total_pnl: number;
    perp_pnl: number;
    lp_pnl: number;
  } | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showHedgeColumnSelector, setShowHedgeColumnSelector] = useState(false);
  const [showLpColumnSelector, setShowLpColumnSelector] = useState(false);
  const hedgeFilterRef = useRef<HTMLDivElement>(null);
  const lpFilterRef = useRef<HTMLDivElement>(null);

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
      format: (value: string) => (
        <a 
          href={`https://solscan.io/token/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mintLink}
        >
          {`${value.slice(0, 4)}...${value.slice(-4)}`}
        </a>
      )
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

  const [hedgeColumns, setHedgeColumns] = useState<Column[]>([
    { 
      key: 'lp_position_mint_address' as any, 
      label: 'Position Mint', 
      visible: true,
      format: (value: string) => (
        <a 
          href={`https://solscan.io/token/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mintLink}
        >
          {`${value.slice(0, 4)}...${value.slice(-4)}`}
        </a>
      )
    },
    { 
      key: 'perp_token' as any, 
      label: 'Token', 
      visible: true,
      format: (value: string) => value
    },
    { 
      key: 'total_starting_value' as any, 
      label: 'Total Starting Value', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'lp_starting_usd_value' as any, 
      label: 'LP Opening Value', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'lp_closing_usd_value' as any, 
      label: 'LP Closing Value', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'lp_pnl_usd' as any, 
      label: 'LP PnL (USD)', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'perp_usdc_collateral_amount' as any, 
      label: 'Perp Collateral', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'perp_pnl' as any, 
      label: 'Perp PnL (USD)', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'total_pnl' as any, 
      label: 'Total PnL (USD)', 
      visible: true,
      format: formatUSD
    },
    { 
      key: 'total_pnl_percentage' as any, 
      label: 'Total PnL (%)', 
      visible: true,
      format: formatPercentage
    },
    { 
      key: 'lp_position_start_time' as any, 
      label: 'Start Time', 
      visible: true,
      format: formatDate
    },
    { 
      key: 'lp_position_end_time' as any, 
      label: 'End Time', 
      visible: true,
      format: formatDate
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (!pubkey) return;

      try {
        setLoading(true);
        
        // Fetch LP positions
        const lpResponse = await fetch(`/api/lpPositions?pubkey=${pubkey}`);
        const lpResult = await lpResponse.json();

        // Fetch hedge positions
        const hedgeResponse = await fetch(`/api/hedgePositions?pubkey=${pubkey}`);
        const hedgeResult = await hedgeResponse.json();

        if (lpResult.success) {
          setPositions(lpResult.data);
        } else {
          setError(lpResult.error || 'Failed to fetch LP positions');
        }

        if (hedgeResult.success) {
          setHedgePositions(hedgeResult.data);
          if (hedgeResult.aggregated) {
            setAggregatedPnl(hedgeResult.aggregated);
          }
        }
        // No error for hedge positions if they don't exist
        
      } catch (err) {
        setError('Failed to fetch positions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pubkey]);

  const toggleColumn = (columnKey: keyof LpPosition) => {
    setColumns(columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  const toggleHedgeColumn = (columnKey: string) => {
    setHedgeColumns(hedgeColumns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  const toggleColumnVisibility = (columnKey: string) => {
    toggleHedgeColumn(columnKey);
    toggleColumn(columnKey as keyof LpPosition);
  };

  const displayedLpPositions = showAllLpPositions ? positions : positions.slice(0, 5);
  const displayedHedgePositions = showAllHedgePositions ? hedgePositions : hedgePositions.slice(0, 5);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hedgeFilterRef.current && !hedgeFilterRef.current.contains(event.target as Node)) {
        setShowHedgeColumnSelector(false);
      }
      if (lpFilterRef.current && !lpFilterRef.current.contains(event.target as Node)) {
        setShowLpColumnSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          <div className={styles.backButtonWrapper}>
            <Link href="/pnl-dashboard" passHref>
              <button className={styles.backButton}>
                ← Back
              </button>
            </Link>
          </div>
          
          <a 
            href={`https://solscan.io/account/${pubkey}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pubkeyLink}
          >
            {pubkey}
          </a>
          
          <div style={{ width: '80px' }}></div> {/* Spacer for alignment */}
        </div>

        {/* Hedge Positions Section */}
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h2 className={styles.sectionTitle}>Hedge Positions</h2>
            
            <div className={styles.headerControls}>
              {hedgePositions.length > 5 && (
                <button 
                  onClick={() => setShowAllHedgePositions(!showAllHedgePositions)}
                  className={styles.toggleButton}
                >
                  {showAllHedgePositions ? 'Show Less' : 'Show All'}
                </button>
              )}
              
              <div className={styles.filterContainer} ref={hedgeFilterRef}>
                <button 
                  className={styles.filterButton}
                  onClick={() => setShowHedgeColumnSelector(!showHedgeColumnSelector)}
                >
                  Filters
                </button>
                {showHedgeColumnSelector && (
                  <div className={styles.filterMenu}>
                    {hedgeColumns.map((column) => (
                      <div 
                        key={column.key} 
                        className={styles.filterMenuItem}
                        onClick={() => toggleColumnVisibility(column.key)}
                      >
                        <input 
                          type="checkbox" 
                          checked={column.visible} 
                          readOnly 
                        />
                        <span style={{ marginLeft: '8px' }}>{column.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {aggregatedPnl && (
            <div className={styles.aggregatedPnlContainer}>
              <div className={`${styles.aggregatedPnlItem} ${aggregatedPnl.total_pnl >= 0 ? styles.positive : styles.negative}`}>
                <span className={`${styles.aggregatedPnlLabel} ${styles.totalPnlLabel}`}>Total PnL:</span>
                <span className={`${styles.aggregatedPnlValue} ${styles.totalPnlValue}`}>{formatUSD(aggregatedPnl.total_pnl)}</span>
              </div>
              <div className={`${styles.aggregatedPnlItem} ${aggregatedPnl.lp_pnl >= 0 ? styles.positive : styles.negative}`}>
                <span className={styles.aggregatedPnlLabel}>LP PnL:</span>
                <span className={styles.aggregatedPnlValue}>{formatUSD(aggregatedPnl.lp_pnl)}</span>
              </div>
              <div className={`${styles.aggregatedPnlItem} ${aggregatedPnl.perp_pnl >= 0 ? styles.positive : styles.negative}`}>
                <span className={styles.aggregatedPnlLabel}>Perp PnL:</span>
                <span className={styles.aggregatedPnlValue}>{formatUSD(aggregatedPnl.perp_pnl)}</span>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  {hedgeColumns.filter(col => col.visible).map(column => (
                    <th
                      key={column.key}
                      className={`${styles.tableHeaderCell} ${
                        ['lp_starting_usd_value', 'lp_closing_usd_value', 'lp_pnl_usd', 'perp_usdc_collateral_amount', 'perp_pnl', 'lp_position_start_time', 'lp_position_end_time'].includes(column.key as string) 
                          ? styles.responsiveHideColumn 
                          : ''
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedHedgePositions.map((position) => (
                  <tr 
                    key={position.lp_position_mint_address}
                    className={`${styles.tableRow} ${
                      position.total_pnl >= 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {hedgeColumns
                      .filter(col => col.visible)
                      .map(column => (
                        <td 
                          key={column.key}
                          className={`${styles.tableCell} ${
                            ['lp_starting_usd_value', 'lp_closing_usd_value', 'lp_pnl_usd', 'perp_usdc_collateral_amount', 'perp_pnl', 'lp_position_start_time', 'lp_position_end_time'].includes(column.key as string) 
                              ? styles.responsiveHideColumn 
                              : ''
                          }`}
                        >
                          {column.format(position[column.key as keyof HedgePosition])}
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LP Positions Section */}
        <div className={styles.tableSection}>
          <div className={styles.tableSectionHeader}>
            <h2 className={styles.sectionTitle}>LP Positions</h2>
            
            <div className={styles.headerControls}>
              {positions.length > 5 && (
                <button 
                  onClick={() => setShowAllLpPositions(!showAllLpPositions)}
                  className={styles.toggleButton}
                >
                  {showAllLpPositions ? 'Show Less' : 'Show All'}
                </button>
              )}
              
              <div className={styles.filterContainer} ref={lpFilterRef}>
                <button 
                  className={styles.filterButton}
                  onClick={() => setShowLpColumnSelector(!showLpColumnSelector)}
                >
                  Filters
                </button>
                {showLpColumnSelector && (
                  <div className={styles.filterMenu}>
                    {columns.map((column) => (
                      <div 
                        key={column.key} 
                        className={styles.filterMenuItem}
                        onClick={() => toggleColumnVisibility(column.key)}
                      >
                        <input 
                          type="checkbox" 
                          checked={column.visible} 
                          readOnly 
                        />
                        <span style={{ marginLeft: '8px' }}>{column.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                {displayedLpPositions.map((position) => (
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
    </div>
  );
};

export default PnlDashboard; 