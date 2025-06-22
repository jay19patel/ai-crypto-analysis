'use client';

import { useState, useEffect, useMemo } from 'react';
import TradingDataModal from './TradingDataModal';

const TradingDataVisualization = () => {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    symbol: '',
    signal: '',
    trend: '',
    recommendation: ''
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueValues, setUniqueValues] = useState({
    symbols: [],
    signals: [],
    trends: [],
    recommendations: []
  });
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    timestamp: true,
    symbol: true,
    indicators: true,
    strategies: true,
    consensus: true,
    aiAnalysis: true
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const itemsPerPage = 20;

  // Fetch data from MongoDB API
  const fetchData = async (page = 1, search = '', currentFilters = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/trading-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: page,
          limit: itemsPerPage,
          searchTerm: search,
          filters: currentFilters
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

             const result = await response.json();
       
       if (result.success) {
         setData(result.data);
         setUniqueValues(result.uniqueValues);
         setTotalPages(result.totalPages);
         setTotalCount(result.totalCount);
         // Update pagination info if needed
         console.log('Fetched data:', {
           totalCount: result.totalCount,
           totalPages: result.totalPages,
           currentPage: result.currentPage,
           dataLength: result.data.length
         });
         return result;
       } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setUniqueValues({ symbols: [], signals: [], trends: [], recommendations: [] });
      // Show error to user
      alert(`Error fetching data: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData(1, '', {});
  }, []);

  // Since we're using server-side pagination, we don't need client-side filtering
  const paginatedData = data; // Data is already filtered and paginated from server

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchData(1, searchTerm, filters);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on filter change
    fetchData(1, searchTerm, filters);
  }, [filters]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSignalColor = (signal) => {
    if (signal && (signal.includes('BUY') || signal.includes('Bullish') || signal.includes('Buy'))) return 'text-green-400';
    if (signal && (signal.includes('SELL') || signal.includes('Bearish') || signal.includes('Sell'))) return 'text-red-400';
    return 'text-yellow-400';
  };

  const toggleColumn = (columnName) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const resetFilters = () => {
    setFilters({
      symbol: '',
      signal: '',
      trend: '',
      recommendation: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    // Fetch data immediately after reset
    fetchData(1, '', {
      symbol: '',
      signal: '',
      trend: '',
      recommendation: ''
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchData(newPage, searchTerm, filters);
  };

  // Modal functions
  const openModal = (item) => {
    setSelectedData(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedData(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-white mt-4">Loading Trading Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">📊 Trading Data Analysis Dashboard</h2>
        <div className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded-lg">
          Total Records: <span className="text-blue-400">{totalCount}</span> | Current Page: <span className="text-green-400">{data.length}</span> items
        </div>
      </div>

      {/* Instruction for users */}
      <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
        <div className="text-sm text-blue-300 flex items-center">
          <span className="mr-2">💡</span>
          <strong>Tip:</strong> Click on any row or use the "View Details" button to see complete analysis with all indicators, strategies, and AI recommendations in a mobile-friendly view!
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 Search by symbol or summary..."
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={resetFilters}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            🔄 Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.symbol}
            onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
          >
            <option value="">📈 All Symbols</option>
            {uniqueValues.symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          
          <select
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.signal}
            onChange={(e) => setFilters(prev => ({ ...prev, signal: e.target.value }))}
          >
            <option value="">🎯 All Consensus Signals</option>
            {uniqueValues.signals.map(signal => (
              <option key={signal} value={signal}>{signal}</option>
            ))}
          </select>
          
          <select
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.trend}
            onChange={(e) => setFilters(prev => ({ ...prev, trend: e.target.value }))}
          >
            <option value="">📊 All Trends</option>
            {uniqueValues.trends.map(trend => (
              <option key={trend} value={trend}>{trend}</option>
            ))}
          </select>
          
          <select
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.recommendation}
            onChange={(e) => setFilters(prev => ({ ...prev, recommendation: e.target.value }))}
          >
            <option value="">🤖 All AI Recommendations</option>
            {uniqueValues.recommendations.map(rec => (
              <option key={rec} value={rec}>{rec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Column Toggle Controls */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-white">👀 Column Visibility Controls</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(visibleColumns).map(([column, isVisible]) => (
            <label key={column} className="flex items-center space-x-2 cursor-pointer bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleColumn(column)}
                className="w-4 h-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium capitalize text-gray-200">
                {column.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="w-full border-collapse bg-gray-800">
          <thead>
            <tr className="bg-gray-700">
              {visibleColumns.timestamp && <th className="border-b border-gray-600 px-4 py-4 text-left font-semibold text-white">⏰ Timestamp</th>}
              {visibleColumns.symbol && <th className="border-b border-gray-600 px-4 py-4 text-left font-semibold text-white">📈 Symbol Info</th>}
              {visibleColumns.indicators && <th className="border-b border-gray-600 px-4 py-4 text-left font-semibold text-white">📊 Key Indicators</th>}
              {visibleColumns.strategies && <th className="border-b border-gray-600 px-4 py-4 text-left font-semibold text-white">🎯 Trading Strategies</th>}
              {visibleColumns.consensus && <th className="border-b border-gray-600 px-4 py-4 text-left font-semibold text-white">🏛️ Market Consensus</th>}
              {visibleColumns.aiAnalysis && <th className="border-b border-gray-600 px-4 py-4 text-left font-semibold text-white">🤖 AI Analysis & Recommendations</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr 
                key={item._id.$oid || item._id} 
                className={`hover:bg-gray-700 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
                onClick={() => openModal(item)}
                title="Click to view detailed analysis"
              >
                {visibleColumns.timestamp && (
                  <td className="border-b border-gray-600 px-4 py-4 text-sm text-gray-300">
                    {formatDate(item.timestamp.$date || item.timestamp)}
                  </td>
                )}
                
                {visibleColumns.symbol && (
                  <td className="border-b border-gray-600 px-4 py-4">
                    <div className="font-semibold text-lg text-blue-400">{item.analysis_data.symbol}</div>
                    <div className="text-sm text-gray-400">{item.analysis_data.resolution} • {item.analysis_data.days} days</div>
                  </td>
                )}
                
                {visibleColumns.indicators && (
                  <td className="border-b border-gray-600 px-4 py-4">
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {item.analysis_data.indicators.slice(0, 5).map((indicator, idx) => (
                        <div key={idx} className="text-xs flex justify-between items-center bg-gray-700 px-2 py-1 rounded">
                          <span className="font-medium text-gray-300">{indicator.name}:</span>
                          <span className={`ml-2 ${getSignalColor(indicator.interpretation)} font-semibold`}>
                            {indicator.signal}
                          </span>
                        </div>
                      ))}
                      {item.analysis_data.indicators.length > 5 && (
                        <div className="text-xs text-gray-400 italic mt-2">
                          +{item.analysis_data.indicators.length - 5} more indicators
                        </div>
                      )}
                    </div>
                  </td>
                )}
                
                {visibleColumns.strategies && (
                  <td className="border-b border-gray-600 px-4 py-4">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {item.analysis_data.strategies.slice(0, 4).map((strategy, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-blue-500 pl-2 bg-gray-700 p-2 rounded">
                          <div className="font-medium text-gray-300">{strategy.name}</div>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold ${getSignalColor(strategy.signal)}`}>
                              {strategy.signal}
                            </span>
                            <span className="text-gray-400 text-xs">
                              C:{strategy.confidence} | S:{strategy.strength}%
                            </span>
                          </div>
                        </div>
                      ))}
                      {item.analysis_data.strategies.length > 4 && (
                        <div className="text-xs text-gray-400 italic mt-2">
                          +{item.analysis_data.strategies.length - 4} more strategies
                        </div>
                      )}
                    </div>
                  </td>
                )}
                
                {visibleColumns.consensus && (
                  <td className="border-b border-gray-600 px-4 py-4">
                    <div className="text-center bg-gray-700 rounded-lg p-3 border border-gray-600">
                      <div className={`text-lg font-bold ${getSignalColor(item.analysis_data.consensus.signal)}`}>
                        {item.analysis_data.consensus.signal}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        {item.analysis_data.consensus.confidence} Confidence
                      </div>
                      <div className="text-sm text-gray-300">
                        {item.analysis_data.consensus.strength}% Strength
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.analysis_data.consensus.interpretation}
                      </div>
                    </div>
                  </td>
                )}
                
                {visibleColumns.aiAnalysis && (
                  <td className="border-b border-gray-600 px-4 py-4">
                    <div className="space-y-2 bg-blue-900 rounded-lg p-3 border border-blue-700">
                      <div className={`text-lg font-bold ${getSignalColor(item.analysis_data.ai_analysis.recommendation)}`}>
                        🤖 {item.analysis_data.ai_analysis.recommendation}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-medium text-blue-400">Trend:</span> {item.analysis_data.ai_analysis.current_trend}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-300"><span className="font-medium text-green-400">Entry:</span> ${item.analysis_data.ai_analysis.entry_price}</div>
                        <div className="text-gray-300"><span className="font-medium text-blue-400">Target:</span> ${item.analysis_data.ai_analysis.target}</div>
                        <div className="text-gray-300"><span className="font-medium text-red-400">Stop:</span> ${item.analysis_data.ai_analysis.stoploss}</div>
                        <div className="text-gray-300"><span className="font-medium text-yellow-400">R:R:</span> {item.analysis_data.ai_analysis.risk_to_reward}</div>
                      </div>
                      <div className="text-xs text-gray-300 bg-gray-800 rounded p-2 mt-2 border border-gray-600" title={item.analysis_data.ai_analysis.summary}>
                        {item.analysis_data.ai_analysis.summary.length > 100 
                          ? item.analysis_data.ai_analysis.summary.substring(0, 100) + '...'
                          : item.analysis_data.ai_analysis.summary
                        }
                      </div>
                    </div>
                  </td>
                )}

  
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-lg">No data found matching your filters.</div>
          <div className="text-sm mt-2">Try adjusting your search criteria.</div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-300">
            Showing <span className="text-blue-400 font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-blue-400 font-semibold">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="text-green-400 font-semibold">{totalCount}</span> results
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-white bg-gray-700"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                const pageNumber = Math.max(1, currentPage - 2) + idx;
                if (pageNumber > totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-600 hover:bg-gray-700 text-white bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors text-white bg-gray-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Trading Data Modal */}
      <TradingDataModal 
        isOpen={modalOpen}
        onClose={closeModal}
        data={selectedData}
      />
    </div>
  );
};

export default TradingDataVisualization;
