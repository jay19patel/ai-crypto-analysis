'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

const AccountPage = () => {
  const [accountData, setAccountData] = useState(null);
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [positionStats, setPositionStats] = useState(null);
  const [closedPositionsPagination, setClosedPositionsPagination] = useState({});
  const [uniqueValues, setUniqueValues] = useState({ symbols: [], positionTypes: [] });
  const [loading, setLoading] = useState(true);
  
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

  const unrealizedPnl = useMemo(() => {
    return openPositions.reduce((acc, pos) => acc + (pos.pnl || 0), 0);
  }, [openPositions]);

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
    return new Date(dateString).toLocaleString();
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
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Current Balance</h3>
                <p className="text-green-400 text-lg font-semibold">{formatCurrency(accountData.current_balance)}</p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Equity</h3>
                <p className="text-blue-400 text-lg font-semibold">{formatCurrency(accountData.equity)}</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Initial Balance</h3>
                <p className="text-gray-300 text-lg font-semibold">{formatCurrency(accountData.initial_balance)}</p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Account Growth</h3>
                <p className={`text-lg font-semibold ${getPnlColor(accountGrowth)}`}>
                  {accountGrowth.toFixed(2)}%
                </p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Realized P&L</h3>
                <p className={`text-lg font-semibold ${getPnlColor(accountData.total_profit)}`}>
                  {formatCurrency(accountData.total_profit)}
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Unrealized P&L</h3>
                <p className={`text-lg font-semibold ${getPnlColor(unrealizedPnl)}`}>
                  {formatCurrency(unrealizedPnl)}
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Open / Closed Trades</h3>
                <p className="text-white text-lg font-semibold">
                  <span className="text-blue-400">{openPositions.length}</span> / <span>{accountData.total_trades}</span>
                </p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Win Rate</h3>
                <p className="text-green-400 text-lg font-semibold">{(accountData.win_rate || 0).toFixed(2)}%</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Daily Trades</h3>
                <p className="text-yellow-400 text-lg font-semibold">
                  {accountData.daily_trades_count}/{accountData.daily_trades_limit}
                </p>
              </div>

              {positionStats && (
                <>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Max Profit / Loss</h3>
                    <p className="text-lg font-semibold">
                      <span className="text-green-400">{formatCurrency(positionStats.maxProfit)}</span> / <span className="text-red-400">{formatCurrency(positionStats.maxLoss)}</span>
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Total Profit / Loss</h3>
                    <p className="text-lg font-semibold">
                      <span className="text-green-400">{formatCurrency(positionStats.totalPositivePnl)}</span> / <span className="text-red-400">{formatCurrency(positionStats.totalNegativePnl)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Open Positions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">🔄 Open Positions</h2>
          
          {openPositions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">📭 No open positions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left text-gray-300 font-medium py-3 px-2">Symbol</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-2">Type</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-2">Entry Price</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-2">Quantity</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-2">Invested</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-2">P&L</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-2">Entry Time</th>
                  </tr>
                </thead>
                <tbody>
                  {openPositions.map((position) => (
                    <tr key={position._id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-2 text-white font-medium">{position.symbol}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${getPositionTypeColor(position.position_type)}`}>
                          {position.position_type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-300">{formatCurrency(position.entry_price)}</td>
                      <td className="py-3 px-2 text-gray-300">{position.quantity?.toFixed(6)}</td>
                      <td className="py-3 px-2 text-gray-300">{formatCurrency(position.invested_amount)}</td>
                      <td className={`py-3 px-2 font-medium ${getPnlColor(position.pnl)}`}>
                        {formatCurrency(position.pnl || 0)}
                      </td>
                      <td className="py-3 px-2 text-gray-400 text-xs">{formatDate(position.entry_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          {closedPositions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">📭 No closed positions found for the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Symbol</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Type</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Entry Price</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Exit Price</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Quantity</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">P&L</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Holding Time</th>
                      <th className="text-left text-gray-300 font-medium py-3 px-2">Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedPositions.map((position) => (
                      <tr key={position._id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-2 text-white font-medium">{position.symbol}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${getPositionTypeColor(position.position_type)}`}>
                            {position.position_type}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-300">{formatCurrency(position.entry_price)}</td>
                        <td className="py-3 px-2 text-gray-300">{formatCurrency(position.exit_price)}</td>
                        <td className="py-3 px-2 text-gray-300">{position.quantity?.toFixed(6)}</td>
                        <td className={`py-3 px-2 font-medium ${getPnlColor(position.pnl)}`}>
                          {formatCurrency(position.pnl)}
                        </td>
                        <td className="py-3 px-2 text-gray-400">{position.holding_time}</td>
                        <td className="py-3 px-2 text-gray-400 text-xs">{position.strategy_name}</td>
                      </tr>
                    ))}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage; 