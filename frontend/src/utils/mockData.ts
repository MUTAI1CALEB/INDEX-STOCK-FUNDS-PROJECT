export interface Asset {
  symbol: string;
  name: string;
  currency: 'USD' | 'KES';
  startPrice2020: number; // Jan 2020 Price
  endPrice2020: number;   // Dec 2020 Price
  dividendYield2020: number; // percentage, e.g., 1.8 for 1.8%
}

export const SUPPORTED_ASSETS: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', startPrice2020: 195.89, endPrice2020: 195.89, dividendYield2020: 0.49 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', currency: 'USD', startPrice2020: 430.16, endPrice2020: 430.16, dividendYield2020: 0.70 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', currency: 'USD', startPrice2020: 176.42, endPrice2020: 176.42, dividendYield2020: 0.45 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', currency: 'USD', startPrice2020: 187.34, endPrice2020: 187.34, dividendYield2020: 0.00 },
  { symbol: 'TSLA', name: 'Tesla Inc.', currency: 'USD', startPrice2020: 248.52, endPrice2020: 248.52, dividendYield2020: 0.00 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', currency: 'USD', startPrice2020: 502.18, endPrice2020: 502.18, dividendYield2020: 1.33 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', currency: 'USD', startPrice2020: 545.30, endPrice2020: 545.30, dividendYield2020: 1.25 },
  { symbol: 'V', name: 'Visa Inc.', currency: 'USD', startPrice2020: 278.65, endPrice2020: 278.65, dividendYield2020: 0.75 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', currency: 'USD', startPrice2020: 196.82, endPrice2020: 196.82, dividendYield2020: 2.34 },
  { symbol: 'KO', name: 'The Coca-Cola Company', currency: 'USD', startPrice2020: 63.45, endPrice2020: 63.45, dividendYield2020: 3.06 }
];

// Historical monthly price points (simplified placeholder)
export const HISTORICAL_MONTHLY_PRICES: Record<string, number[]> = {
  AAPL: [195.89, 195.89, 195.89],
  MSFT: [430.16, 430.16, 430.16]
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
    { name: 'Bonds & Fixed Income', value: 50, color: '#3b82f6' },
    { name: 'Blue-Chip Stocks', value: 25, color: '#6366f1' },
    { name: 'Index Funds (VOO/SPY)', value: 15, color: '#8b5cf6' },
    { name: 'Cash Reserve', value: 10, color: '#a78bfa' }
  ],
  Moderate: [
    { name: 'Growth Stocks', value: 35, color: '#3b82f6' },
    { name: 'Index Funds (VOO/SPY)', value: 30, color: '#6366f1' },
    { name: 'Blue-Chip Dividend', value: 25, color: '#8b5cf6' },
    { name: 'Cash Reserve', value: 10, color: '#a78bfa' }
  ],
  Aggressive: [
    { name: 'High-Growth Tech', value: 45, color: '#3b82f6' },
    { name: 'Growth Stocks', value: 30, color: '#6366f1' },
    { name: 'Index Funds (SPY)', value: 20, color: '#8b5cf6' },
    { name: 'Cash Reserve', value: 5, color: '#a78bfa' }
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
  },
  {
    id: 4,
    title: 'Understanding Prospectuses and Term Sheets',
    category: 'Investing Basics',
    markdown_content: `### What is a Prospectus?
A **prospectus** is a formal legal document required by and filed with the Securities and Exchange Commission (SEC) that provides details about an investment offering for sale to the public.

#### How to read a Prospectus:
1. **Investment Objective**: Understand what the fund or company aims to achieve (e.g., growth vs. income).
2. **Fees and Expenses**: Look closely at the expense ratio and any hidden fees. This directly impacts your returns.
3. **Risks**: Read the "Principal Risks" section to know exactly what could go wrong.
4. **Historical Performance**: Past performance isn't a guarantee of future returns, but it provides context.
5. **Management**: Who is running the fund and what is their track record?

### What is a Term Sheet?
A **term sheet** is a non-binding agreement setting forth the basic terms and conditions under which an investment will be made. It serves as a template to develop more detailed legal documents.

#### Key elements of a Term Sheet:
- **Valuation**: How much the company is worth prior to the investment.
- **Investment Amount**: How much money is being raised.
- **Voting Rights**: How much say investors have in company decisions.
- **Liquidation Preference**: Who gets paid first if the company is sold or goes bankrupt.`
  }
];
