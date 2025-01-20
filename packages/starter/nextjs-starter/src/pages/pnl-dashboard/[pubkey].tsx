import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';

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

  if (loading) return <div className="p-4">Loading positions...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <Head>
        <title>PnL Dashboard</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">PnL Dashboard</h1>
            <h2 className="text-sm text-gray-400">Wallet: {pubkey}</h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Columns ▼
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10">
                <div className="p-2">
                  {columns.map(column => (
                    <label key={column.key} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
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

        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                {columns.filter(col => col.visible).map(column => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {positions.map((position) => (
                <tr 
                  key={position.position_mint_address}
                  className={`hover:bg-gray-800 transition-colors ${
                    position.pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {columns
                    .filter(col => col.visible)
                    .map(column => (
                      <td 
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm"
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