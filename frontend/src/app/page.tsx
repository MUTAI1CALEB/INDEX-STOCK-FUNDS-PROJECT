'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import { 
  fetchDashboard, 
    fetchDividends, 
  fetchHistoricalData, 
  fetchBulkHistoricalData,
  fetchQuotes,
  Quote,
  DashboardData,
  DividendsData,
  Holding,
  HistoricalPoint,
  Transaction
} from '../utils/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend 
} from 'recharts';
import { 
  Percent, 
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

let globalDashboardCache: any = null;

export default function Dashboard() {
  // Application states with precise type safety
  const [portfolio, setPortfolio] = useState<DashboardData | null>(globalDashboardCache?.portfolio || null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>(globalDashboardCache?.quotes || {});
  const [dividends, setDividends] = useState<DividendsData | null>(globalDashboardCache?.dividends || null);
  const [chartData, setChartData] = useState<{ name: string; 'Portfolio Value': number; 'Invested Capital': number }[]>(globalDashboardCache?.chartData || []);
  const [exchangeRate, setExchangeRate] = useState<number>(globalDashboardCache?.exchangeRate || 129.5);
  
  // Loading & Action states
  const [loading, setLoading] = useState<boolean>(!globalDashboardCache);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'allocation' | 'performance'>('allocation');
  const [chartTimeframe, setChartTimeframe] = useState<number>(90);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute portfolio history dynamically (moved above loadData to prevent Temporal Dead Zone access issues)
  const fetchHistoricalChart = useCallback(async (transactions: Transaction[], days: number) => {
    try {
      if (!transactions || transactions.length === 0) {
        const chartPoints = [];
        const today = new Date();
        for (let i = 30; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i * Math.max(1, Math.floor(days/30)));
          chartPoints.push({
            name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            'Portfolio Value': 10000,
            'Invested Capital': 10000
          });
        }
        return chartPoints;
      }
      
      const tickers = Array.from(new Set(transactions.map(t => t.ticker)));
      
      const histories: Record<string, HistoricalPoint[]> = await fetchBulkHistoricalData(tickers, days).catch(() => ({}));

      const dates: string[] = [];
      const today = new Date();
      for (let i = days; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      const chartPoints = dates.map(dateStr => {
        const dateEnd = new Date(dateStr + 'T23:59:59Z');
        const pastTx = transactions.filter(t => new Date(t.timestamp) <= dateEnd);

        let iterCash = 10000;
        const shares: Record<string, number> = {};

        pastTx.forEach(t => {
          const qty = typeof t.quantity === 'string' ? parseFloat(t.quantity) : t.quantity;
          const cost = typeof t.total_cost === 'string' ? parseFloat(t.total_cost) : t.total_cost;
          if (!shares[t.ticker]) shares[t.ticker] = 0;

          if (t.action === 'BUY') {
            iterCash -= cost;
            shares[t.ticker] += qty;
          } else if (t.action === 'SELL') {
            iterCash += cost;
            shares[t.ticker] -= qty;
          }
        });

        let assetsValue = 0;
        Object.keys(shares).forEach(ticker => {
          if (shares[ticker] > 0) {
            const tickerHistory = histories[ticker] || [];
            let price = 0;
            let latestPoint = null;
            for (const pt of tickerHistory) {
              if (pt.date <= dateStr) {
                latestPoint = pt;
              } else {
                break;
              }
            }
            if (latestPoint) {
               price = latestPoint.close;
            } else if (tickerHistory.length > 0) {
               price = tickerHistory[0].close;
            }
            assetsValue += shares[ticker] * price;
          }
        });

        return {
          name: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          'Portfolio Value': parseFloat((iterCash + assetsValue).toFixed(2)),
          'Invested Capital': 10000
        };
      });

      if (chartPoints.length > 30) {
        const sampleInterval = Math.max(1, Math.floor(chartPoints.length / 30));
        return chartPoints.filter((_, idx) => idx % sampleInterval === 0 || idx === chartPoints.length - 1);
      }
      return chartPoints;
    } catch (e) {
      console.error('Error compiling historical chart:', e);
      return [];
    }
  }, []);

  // Initial Fetch & Live Data Pull
  const loadData = useCallback(async (isSilent = false) => {
    // Check constraints to avoid setting state synchronously inside useEffect mount loop
    if (!isSilent && !globalDashboardCache && !loading) {
      setLoading(true);
    }
    if (errorMessage !== null) {
      setErrorMessage(null);
    }
    try {
      // Fetch all core dashboard endpoints concurrently to optimize latency
      const [quotesList, dashboardData, divData, rateRes] = await Promise.all([
        fetchQuotes(),
        fetchDashboard(),
        fetchDividends(),
        fetch('https://open.er-api.com/v6/latest/USD').catch(() => null)
      ]);

      const quotesMap: Record<string, Quote> = {};
      quotesList.forEach((q: Quote) => {
        quotesMap[q.symbol] = q;
      });
      setQuotes(quotesMap);
      setPortfolio(dashboardData);
      setDividends(divData);

      let fetchedRate = 129.5;
      if (rateRes && rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.rates && rateData.rates.KES) {
          fetchedRate = rateData.rates.KES;
          setExchangeRate(fetchedRate);
        }
      }

      // Save key stats to localStorage so Header can dynamically display them
      localStorage.setItem('investiq_cash_balance', dashboardData.cash_balance.toString());
      localStorage.setItem('investiq_risk_profile', dashboardData.risk_profile || 'Unassessed');
      window.dispatchEvent(new Event('storage_updated'));

      // Generate Recharts Historical Performance concurrently but distinct from basic info
      if (!isSilent) setChartLoading(true);
      const historyChart = await fetchHistoricalChart(dashboardData.transactions || [], 90);
      setChartData(historyChart);
      if (!isSilent) setChartLoading(false);

      // Save to global cache so navigating back is instant
      globalDashboardCache = {
        portfolio: dashboardData,
        quotes: quotesMap,
        dividends: divData,
        chartData: historyChart,
        exchangeRate: fetchedRate
      };

    } catch (e) {
      const err = e as Error;
      console.error('Failed fetching live dashboard details', err);
      setErrorMessage(err.message || 'Error connecting to backend services.');
    } finally {
      setLoading(false);
    }
  }, [loading, errorMessage, fetchHistoricalChart]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(!!globalDashboardCache); // Fetch silently if we have cached data
  }, [loadData]);

  // Handle timeframe changes independently to avoid full reload
  useEffect(() => {
    if (portfolio && activeChartTab === 'performance') {
      setChartLoading(true);
      fetchHistoricalChart(portfolio.transactions || [], chartTimeframe).then(data => {
        setChartData(data);
        setChartLoading(false);
      });
    }
  }, [chartTimeframe, activeChartTab, portfolio, fetchHistoricalChart]);


  // Helper calculations
  const totalNetWorth = portfolio?.total_portfolio_value || 10000;
  const cashBalance = portfolio?.cash_balance || 10000;
  const totalDividends = dividends?.total_annual_dividend_income || 0;
  const netDividends = totalDividends * 0.70; // 30% withholding tax

  const totalGainLoss = portfolio?.total_gain_loss || 0;
  const totalGainLossPct = portfolio?.total_gain_loss_pct || 0;

  const pieData = portfolio ? [
    { name: 'Cash', value: portfolio.cash_balance, fill: '#64748B' }, // Slate 500
    ...portfolio.holdings
      .filter(h => h.market_value > 0)
      .map((h, i) => ({
        name: h.ticker,
        value: h.market_value,
        fill: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'][i % 7]
      }))
  ] : [];


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

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
        
        {/* Error notification banner */}
        {errorMessage && (
          <div className="col-span-12 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold">
            Warning: {errorMessage} Using cached fallback quote indices.
          </div>
        )}

        <div className="space-y-8">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Live Portfolio Net Worth */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Total Net Worth (USD)</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 leading-none">
                ${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              
              {/* Premium color-coded Visual Gain/Loss indicator */}
              <div className="flex items-center gap-1 mt-2">
                {totalGainLoss >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                )}
                <span className={`text-xs font-bold ${totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalGainLossPct.toFixed(2)}%)
                </span>
              </div>

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
                  className="text-[10px] font-bold text-emerald-400/90 hover:underline uppercase tracking-wide cursor-pointer flex items-center gap-1 bg-transparent border-none outline-none p-0"
                >
                  <Percent className="w-3 h-3" />
                  {withholdingTaxEnabled ? '30% US Tax Applied' : 'Gross Dividends'}
                </button>
                <span className="text-[10px] text-gray-400 font-medium">
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

          {/* Chart Card */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex gap-4">
                  <h3 
                    className={`text-base font-bold leading-none mb-1 cursor-pointer pb-1 ${activeChartTab === 'allocation' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveChartTab('allocation')}
                  >
                    Asset Allocation
                  </h3>
                  <h3 
                    className={`text-base font-bold leading-none mb-1 cursor-pointer pb-1 ${activeChartTab === 'performance' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveChartTab('performance')}
                  >
                    Historical Performance
                  </h3>
                </div>
                <p className="text-xs text-gray-400 font-light mt-2">
                  {activeChartTab === 'allocation' 
                    ? 'Visualizing your current portfolio asset distribution.' 
                    : 'Visualizing your portfolio value over time.'}
                </p>
              </div>

              {activeChartTab === 'performance' && (
                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-white/5">
                  {[7, 30, 90, 365].map(days => (
                    <button
                      key={days}
                      onClick={() => setChartTimeframe(days)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${chartTimeframe === days ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white'}`}
                    >
                      {days === 7 ? '1W' : days === 30 ? '1M' : days === 90 ? '3M' : '1Y'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-[280px] w-full relative">
              {chartLoading && activeChartTab === 'performance' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20 backdrop-blur-sm rounded-3xl z-10">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : null}

              {activeChartTab === 'allocation' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      contentStyle={{ 
                        background: '#0F172A', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend 
                      verticalAlign="middle" 
                      layout="vertical" 
                      align="right"
                      wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
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
              )}
            </div>
          </div>

          {/* Active Holdings Table */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Your Active Asset Holdings</h3>
            
            {!portfolio || portfolio.holdings.length === 0 ? (
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
                    {portfolio.holdings.map((holding: Holding) => (
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

      </main>
    </div>
  );
}
