'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import TradingDataModal from '../components/TradingDataModal';

const AccountPage = () => {
  const [accountData, setAccountData] = useState(null);
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [positionStats, setPositionStats] = useState(null);
  const [closedPositionsPagination, setClosedPositionsPagination] = useState({});
  const [uniqueValues, setUniqueValues] = useState({ symbols: [], positionTypes: [] });
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters and pagination
  const [closedPage, setClosedPage] = useState(1);
  const [filters, setFilters] = useState({
    symbol: '',
    position_type: '',
    minPnl: '',
    maxPnl: ''
  });
  
  // Auto-refresh interval
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchAccountData = useCallback(async () => {
    try {
      const response = await fetch('/api/account-data');
      const result = await response.json();
      
      if (result.success) {
        setAccountData(result.account);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  }, []);

  const fetchPositionStats = useCallback(async () => {
    try {
      const response = await fetch('/api/account-data/stats');
      const result = await response.json();
      if (result.success) {
        setPositionStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching position stats:', error);
    }
  }, []);

  const fetchPositions = useCallback(async (status, page = 1) => {
    try {
      const response = await fetch('/api/account-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: page,
          limit: status === 'CLOSED' ? 10 : 100,
          status: status,
          filters: status === 'CLOSED' ? filters : {}
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (status === 'OPEN') {
          setOpenPositions(result.positions);
        } else {
          setClosedPositions(result.positions);
          setClosedPositionsPagination(result.pagination);
        }
        if (result.uniqueValues) {
            setUniqueValues(result.uniqueValues);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${status} positions:`, error);
    }
  }, [filters]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAccountData(),
      fetchPositions('OPEN'),
      fetchPositions('CLOSED', closedPage),
      fetchPositionStats()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [fetchAccountData, fetchPositions, closedPage, fetchPositionStats]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Handle filter changes for closed positions
  useEffect(() => {
    if (closedPage !== 1) {
        setClosedPage(1);
    }
    fetchPositions('CLOSED', 1);
  }, [filters]);

  const calculateRealizedPnl = useMemo(() => {
    return closedPositions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);
  }, [closedPositions]);

  const calculateUnrealizedPnl = useMemo(() => {
    return openPositions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);
  }, [openPositions]);

  const maxProfit = positionStats ? Math.max(0, positionStats.maxProfit) : 0;
  const maxLoss = positionStats ? Math.min(0, positionStats.maxLoss) : 0;

  const accountGrowth = useMemo(() => {
    if (accountData && accountData.initial_balance > 0) {
      return ((accountData.current_balance - accountData.initial_balance) / accountData.initial_balance) * 100;
    }
    return 0;
  }, [accountData]);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.$date || dateString);
    // Convert to IST by adding 5 hours and 30 minutes
    date.setTime(date.getTime() + (5.5 * 60 * 60 * 1000));
    
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'  // Use UTC since we manually adjusted the time
    });
  };

  const getPositionTypeColor = (type) => {
    return type === 'LONG' ? 'text-green-400 bg-green-900' : 'text-red-400 bg-red-900';
  };

  const getPnlColor = (pnl) => {
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const resetFilters = () => {
    setFilters({
      symbol: '',
      position_type: '',
      minPnl: '',
      maxPnl: ''
    });
    setClosedPage(1);
  };

  // Add this function to handle position clicks
  const handlePositionClick = (position) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  if (loading && !accountData) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-white mt-4">Loading Account Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">💰 My Account</h1>
            <p className="text-gray-400">Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </div>
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Account Summary */}
        {accountData && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold text-white mr-3">📊 Account Summary</h2>
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Primary Account Information */}
              <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Current Balance</h3>
                <p className="text-green-400 text-lg font-semibold">{formatCurrency(accountData.current_balance)}</p>
                <p className="text-xs text-gray-500 mt-1">out of {formatCurrency(accountData.initial_balance)}</p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Account Growth</h3>
                <p className={`text-lg font-semibold ${getPnlColor(accountGrowth)}`}>
                  {accountGrowth.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Since inception</p>
              </div>

              {/* Margin & Risk Management */}
              <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Margin Status</h3>
                <p className="text-lg font-semibold">
                  <span className="text-purple-400">{formatCurrency(accountData.available_margin)}</span> / <span className="text-orange-400">{formatCurrency(accountData.total_margin_used)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Available / Used</p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Max Leverage</h3>
                <p className="text-cyan-400 text-lg font-semibold">{accountData.max_leverage}:1</p>
                <p className="text-xs text-gray-500 mt-1">Maximum allowed</p>
              </div>

              {/* P&L Information */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Realized P&L</h3>
                <p className={`text-lg font-semibold ${getPnlColor(calculateRealizedPnl)}`}>
                  {formatCurrency(calculateRealizedPnl)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Closed positions</p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Unrealized P&L</h3>
                <p className={`text-lg font-semibold ${getPnlColor(calculateUnrealizedPnl)}`}>
                  {formatCurrency(calculateUnrealizedPnl)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Open positions</p>
              </div>

              {/* Trading Statistics */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Open / Closed Trades</h3>
                <p className="text-white text-lg font-semibold">
                  <span className="text-blue-400">{openPositions.length}</span> / <span>{accountData.total_trades}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Active / Total</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Win Rate</h3>
                <p className="text-green-400 text-lg font-semibold">{(accountData.win_rate || 0).toFixed(2)}%</p>
                <p className="text-xs text-gray-500 mt-1">Success ratio</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Daily Trades</h3>
                <p className="text-yellow-400 text-lg font-semibold">
                  {accountData.daily_trades_count}/{accountData.daily_trades_limit}
                </p>
                <p className="text-xs text-gray-500 mt-1">Used / Limit</p>
              </div>

              {positionStats && (
                <>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Max Profit / Loss</h3>
                    <p className="text-lg font-semibold">
                      <span className="text-green-400">{formatCurrency(maxProfit)}</span> / <span className="text-red-400">{formatCurrency(maxLoss)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Single trade extremes</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Profit / Loss</h3>
                    <p className="text-lg font-semibold">
                      <span className="text-green-400">{formatCurrency(positionStats.totalPositivePnl)}</span> / <span className="text-red-400">{formatCurrency(positionStats.totalNegativePnl)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cumulative gains / losses</p>
                  </div>
                </>
              )}

              <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Brokerage Charge</h3>
                <p className="text-orange-400 text-lg font-semibold">{formatCurrency(accountData.broker_trading)}</p>
                <p className="text-xs text-gray-500 mt-1">Total brokerage fees</p>
              </div>
            </div>
          </div>
        )}

        {/* Open Positions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold text-white mr-3">📈 Open Positions ({openPositions.length})</h2>
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-300">
              <thead className="text-sm text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entry Price</th>
                  <th className="py-3 px-4">Leverage</th>
                  <th className="py-3 px-4">Margin Used</th>
                  <th className="py-3 px-4">Stop Loss</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">P&L</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr 
                    key={position._id} 
                    className="border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handlePositionClick(position)}
                  >
                    <td className="py-3 px-4 font-medium">{position.symbol}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${getPositionTypeColor(position.position_type)}`}>
                        {position.position_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatCurrency(position.entry_price)}</div>
                      <div className="text-xs text-gray-400">{formatDate(position.entry_time)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-cyan-400 font-semibold">{position.leverage}:1</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatCurrency(position.margin_used)}</div>
                      <div className="text-xs text-gray-400">Margin</div>
                    </td>
                    <td className="py-3 px-4 text-red-400">{formatCurrency(position.stop_loss)}</td>
                    <td className="py-3 px-4 text-green-400">{formatCurrency(position.target)}</td>
                    <td className="py-3 px-4">{position.quantity?.toFixed(8)}</td>
                    <td className={`py-3 px-4 ${getPnlColor(position.pnl)}`}>
                      {formatCurrency(position.pnl)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">{position.strategy_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{position.holding_time}</td>
                  </tr>
                ))}
                {openPositions.length === 0 && (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-gray-400">
                      No open positions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Positions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Closed Positions</h2>
          
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Symbol</label>
                <select
                  value={filters.symbol}
                  onChange={(e) => setFilters({...filters, symbol: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Symbols</option>
                  {uniqueValues.symbols && uniqueValues.symbols.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Position Type</label>
                <select
                  value={filters.position_type}
                  onChange={(e) => setFilters({...filters, position_type: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Types</option>
                  {uniqueValues.positionTypes && uniqueValues.positionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Min P&L</label>
                <input
                  type="number"
                  value={filters.minPnl}
                  onChange={(e) => setFilters({...filters, minPnl: e.target.value})}
                  placeholder="Min P&L"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Max P&L</label>
                <input
                  type="number"
                  value={filters.maxPnl}
                  onChange={(e) => setFilters({...filters, maxPnl: e.target.value})}
                  placeholder="Max P&L"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={resetFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
              
              {closedPositionsPagination && (
                <div className="text-sm text-gray-400">
                  Showing {closedPositions.length} of {closedPositionsPagination.totalCount || 0} positions
                </div>
              )}
            </div>
          </div>

          {/* Closed Positions Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-gray-300">
              <thead className="text-sm text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entry Price</th>
                  <th className="py-3 px-4">Exit Price</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Invested</th>
                  <th className="py-3 px-4">P&L</th>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-4">Holding Time</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((position) => (
                  <tr 
                    key={position._id} 
                    className="border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handlePositionClick(position)}
                  >
                    <td className="py-3 px-4 font-medium">{position.symbol}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${getPositionTypeColor(position.position_type)}`}>
                        {position.position_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatCurrency(position.entry_price)}</div>
                      <div className="text-xs text-gray-400">{formatDate(position.entry_time)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatCurrency(position.exit_price)}</div>
                      <div className="text-xs text-gray-400">{position.exit_time ? formatDate(position.exit_time) : '-'}</div>
                    </td>
                    <td className="py-3 px-4">{position.quantity?.toFixed(8)}</td>
                    <td className="py-3 px-4">{formatCurrency(position.invested_amount)}</td>
                    <td className={`py-3 px-4 ${getPnlColor(position.pnl)}`}>
                      {formatCurrency(position.pnl)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">{position.strategy_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{position.holding_time}</td>
                  </tr>
                ))}
                {closedPositions.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-gray-400">
                      No closed positions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {closedPositionsPagination && closedPositionsPagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => setClosedPage(p => Math.max(1, p - 1))}
                disabled={closedPage === 1}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
              >
                Previous
              </button>
              
              <span className="text-gray-400">
                Page {closedPage} of {closedPositionsPagination.totalPages}
              </span>
              
              <button
                onClick={() => setClosedPage(p => Math.min(closedPositionsPagination.totalPages, p + 1))}
                disabled={closedPage === closedPositionsPagination.totalPages}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Position Details Modal */}
      <TradingDataModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPosition(null);
        }}
        data={selectedPosition}
        type="position"
      />
    </div>
  );
};

export default AccountPage; 