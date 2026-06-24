'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import { 
  fetchDashboard, 
  executeTrade, 
  fetchDividends, 
  fetchHistoricalData, 
  fetchQuotes 
} from '../utils/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  ChevronRight, 
  Percent, 
  RefreshCw, 
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  DollarSign
} from 'lucide-react';

interface Quote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  marketCap: number;
  volume: number;
}

export default function Dashboard() {
  // Application states
  const [portfolio, setPortfolio] = useState<any>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [dividends, setDividends] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(129.5);
  
  // Loading & Action states
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState<boolean>(true);
  
  // Trade Form states
  const [tradeQuantity, setTradeQuantity] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial Fetch & Live Data Pull
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch live quotes for all assets
      const quotesList = await fetchQuotes();
      const quotesMap: Record<string, Quote> = {};
      quotesList.forEach((q: Quote) => {
        quotesMap[q.symbol] = q;
      });
      setQuotes(quotesMap);

      // 2. Fetch User portfolio dashboard
      const dashboardData = await fetchDashboard();
      setPortfolio(dashboardData);

      // Save key stats to localStorage so Header can dynamically display them
      localStorage.setItem('investiq_cash_balance', dashboardData.cash_balance.toString());
      localStorage.setItem('investiq_risk_profile', dashboardData.risk_profile || 'Unassessed');
      window.dispatchEvent(new Event('storage_updated'));

      // 3. Fetch Dividend summary
      const divData = await fetchDividends();
      setDividends(divData);

      // 4. Fetch USD to KES live exchange rate
      try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (rateRes.ok) {
          const rateData = await rateRes.json();
          if (rateData.rates && rateData.rates.KES) {
            setExchangeRate(rateData.rates.KES);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live KES rate, using fallback 129.5', err);
      }

      // 5. Generate Recharts Historical Performance
      setChartLoading(true);
      const historyChart = await fetchHistoricalChart(dashboardData.holdings, dashboardData.cash_balance);
      setChartData(historyChart);
      setChartLoading(false);

    } catch (e: any) {
      console.error('Failed fetching live dashboard details', e);
      setErrorMessage(e.message || 'Error connecting to backend services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute portfolio history dynamically
  const fetchHistoricalChart = async (holdings: any[], cash: number) => {
    const heldAssets = holdings.filter(h => h.quantity > 0);
    const today = new Date();
    
    if (heldAssets.length === 0) {
      // Generate a flat line chart using today's cash balance
      const chartPoints = [];
      for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i * 3); // 30 points across 90 days
        chartPoints.push({
          name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          'Portfolio Value': cash,
          'Invested Capital': 10000
        });
      }
      return chartPoints;
    }

    try {
      // Fetch historical charts for all held assets
      const histories = await Promise.all(
        heldAssets.map(asset => 
          fetchHistoricalData(asset.ticker, 90)
            .then(data => ({ ticker: asset.ticker, data }))
            .catch(() => ({ ticker: asset.ticker, data: [] }))
        )
      );

      // Map date -> portfolio value
      const dateValues: Record<string, number> = {};
      const dates: string[] = [];

      histories.forEach(({ ticker, data }) => {
        const asset = heldAssets.find(h => h.ticker === ticker);
        const qty = asset ? asset.quantity : 0;
        data.forEach((point: any) => {
          const date = point.date;
          if (!dateValues[date]) {
            dateValues[date] = 0;
            dates.push(date);
          }
          dateValues[date] += qty * point.close;
        });
      });

      // Sort dates oldest to newest and build final Recharts array
      dates.sort();
      
      // Limit to 30 sample points for chart readability
      const sampleInterval = Math.max(1, Math.floor(dates.length / 30));
      const sampledDates = dates.filter((_, idx) => idx % sampleInterval === 0 || idx === dates.length - 1);

      return sampledDates.map(date => {
        const totalAssetValue = dateValues[date];
        return {
          name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          'Portfolio Value': parseFloat((totalAssetValue + cash).toFixed(2)),
          'Invested Capital': 10000
        };
      });
    } catch (e) {
      console.error('Error compiling historical chart:', e);
      return [];
    }
  };

  // Execute buy or sell order
  const handleTrade = async (ticker: string, action: 'BUY' | 'SELL') => {
    setErrorMessage(null);
    const qtyStr = tradeQuantity[ticker] || '';
    const qty = parseFloat(qtyStr);
    
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    setActionLoading(prev => ({ ...prev, [ticker]: true }));
    try {
      await executeTrade(ticker, action, qty);
      
      // Reset trade input field
      setTradeQuantity(prev => ({ ...prev, [ticker]: '' }));
      
      // Reload dashboard state silently
      await loadData(true);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || `Failed to execute ${action} order.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [ticker]: false }));
    }
  };

  // Reset local portfolio back to $10,000 cash balance
  const handleResetPortfolio = async () => {
    if (!confirm('Are you sure you want to reset your mock cash balance to $10,000 and sell all holdings?')) return;
    
    setLoading(true);
    try {
      // Sell all holdings
      if (portfolio && portfolio.holdings) {
        for (const holding of portfolio.holdings) {
          if (holding.quantity > 0) {
            await executeTrade(holding.ticker, 'SELL', holding.quantity);
          }
        }
      }
      // Re-trigger load to sync
      await loadData();
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to reset portfolio.');
    } finally {
      setLoading(false);
    }
  };

  // Helper calculations
  const totalNetWorth = portfolio?.total_portfolio_value || 10000;
  const cashBalance = portfolio?.cash_balance || 10000;
  const totalDividends = dividends?.total_annual_dividend_income || 0;
  const netDividends = totalDividends * 0.70; // 30% withholding tax

  const totalGainLoss = portfolio?.total_gain_loss || 0;
  const totalGainLossPct = portfolio?.total_gain_loss_pct || 0;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title="Live Portfolio Tracker" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <span className="text-sm text-gray-400">Fetching live market data and portfolio stats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Live Portfolio Dashboard" />

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Error notification banner */}
        {errorMessage && (
          <div className="col-span-12 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold">
            Warning: {errorMessage} Using cached fallback quote indices.
          </div>
        )}

        {/* Left Column: Financial Stats & Recharts (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Live Portfolio Net Worth */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Total Net Worth (USD)</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 leading-none">
                ${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-white/5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">KES Equivalent:</span>
                <span className="text-xs font-extrabold text-white">
                  KSh {(totalNetWorth * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Trailing Dividends (TTM) */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Estimated Annual Dividends</span>
              <h4 className="text-2xl font-extrabold text-emerald-400 mt-1.5 leading-none">
                ${(withholdingTaxEnabled ? netDividends : totalDividends).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-white/5">
                <button 
                  onClick={() => setWithholdingTaxEnabled(!withholdingTaxEnabled)}
                  className="text-[10px] font-bold text-emerald-400/90 hover:underline uppercase tracking-wide cursor-pointer flex items-center gap-1"
                >
                  <Percent className="w-3 h-3" />
                  {withholdingTaxEnabled ? '30% US Tax Applied' : 'Gross Dividends'}
                </button>
                <span className="text-[10px] text-gray-400">
                  KSh {((withholdingTaxEnabled ? netDividends : totalDividends) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Uninvested USD Cash */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Simulated Cash (USD)</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 leading-none">
                ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-white/5">
                <span className="text-[10px] text-amber-500 font-bold uppercase">Exchange rate:</span>
                <span className="text-xs font-semibold text-gray-400">{exchangeRate.toFixed(2)} KSh/USD</span>
              </div>
            </div>
          </div>

          {/* Area Chart Card */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white leading-none mb-1">Portfolio Growth Chart (Live Present-Day)</h3>
                <p className="text-xs text-gray-400 font-light">Visualizing your simulated holdings value across the past 90 days.</p>
              </div>

              {/* Legend indicators */}
              <div className="flex items-center gap-3.5 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-1 rounded-full bg-emerald-500" />
                  <span>Portfolio Value</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-1 rounded-full bg-gray-600" />
                  <span>Cost Basis ($10K)</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-[280px] w-full relative">
              {chartLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20 backdrop-blur-sm rounded-3xl">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : null}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={['dataMin - 100', 'dataMax + 200']} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0F172A', 
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="Portfolio Value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Holdings Table */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Your Active Asset Holdings</h3>
            
            {portfolio?.holdings?.length === 0 ? (
              <p className="text-xs text-gray-500 font-light">You do not hold any asset shares. Execute simulated trades from the trading desk on the right.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Ticker</th>
                      <th className="pb-3 font-semibold text-right">Shares</th>
                      <th className="pb-3 font-semibold text-right">Avg Cost Basis</th>
                      <th className="pb-3 font-semibold text-right">Live Price</th>
                      <th className="pb-3 font-semibold text-right">Market Value</th>
                      <th className="pb-3 font-semibold text-right">Gain / Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((holding: any) => (
                      <tr key={holding.ticker} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 font-extrabold text-white">{holding.ticker}</td>
                        <td className="py-3 text-right text-gray-300 font-semibold">{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                        <td className="py-3 text-right text-gray-400">${holding.avg_cost_basis.toFixed(2)}</td>
                        <td className="py-3 text-right text-gray-400">${holding.current_price.toFixed(2)}</td>
                        <td className="py-3 text-right text-white font-bold">${holding.market_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right font-bold ${holding.gain_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {holding.gain_loss >= 0 ? '+' : ''}${holding.gain_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({holding.gain_loss_pct.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Trading Desk (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Live Trading Desk</h3>
                <span className="text-[10px] text-gray-400 font-light block">Simulate fractional orders in USD</span>
              </div>
              
              <button 
                onClick={handleResetPortfolio}
                className="p-2 border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                title="Reset Portfolio"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of assets */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {Object.values(quotes).map((quote) => {
                const heldAsset = portfolio?.holdings?.find((h: any) => h.ticker === quote.symbol);
                const shares = heldAsset ? heldAsset.quantity : 0;
                const ticker = quote.symbol;
                
                // Get state-specific trade quantities
                const inputQty = tradeQuantity[ticker] || '';

                return (
                  <div key={ticker} className="p-4 rounded-2xl bg-slate-900/40 border border-white/[0.03] hover:border-white/5 transition-all">
                    {/* Ticker title, name and live price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white">{ticker}</span>
                          <span className="text-[9px] font-semibold text-gray-500 uppercase px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5">{quote.name.substring(0, 15)}...</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Owns: {shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white block">${quote.price.toFixed(2)}</span>
                        <div className={`flex items-center gap-0.5 justify-end text-[10px] font-bold ${quote.changesPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {quote.changesPercentage >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{Math.abs(quote.changesPercentage).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Fractional Input and Buy/Sell Actions */}
                    <div className="mt-3.5 pt-3.5 border-t border-white/[0.03] flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-extrabold">QTY</span>
                        <input
                          type="number"
                          placeholder="0.0"
                          value={inputQty}
                          onChange={(e) => setTradeQuantity(prev => ({ ...prev, [ticker]: e.target.value }))}
                          disabled={actionLoading[ticker]}
                          className="w-full text-xs font-semibold pl-9 pr-2 py-2 rounded-xl bg-slate-950 border border-white/5 focus:border-emerald-500 outline-none text-white transition-colors"
                        />
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleTrade(ticker, 'BUY')}
                          disabled={actionLoading[ticker] || !inputQty}
                          className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold rounded-xl text-xs active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1"
                        >
                          {actionLoading[ticker] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                        </button>
                        <button
                          onClick={() => handleTrade(ticker, 'SELL')}
                          disabled={actionLoading[ticker] || shares === 0 || !inputQty}
                          className="px-3.5 py-2 bg-red-600/10 hover:bg-red-500 text-red-400 hover:text-white font-bold rounded-xl text-xs active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1"
                        >
                          {actionLoading[ticker] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sell'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Informational Callout */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 mt-5 text-[11px] text-gray-400 leading-normal flex gap-2">
              <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-0.5">Kenyan Exchange Conversions:</p>
                <p className="font-light">
                  US dollar investments are evaluated in real-time. Showing dynamic exchange valuations dynamically mapped using the live exchange rate (**{exchangeRate.toFixed(2)} KSh/USD**).
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
