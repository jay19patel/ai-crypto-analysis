'use client';

import { useState, useEffect } from 'react';

const TradingDataModal = ({ isOpen, onClose, data, type = 'analysis' }) => {
  // Handle keyboard ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.$date || dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getPositionTypeColor = (type) => {
    return type === 'LONG' ? 'text-green-400 bg-green-900 border-green-600' : 'text-red-400 bg-red-900 border-red-600';
  };

  const getPnlColor = (pnl) => {
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (type === 'position') {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-75 p-4 sm:p-6"
        onClick={onClose}
        style={{ paddingTop: '2vh', paddingBottom: '2vh' }}
      >
        <div 
          className="relative w-full max-w-4xl bg-gray-900 rounded-lg border border-gray-700 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed at top */}
          <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 rounded-t-lg">
            <div className="flex justify-between items-center p-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  📊 {data.symbol} Position Details
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDate(data.entry_time)} • {data.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">Press ESC or click outside to close</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 space-y-6">
            {/* Position Overview */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Position Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg border ${getPositionTypeColor(data.position_type)}`}>
                  <div className="text-sm text-gray-300">Position Type</div>
                  <div className="text-2xl font-bold">
                    {data.position_type}
                  </div>
                  <div className="text-sm text-gray-400">
                    Strategy: {data.strategy_name}
                  </div>
                </div>

                <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-300">Entry Price</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(data.entry_price)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Quantity: {data.quantity?.toFixed(8)}
                  </div>
                </div>

                <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-300">Invested Amount</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(data.invested_amount)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {data.holding_time ? `Holding: ${data.holding_time}` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Management */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Risk Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-red-900 rounded-lg border border-red-600">
                  <div className="text-sm text-red-300">Stop Loss</div>
                  <div className="text-xl font-bold text-red-400">
                    {formatCurrency(data.stop_loss)}
                  </div>
                  <div className="text-sm text-red-300">
                    Risk: {formatCurrency(Math.abs(data.entry_price - data.stop_loss) * data.quantity)}
                  </div>
                </div>

                <div className="p-3 bg-green-900 rounded-lg border border-green-600">
                  <div className="text-sm text-green-300">Take Profit</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(data.target)}
                  </div>
                  <div className="text-sm text-green-300">
                    Potential: {formatCurrency(Math.abs(data.target - data.entry_price) * data.quantity)}
                  </div>
                </div>

                <div className="p-3 bg-blue-900 rounded-lg border border-blue-600">
                  <div className="text-sm text-blue-300">Risk:Reward</div>
                  <div className="text-xl font-bold text-blue-400">
                    {((Math.abs(data.target - data.entry_price)) / (Math.abs(data.entry_price - data.stop_loss))).toFixed(2)}
                  </div>
                  {data.trailing_stop && (
                    <div className="text-sm text-blue-300">
                      Trailing Stop: {formatCurrency(data.trailing_stop)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* P&L Information */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Profit/Loss Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-300">Current P&L</div>
                  <div className={`text-xl font-bold ${getPnlColor(data.pnl)}`}>
                    {formatCurrency(data.pnl)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {((data.pnl / data.invested_amount) * 100).toFixed(2)}% return
                  </div>
                </div>

                <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-300">Account Value After</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(data.profit_after_amount)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {data.status === 'CLOSED' ? 'Final Balance' : 'Current Balance'}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Additional Info */}
            {(data.notes || data.created_at) && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Additional Information</h3>
                
                {data.notes && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-300 mb-2">Notes:</div>
                    <div className="text-white bg-gray-700 p-3 rounded-lg border border-gray-600">
                      {data.notes || 'No notes available'}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>Created: {formatDate(data.created_at)}</div>
                  <div>Last Updated: {formatDate(data.updated_at)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getSignalColor = (signal) => {
    if (signal && (signal.includes('BUY') || signal.includes('Bullish') || signal.includes('Buy'))) return 'text-green-400';
    if (signal && (signal.includes('SELL') || signal.includes('Bearish') || signal.includes('Sell'))) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSignalBg = (signal) => {
    if (signal && (signal.includes('BUY') || signal.includes('Bullish') || signal.includes('Buy'))) return 'bg-green-900 border-green-600';
    if (signal && (signal.includes('SELL') || signal.includes('Bearish') || signal.includes('Sell'))) return 'bg-red-900 border-red-600';
    return 'bg-yellow-900 border-yellow-600';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              📊 {data.analysis_data.symbol} Analysis Details
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {formatDate(data.timestamp.$date || data.timestamp)} • {data.analysis_data.resolution} • {data.analysis_data.days} days
            </p>
            <p className="text-xs text-gray-500 mt-1">Press ESC or click outside to close</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-6">
          
          {/* AI Analysis Section - Most Important */}
          <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              🤖 AI Analysis & Recommendation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg border ${getSignalBg(data.analysis_data.ai_analysis.recommendation)}`}>
                <div className="text-sm text-gray-300">Recommendation</div>
                <div className={`text-2xl font-bold ${getSignalColor(data.analysis_data.ai_analysis.recommendation)}`}>
                  {data.analysis_data.ai_analysis.recommendation}
                </div>
                <div className="text-sm text-gray-400">
                  Strength: {data.analysis_data.ai_analysis.action_strength}%
                </div>
              </div>
              
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300">Current Trend</div>
                <div className={`text-xl font-bold ${getSignalColor(data.analysis_data.ai_analysis.current_trend)}`}>
                  {data.analysis_data.ai_analysis.current_trend}
                </div>
              </div>
            </div>

            {/* Trading Levels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-green-900 p-3 rounded-lg border border-green-600">
                <div className="text-xs text-green-300">Entry Price</div>
                <div className="text-lg font-bold text-green-400">
                  ${data.analysis_data.ai_analysis.entry_price}
                </div>
              </div>
              
              <div className="bg-blue-900 p-3 rounded-lg border border-blue-600">
                <div className="text-xs text-blue-300">Target</div>
                <div className="text-lg font-bold text-blue-400">
                  ${data.analysis_data.ai_analysis.target}
                </div>
              </div>
              
              <div className="bg-red-900 p-3 rounded-lg border border-red-600">
                <div className="text-xs text-red-300">Stop Loss</div>
                <div className="text-lg font-bold text-red-400">
                  ${data.analysis_data.ai_analysis.stoploss}
                </div>
              </div>
            </div>

            {/* Risk & Summary */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-300">
                  <span className="text-yellow-400 font-medium">Risk:Reward:</span> {data.analysis_data.ai_analysis.risk_to_reward}
                </span>
                {data.analysis_data.ai_analysis.max_holding_period && (
                  <span className="text-gray-300">
                    <span className="text-purple-400 font-medium">Hold Period:</span> {data.analysis_data.ai_analysis.max_holding_period}
                  </span>
                )}
                {data.analysis_data.ai_analysis.volatility_risk && (
                  <span className="text-gray-300">
                    <span className="text-orange-400 font-medium">Volatility:</span> {data.analysis_data.ai_analysis.volatility_risk}
                  </span>
                )}
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300 mb-1">AI Summary:</div>
                <div className="text-gray-200">{data.analysis_data.ai_analysis.summary}</div>
              </div>

              {data.analysis_data.ai_analysis.reason && (
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-300 mb-1">Detailed Reason:</div>
                  <div className="text-gray-200">{data.analysis_data.ai_analysis.reason}</div>
                </div>
              )}
            </div>
          </div>

          {/* Market Consensus */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              🏛️ Market Consensus
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`text-center p-4 rounded-lg border ${getSignalBg(data.analysis_data.consensus.signal)}`}>
                <div className="text-sm text-gray-300">Overall Signal</div>
                <div className={`text-2xl font-bold ${getSignalColor(data.analysis_data.consensus.signal)}`}>
                  {data.analysis_data.consensus.signal}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300">Confidence</div>
                <div className="text-xl font-bold text-white">
                  {data.analysis_data.consensus.confidence}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300">Strength</div>
                <div className="text-xl font-bold text-white">
                  {data.analysis_data.consensus.strength}%
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-300">Interpretation:</div>
              <div className="text-white">{data.analysis_data.consensus.interpretation}</div>
            </div>
          </div>

          {/* Technical Indicators */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              📈 Technical Indicators ({data.analysis_data.indicators.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.analysis_data.indicators.map((indicator, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-300">{indicator.name}</div>
                    <div className="text-xs text-gray-400">{indicator.value}</div>
                  </div>
                  
                  <div className={`text-sm font-semibold ${getSignalColor(indicator.interpretation)}`}>
                    {indicator.signal}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {indicator.interpretation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Strategies */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              🎯 Trading Strategies ({data.analysis_data.strategies.length})
            </h3>
            
            <div className="space-y-3">
              {data.analysis_data.strategies.map((strategy, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                    <div>
                      <div className="text-lg font-medium text-white">{strategy.name}</div>
                      <div className="text-sm text-gray-400">{strategy.interpretation}</div>
                    </div>
                    
                    <div className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-bold ${getSignalColor(strategy.signal)} border ${getSignalBg(strategy.signal)}`}>
                      {strategy.signal}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-300">
                      <span className="text-blue-400 font-medium">Confidence:</span> {strategy.confidence}/5
                    </span>
                    <span className="text-gray-300">
                      <span className="text-green-400 font-medium">Strength:</span> {strategy.strength}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          {(data.analysis_data.ai_analysis.candlestick_patterns || 
            data.analysis_data.ai_analysis.overbought_oversold_alert ||
            data.analysis_data.ai_analysis.unusual_behavior) && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                🔍 Additional Analysis
              </h3>
              
              <div className="space-y-3">
                {data.analysis_data.ai_analysis.candlestick_patterns && (
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-300">Candlestick Patterns:</div>
                    <div className="text-white">{data.analysis_data.ai_analysis.candlestick_patterns}</div>
                  </div>
                )}
                
                {data.analysis_data.ai_analysis.overbought_oversold_alert && (
                  <div className="p-3 bg-orange-900 rounded-lg border border-orange-600">
                    <div className="text-sm text-orange-300">Overbought/Oversold Alert:</div>
                    <div className="text-orange-200">{data.analysis_data.ai_analysis.overbought_oversold_alert}</div>
                  </div>
                )}
                
                {data.analysis_data.ai_analysis.unusual_behavior && (
                  <div className="p-3 bg-purple-900 rounded-lg border border-purple-600">
                    <div className="text-sm text-purple-300">Unusual Behavior:</div>
                    <div className="text-purple-200">{data.analysis_data.ai_analysis.unusual_behavior}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Metadata */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">📄 Document Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Document ID:</span>
                <div className="text-gray-300 font-mono break-all">{data._id.$oid || data._id}</div>
              </div>
              
              <div>
                <span className="text-gray-400">Created:</span>
                <div className="text-gray-300">{data.created_at ? formatDate(data.created_at) : 'N/A'}</div>
              </div>
              
              <div>
                <span className="text-gray-400">Analysis Time:</span>
                <div className="text-gray-300">{formatDate(data.timestamp.$date || data.timestamp)}</div>
              </div>
              
              <div>
                <span className="text-gray-400">Market Data:</span>
                <div className="text-gray-300">{data.analysis_data.resolution} resolution, {data.analysis_data.days} days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDataModal;