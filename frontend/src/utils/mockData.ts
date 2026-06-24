export interface Asset {
  symbol: string;
  name: string;
  currency: 'USD' | 'KES';
  startPrice2020: number; // Jan 2020 Price
  endPrice2020: number;   // Dec 2020 Price
  dividendYield2020: number; // percentage, e.g., 1.8 for 1.8%
}

export const SUPPORTED_ASSETS: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', startPrice2020: 74.06, endPrice2020: 132.69, dividendYield2020: 0.65 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', currency: 'USD', startPrice2020: 160.62, endPrice2020: 222.42, dividendYield2020: 1.10 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', currency: 'USD', startPrice2020: 297.00, endPrice2020: 343.80, dividendYield2020: 1.80 },
  { symbol: 'SCOM', name: 'Safaricom PLC', currency: 'KES', startPrice2020: 31.50, endPrice2020: 34.25, dividendYield2020: 4.50 },
  { symbol: 'EQTY', name: 'Equity Group Holdings', currency: 'KES', startPrice2020: 53.50, endPrice2020: 36.50, dividendYield2020: 3.80 }
];

// Historical monthly price points for 2020 charts
export const HISTORICAL_MONTHLY_PRICES: Record<string, number[]> = {
  AAPL: [74.06, 68.34, 63.57, 73.30, 79.41, 91.20, 106.26, 129.04, 115.81, 108.86, 119.05, 132.69],
  MSFT: [160.62, 157.33, 152.11, 175.74, 183.25, 203.51, 205.01, 225.53, 210.33, 202.47, 214.07, 222.42],
  VOO: [297.00, 273.80, 241.00, 269.10, 281.80, 287.40, 303.50, 324.90, 311.20, 303.40, 336.50, 343.80],
  SCOM: [31.50, 29.80, 26.50, 28.00, 29.25, 28.50, 27.75, 30.10, 31.25, 32.50, 33.10, 34.25],
  EQTY: [53.50, 50.25, 38.50, 35.00, 36.25, 34.75, 32.00, 33.50, 34.00, 35.25, 35.75, 36.50]
};

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface Allocation {
  name: string;
  value: number;
  color: string;
}

export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

export const RISK_ALLOCATIONS: Record<RiskProfile, Allocation[]> = {
  Conservative: [
    { name: 'Kenyan Treasury Bonds (KES)', value: 65, color: '#10B981' }, // Emerald
    { name: 'Safaricom (KES)', value: 15, color: '#F59E0B' },            // Gold
    { name: 'Vanguard S&P 500 ETF (USD)', value: 15, color: '#3B82F6' }, // Blue
    { name: 'Cash', value: 5, color: '#6B7280' }                         // Gray
  ],
  Moderate: [
    { name: 'Vanguard S&P 500 ETF (USD)', value: 40, color: '#3B82F6' },
    { name: 'US Individual Equities (AAPL/MSFT)', value: 20, color: '#EC4899' }, // Pink
    { name: 'Safaricom (KES)', value: 20, color: '#F59E0B' },
    { name: 'Kenyan Treasury Bonds (KES)', value: 15, color: '#10B981' },
    { name: 'Cash', value: 5, color: '#6B7280' }
  ],
  Aggressive: [
    { name: 'US Individual Equities (AAPL/MSFT)', value: 50, color: '#EC4899' },
    { name: 'Vanguard S&P 500 ETF (USD)', value: 30, color: '#3B82F6' },
    { name: 'Kenyan Equities (SCOM/EQTY)', value: 15, color: '#F59E0B' },
    { name: 'Cash / Bonds', value: 5, color: '#6B7280' }
  ]
};

export interface MockNewsItem {
  id: number;
  title: string;
  content: string;
  date_published: string;
  source: string;
}

export const MOCK_NEWS: MockNewsItem[] = [
  {
    id: 1,
    title: 'Apple Announces 4-for-1 Stock Split to Broaden Investor Access',
    content: 'Apple Inc. (AAPL) has announced a four-for-one stock split to make the stock more accessible to a broader base of investors. The split will take effect for shareholders of record on August 24, 2020, with split-adjusted trading beginning August 31, 2020. This marks the fifth stock split in Apple history.',
    date_published: '2020-07-30',
    source: 'Bloomberg Financial'
  },
  {
    id: 2,
    title: 'Safaricom Reports Growth in M-Pesa Transactions as Cashless Policy Takes Hold',
    content: 'Safaricom PLC (SCOM) reported a significant increase in M-Pesa transaction volumes following the Central Bank of Kenya directive to waive fees on transactions under KSh 1,000. While voice revenues saw a slight decline, mobile data and digital finance services drove a 12% revenue growth during the pandemic sandbox.',
    date_published: '2020-10-15',
    source: 'Business Daily Africa'
  },
  {
    id: 3,
    title: 'Global Stock Markets Stage V-Shaped Recovery After March Crash',
    content: 'Global equities, tracked by indices like the S&P 500 (VOO), completed a remarkable recovery from the steep COVID-19 crash in March 2020. Driven by unprecedented Federal Reserve liquidity injections and tech earnings growth, markets closed at record highs in December 2020.',
    date_published: '2020-12-18',
    source: 'Reuters'
  },
  {
    id: 4,
    title: 'Equity Group Suspends Dividend Payout Over COVID-19 Capital Buffers',
    content: 'Equity Group Holdings (EQTY) board of directors announced a withdrawal of the recommended dividend payout of KSh 2.50 per share for the financial year ending Dec 2019. The bank cited the need to conserve capital reserves and create credit cushioning buffers to withstand macroeconomic disruptions caused by the pandemic.',
    date_published: '2020-05-26',
    source: 'Nairobi Securities Exchange News'
  }
];

export interface MockArticle {
  id: number;
  title: string;
  category: string;
  markdown_content: string;
}

export const MOCK_ARTICLES: MockArticle[] = [
  {
    id: 1,
    title: 'Navigating USD to KES Currency Risks for Kenyan Investors',
    category: 'Currency Risk',
    markdown_content: `### Understanding the Exchange Rate Impact
When you invest in US stocks like Apple (AAPL) or Microsoft (MSFT), you are exposed to **currency risk** (exchange rate fluctuations). 

#### Key Concepts:
1. **Asset Base Currency**: US investments are denominated in USD.
2. **Local Currency**: Your daily expenses are in Kenyan Shillings (KES).
3. **Depreciation Benefit**: If the KES depreciates against the USD, your US portfolio gains value in KES terms, even if the underlying stock price does not change!
4. **Inflation Hedge**: Historically, the USD has strengthened against the KES, offering a natural hedge against domestic inflation.

#### Kenyan Investor Practical Example:
In January 2020, 1 USD was approximately 101 KES. By December 2020, 1 USD was approximately 109 KES. This means a 10% currency gain on top of the stock's performance for any Kenyan holding USD assets during that year.`
  },
  {
    id: 2,
    title: 'US Withholding Tax Demystified for Kenyan Residents',
    category: 'Taxes',
    markdown_content: `### Double Taxation and the 30% Withholding Rule
If you are a Kenyan citizen residing in Kenya, you are subject to US tax laws when investing in US securities.

#### The W-8BEN Form:
To avoid double taxation, you must complete a **W-8BEN form** (Certificate of Foreign Status of Beneficial Owner). 

- **US Dividend Tax**: The United States imposes a **30% withholding tax** on dividend distributions paid to foreign investors by default.
- **Tax Treaties**: Kenya does not currently have an active double tax treaty (DTT) with the US that reduces this dividend rate, so you will pay the full 30% on dividends.
- **Capital Gains**: The good news is that foreign investors are **exempt from US capital gains taxes**. You only pay local taxes in Kenya on capital gains, making long-term growth investing in US index funds highly tax-efficient.`
  },
  {
    id: 3,
    title: 'Why Index Funds (like VOO) are the Foundation of Long-Term Wealth',
    category: 'Index Funds',
    markdown_content: `### The Power of Broad Diversification
An **Index Fund** is a mutual fund or ETF that tracks a specific financial market index, such as the S&P 500.

#### Vanguard S&P 500 ETF (VOO):
- Tracks the 500 largest publicly traded companies in the United States.
- Includes tech giants (Apple, Microsoft, Nvidia), healthcare, financials, and consumer services.
- **Low Expense Ratio**: VOO has an expense ratio of just 0.03%, meaning you pay only $3 per year for every $10,000 invested.
- **Historical Returns**: Historically, the S&P 500 has returned an average of 8-10% annually over long horizons.

For a Kenyan investor, buying VOO provides instant exposure to the global economy and eliminates the company-specific risk of individual stock picking.`
  }
];
