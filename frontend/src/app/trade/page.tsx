'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/layout/Header';
import { 
  fetchDashboard, 
  executeTrade, 
  fetchQuotes,
  Quote,
  DashboardData,
  Holding
} from '../../utils/api';
import { 
  RefreshCw, 
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function TradeDesk() {
  const [portfolio, setPortfolio] = useState<DashboardData | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [exchangeRate, setExchangeRate] = useState<number>(129.5);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [tradeQuantity, setTradeQuantity] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchingMarket, setSearchingMarket] = useState(false);

  const handleSearchMarket = async () => {
    if (!searchQuery) return;
    setSearchingMarket(true);
    setErrorMessage(null);
    try {
      const result = await fetchQuotes(searchQuery);
      if (result && result.length > 0) {
        setQuotes(prev => {
          const updated = { ...prev };
          result.forEach((q: Quote) => {
            updated[q.symbol] = q;
          });
          return updated;
        });
        toast.success(`Found market data for ${searchQuery}`);
      } else {
        toast.error(`Could not find ticker: ${searchQuery}`);
      }
    } catch (e) {
      setErrorMessage(`Failed to search market for ${searchQuery}`);
    } finally {
      setSearchingMarket(false);
    }
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMessage(null);
    try {
      const [quotesList, dashboardData, rateRes] = await Promise.all([
        fetchQuotes(),
        fetchDashboard(),
        fetch('https://open.er-api.com/v6/latest/USD').catch(() => null)
      ]);

      const quotesMap: Record<string, Quote> = {};
      quotesList.forEach((q: Quote) => {
        quotesMap[q.symbol] = q;
      });
      setQuotes(quotesMap);
      setPortfolio(dashboardData);

      if (rateRes && rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.rates && rateData.rates.KES) {
          setExchangeRate(rateData.rates.KES);
        }
      }

      // Update basic context for header
      localStorage.setItem('investiq_cash_balance', dashboardData.cash_balance.toString());
      localStorage.setItem('investiq_risk_profile', dashboardData.risk_profile || 'Unassessed');
      window.dispatchEvent(new Event('storage_updated'));

    } catch (e) {
      const err = e as Error;
      console.error('Failed fetching trading data', err);
      setErrorMessage(err.message || 'Error connecting to backend services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTrade = async (ticker: string, action: 'BUY' | 'SELL') => {
    if (errorMessage !== null) setErrorMessage(null);
    const qtyStr = tradeQuantity[ticker] || '';
    
    if (!qtyStr) {
      alert('Quantity must be chosen.');
      return;
    }

    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid positive quantity.');
      return;
    }

    setActionLoading(prev => ({ ...prev, [ticker]: true }));
    try {
      await executeTrade(ticker, action, qty);
      setTradeQuantity(prev => ({ ...prev, [ticker]: '' }));
      await loadData(true);
      toast.success(`Successfully executed ${action} for ${qty} shares of ${ticker}`);
    } catch (e) {
      const err = e as Error;
      setErrorMessage(err.message || `Failed to execute ${action} order.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [ticker]: false }));
    }
  };

  const filteredQuotes = Object.values(quotes).filter(quote => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return quote.symbol.toLowerCase().includes(lowerQuery) || quote.name.toLowerCase().includes(lowerQuery);
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title="Live Trading Desk" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <span className="text-sm text-gray-400">Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Live Trading Desk" />

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
        
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold">
            Warning: {errorMessage}
          </div>
        )}

        <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-5 mb-5 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Live Markets</h3>
              <span className="text-xs text-gray-400 font-light block mt-1">Search, evaluate, and trade fractional US assets</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ticker or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchMarket();
                  }}
                  className="pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors w-full sm:w-64"
                />
              </div>
              <button 
                onClick={() => loadData(true)}
                className="p-2.5 border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all"
                title="Refresh Quotes"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotes.map((quote) => {
                const heldAsset = portfolio?.holdings?.find((h: Holding) => h.ticker === quote.symbol);
                const shares = heldAsset ? heldAsset.quantity : 0;
                const ticker = quote.symbol;
                const inputQty = tradeQuantity[ticker] || '';

                return (
                  <div key={ticker} className="p-5 rounded-2xl bg-slate-900/40 border border-white/[0.05] hover:border-white/10 hover:bg-slate-900/60 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2 cursor-pointer group" onClick={() => setSelectedQuote(quote)}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors">{ticker}</span>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5 truncate max-w-[100px]">
                              {quote.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Owns: {shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} shares</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-white block leading-none mb-1">${quote.price.toFixed(2)}</span>
                          <div className={`flex items-center gap-0.5 justify-end text-xs font-bold ${quote.changesPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {quote.changesPercentage >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{Math.abs(quote.changesPercentage).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/[0.03] flex items-center gap-2">
                      <div className="relative flex-1">
                        <label htmlFor={`trade-qty-${ticker}`} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-extrabold">QTY</label>
                        <input
                          id={`trade-qty-${ticker}`}
                          name={`trade-qty-${ticker}`}
                          type="number"
                          placeholder="0.0"
                          value={inputQty}
                          onChange={(e) => setTradeQuantity(prev => ({ ...prev, [ticker]: e.target.value }))}
                          disabled={actionLoading[ticker]}
                          className="w-full text-sm font-semibold pl-10 pr-2 py-2.5 rounded-xl bg-slate-950 border border-white/5 focus:border-emerald-500 outline-none text-white transition-colors"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTrade(ticker, 'BUY')}
                          disabled={actionLoading[ticker]}
                          className="px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center min-w-[60px]"
                        >
                          {actionLoading[ticker] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                        </button>
                        <button
                          onClick={() => handleTrade(ticker, 'SELL')}
                          disabled={actionLoading[ticker]}
                          className="px-4 py-2.5 bg-red-600/10 hover:bg-red-500 text-red-400 hover:text-white font-bold rounded-xl text-sm active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center min-w-[60px]"
                        >
                          {actionLoading[ticker] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sell'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredQuotes.length === 0 && (
                <div className="col-span-full py-10 text-center flex flex-col items-center justify-center">
                  <p className="text-gray-500 text-sm mb-4">No local stocks found matching "{searchQuery}"</p>
                  <button 
                    onClick={handleSearchMarket}
                    disabled={searchingMarket}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {searchingMarket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search Global Market
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 mt-5 text-xs text-gray-400 leading-normal flex items-start gap-2">
            <Coins className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-white mb-0.5">Real-time Trading Environment & Exchange Rate</p>
              <p className="font-light">
                Prices and execution are simulated in real-time. Uninvested USD cash balance: <strong className="text-white">${portfolio?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>. Current Exchange Rate: <strong className="text-white">{exchangeRate.toFixed(2)} KSh/USD</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Stock Details Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-panel border border-white/10 rounded-2xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedQuote.symbol}</h3>
                  <span className="text-xs text-gray-400 font-medium">{selectedQuote.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedQuote(null)}
                  className="p-1.5 rounded-xl border border-white/5 bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Current Price</span>
                  <span className="text-lg font-bold text-white">${selectedQuote.price.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Day Change</span>
                  <div className={`flex items-center gap-1 text-sm font-bold ${selectedQuote.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedQuote.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>${Math.abs(selectedQuote.change).toFixed(2)} ({Math.abs(selectedQuote.changesPercentage).toFixed(2)}%)</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Volume</span>
                  <span className="text-sm font-medium text-white">{selectedQuote.volume?.toLocaleString() || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Market Cap</span>
                  <span className="text-sm font-medium text-white">
                    {selectedQuote.marketCap ? `$${(selectedQuote.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setSelectedQuote(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl active:scale-[0.98] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
