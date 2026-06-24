'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import { SUPPORTED_ASSETS, HISTORICAL_MONTHLY_PRICES, MONTH_NAMES, Asset } from '../utils/mockData';
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
  Plus, 
  Minus, 
  Sparkles, 
  HelpCircle,
  Percent,
  RefreshCw,
  Coins
} from 'lucide-react';

// Fixed conversion rates for 2020
const KES_USD_JAN = 101; // 1 USD = 101 KES (Jan 2, 2020)
const KES_USD_DEC = 109; // 1 USD = 109 KES (Dec 31, 2020)

// Linear interpolation of exchange rates across 12 months (Jan=0, Dec=11)
const getExchangeRateForMonth = (monthIndex: number): number => {
  return KES_USD_JAN + (KES_USD_DEC - KES_USD_JAN) * (monthIndex / 11);
};

export default function Dashboard() {
  // Initial holdings state: symbol -> shares count
  const [holdings, setHoldings] = useState<Record<string, number>>({
    AAPL: 0,
    MSFT: 0,
    VOO: 0,
    SCOM: 0,
    EQTY: 0,
  });

  const [cashBalance, setCashBalance] = useState<number>(10000);
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState<boolean>(true);

  // Initialize cash balance from local storage or set default
  useEffect(() => {
    const savedBalance = localStorage.getItem('investiq_cash_balance');
    if (savedBalance) {
      setCashBalance(parseFloat(savedBalance));
    } else {
      localStorage.setItem('investiq_cash_balance', '10000');
    }

    const savedHoldings = localStorage.getItem('investiq_holdings');
    if (savedHoldings) {
      try {
        setHoldings(JSON.parse(savedHoldings));
      } catch (e) {
        console.warn('Failed parsing holdings', e);
      }
    }
  }, []);

  // Save state helper
  const saveState = (newHoldings: Record<string, number>, newBalance: number) => {
    setHoldings(newHoldings);
    setCashBalance(newBalance);
    localStorage.setItem('investiq_holdings', JSON.stringify(newHoldings));
    localStorage.setItem('investiq_cash_balance', newBalance.toString());
    // Dispatch custom event to notify Header
    window.dispatchEvent(new Event('storage_updated'));
  };

  // Reset Sandbox portfolio
  const handleReset = () => {
    const defaultHoldings = { AAPL: 0, MSFT: 0, VOO: 0, SCOM: 0, EQTY: 0 };
    saveState(defaultHoldings, 10000);
  };

  // Buy shares logic
  const adjustShares = (symbol: string, change: number) => {
    const asset = SUPPORTED_ASSETS.find(a => a.symbol === symbol);
    if (!asset) return;

    // Price in USD for buying on Jan 2, 2020
    const priceInUSD = asset.currency === 'USD' 
      ? asset.startPrice2020 
      : asset.startPrice2020 / KES_USD_JAN;

    const currentShares = holdings[symbol] || 0;
    const newShares = Math.max(0, currentShares + change);
    
    // Calculate total cost change
    const costUSD = priceInUSD * change;

    // Verify balance
    if (costUSD > cashBalance) {
      alert("Insufficient USD cash to complete this transaction!");
      return;
    }

    const nextHoldings = { ...holdings, [symbol]: newShares };
    const nextBalance = cashBalance - costUSD;

    saveState(nextHoldings, nextBalance);
  };

  // Calculations for Net Worth
  const portfolioSummary = useMemo(() => {
    let startAssetValueUSD = 0;
    let endAssetValueUSD = 0;
    let totalDividendsGrossUSD = 0;

    SUPPORTED_ASSETS.forEach(asset => {
      const shares = holdings[asset.symbol] || 0;
      if (shares === 0) return;

      if (asset.currency === 'USD') {
        startAssetValueUSD += shares * asset.startPrice2020;
        endAssetValueUSD += shares * asset.endPrice2020;
        
        // Dividends
        const divYieldRatio = asset.dividendYield2020 / 100;
        totalDividendsGrossUSD += (shares * asset.startPrice2020) * divYieldRatio;
      } else {
        // Kenyan assets
        const startPriceUSD = asset.startPrice2020 / KES_USD_JAN;
        const endPriceUSD = asset.endPrice2020 / KES_USD_DEC; // currency depreciation reflected here!

        startAssetValueUSD += shares * startPriceUSD;
        endAssetValueUSD += shares * endPriceUSD;

        const divYieldRatio = asset.dividendYield2020 / 100;
        totalDividendsGrossUSD += (shares * startPriceUSD) * divYieldRatio;
      }
    });

    // Tax deductions: 30% withholding tax on US dividends
    let totalDividendsNetUSD = 0;
    SUPPORTED_ASSETS.forEach(asset => {
      const shares = holdings[asset.symbol] || 0;
      if (shares === 0) return;
      
      const divYieldRatio = asset.dividendYield2020 / 100;
      let divUSD = 0;
      if (asset.currency === 'USD') {
        divUSD = (shares * asset.startPrice2020) * divYieldRatio;
        if (withholdingTaxEnabled) {
          divUSD *= 0.70; // 30% withheld
        }
      } else {
        const startPriceUSD = asset.startPrice2020 / KES_USD_JAN;
        divUSD = (shares * startPriceUSD) * divYieldRatio;
        // Kenyan assets do not get withheld under US IRS rules
      }
      totalDividendsNetUSD += divUSD;
    });

    const initialNetWorth = 10000;
    const finalNetWorth = endAssetValueUSD + cashBalance + (withholdingTaxEnabled ? totalDividendsNetUSD : totalDividendsGrossUSD);
    const profitUSD = finalNetWorth - initialNetWorth;
    const percentageGrowth = (profitUSD / initialNetWorth) * 100;

    return {
      startAssetValueUSD,
      endAssetValueUSD,
      totalDividendsGrossUSD,
      totalDividendsNetUSD,
      finalNetWorth,
      profitUSD,
      percentageGrowth
    };
  }, [holdings, cashBalance, withholdingTaxEnabled]);

  // Monthly values for Chart plotting
  const chartData = useMemo(() => {
    return MONTH_NAMES.map((month, idx) => {
      let assetValueUSD = 0;

      SUPPORTED_ASSETS.forEach(asset => {
        const shares = holdings[asset.symbol] || 0;
        if (shares === 0) return;

        const monthlyPrices = HISTORICAL_MONTHLY_PRICES[asset.symbol];
        if (!monthlyPrices) return;

        const price = monthlyPrices[idx];
        if (asset.currency === 'USD') {
          assetValueUSD += shares * price;
        } else {
          // Adjust for monthly exchange rate interpolation
          const rate = getExchangeRateForMonth(idx);
          assetValueUSD += shares * (price / rate);
        }
      });

      // Linear monthly accrual of dividends for graphing simplicity
      const totalDividends = withholdingTaxEnabled 
        ? portfolioSummary.totalDividendsNetUSD 
        : portfolioSummary.totalDividendsGrossUSD;
      const accruedDividends = totalDividends * ((idx + 1) / 12);

      return {
        name: month,
        'Portfolio Value': parseFloat((assetValueUSD + cashBalance + accruedDividends).toFixed(2)),
        'Invested Capital': 10000
      };
    });
  }, [holdings, cashBalance, portfolioSummary, withholdingTaxEnabled]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Portfolio Dashboard & Sandbox" />

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Financial Stats & Recharts (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Final Net Worth */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Dec 31, 2020 Valuation</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 leading-none">
                ${portfolioSummary.finalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-xs font-semibold ${portfolioSummary.profitUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {portfolioSummary.profitUSD >= 0 ? '+' : ''}
                  {portfolioSummary.percentageGrowth.toFixed(2)}%
                </span>
                <span className="text-[10px] text-gray-500 font-medium">full-year yield</span>
              </div>
            </div>

            {/* Total Dividend Earned */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Cash Dividends Received</span>
              <h4 className="text-2xl font-extrabold text-emerald-400 mt-1.5 leading-none">
                ${(withholdingTaxEnabled ? portfolioSummary.totalDividendsNetUSD : portfolioSummary.totalDividendsGrossUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <div className="flex items-center gap-1.5 mt-2">
                <button 
                  onClick={() => setWithholdingTaxEnabled(!withholdingTaxEnabled)}
                  className="text-[10px] font-bold text-emerald-400/90 hover:underline uppercase tracking-wide cursor-pointer flex items-center gap-1"
                >
                  <Percent className="w-3 h-3" />
                  {withholdingTaxEnabled ? '30% Tax Applied' : 'Tax Exempt View'}
                </button>
              </div>
            </div>

            {/* Cash Remaining */}
            <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Uninvested Cash</span>
              <h4 className="text-2xl font-extrabold text-white mt-1.5 leading-none">
                ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
                <span>Available starting capital: $10k</span>
              </div>
            </div>
          </div>

          {/* Area Chart Card */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white leading-none mb-1">Portfolio Growth Chart (2020 Timeline)</h3>
                <p className="text-xs text-gray-400 font-light">Visualizing your sandbox net worth growth month-by-month.</p>
              </div>

              {/* Legend indicators */}
              <div className="flex items-center gap-3.5 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-1 rounded-full bg-emerald-500" />
                  <span>Portfolio Value</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2.5 h-1 rounded-full bg-gray-600" />
                  <span>Start Capital ($10K)</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-[280px] w-full">
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
        </div>

        {/* Right Column: Asset Trading Desk (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Buy Sandbox Assets</h3>
                <span className="text-[10px] text-gray-400 font-light block">Set up Jan 2, 2020 shares portfolio</span>
              </div>
              
              <button 
                onClick={handleReset}
                className="p-2 border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                title="Reset Portfolio"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of assets */}
            <div className="space-y-4">
              {SUPPORTED_ASSETS.map((asset) => {
                const shares = holdings[asset.symbol] || 0;
                
                // Show cost in native currency
                const startPriceNativeStr = asset.currency === 'USD' 
                  ? `$${asset.startPrice2020.toFixed(2)}` 
                  : `KSh ${asset.startPrice2020.toFixed(2)}`;

                // Show cost in USD for clarity
                const startPriceUSD = asset.currency === 'USD' 
                  ? asset.startPrice2020 
                  : asset.startPrice2020 / KES_USD_JAN;

                const valueUSD = shares * (asset.currency === 'USD' ? asset.endPrice2020 : asset.endPrice2020 / KES_USD_DEC);

                return (
                  <div key={asset.symbol} className="p-4 rounded-2xl bg-slate-900/40 border border-white/[0.03] hover:border-white/5 transition-all">
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{asset.symbol}</span>
                        <span className="text-[10px] font-medium text-gray-500 hidden sm:inline-block max-w-[120px] truncate">{asset.name}</span>
                      </div>
                      
                      <span className="text-xs font-bold text-gray-400">{startPriceNativeStr}</span>
                    </div>

                    {/* Transaction / Shares info line */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.03]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-medium">Your Shares</span>
                        <span className="text-xs font-bold text-white">{shares} shares</span>
                      </div>

                      {/* Buy controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => adjustShares(asset.symbol, -5)}
                          disabled={shares === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/5 bg-gray-900 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => adjustShares(asset.symbol, 5)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/25 active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Current value display if shares are held */}
                    {shares > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-white/[0.03] flex items-center justify-between text-[10px]">
                        <span className="text-gray-500">Dec 31 Value:</span>
                        <span className="font-semibold text-emerald-400">
                          ${valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Informational Callout */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 mt-5 text-[11px] text-gray-400 leading-normal flex gap-2">
              <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-0.5">Kenyan Exchange rates lock:</p>
                <p className="font-light">
                  KES investments converted at **{KES_USD_JAN} KSh/USD** on purchase, and evaluated at **{KES_USD_DEC} KSh/USD** on exit, simulating the Shilling depreciation in 2020.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
