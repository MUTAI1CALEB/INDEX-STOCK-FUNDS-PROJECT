import { MOCK_NEWS, MOCK_ARTICLES, MockNewsItem, MockArticle, RiskProfile } from './mockData';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiStatus {
  connected: boolean;
  source: 'Django API' | 'Local Sandbox Fallback';
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  marketCap: number;
  volume: number;
}

export interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avg_cost_basis: number;
  current_price: number;
  market_value: number;
  gain_loss: number;
  gain_loss_pct: number;
}

export interface Transaction {
  id: number;
  ticker: string;
  action: 'BUY' | 'SELL';
  quantity: number | string;
  price_per_share: number | string;
  total_cost: number | string;
  timestamp: string;
}

export interface DashboardData {
  cash_balance: number;
  total_invested: number;
  total_market_value: number;
  total_portfolio_value: number;
  total_gain_loss: number;
  total_gain_loss_pct: number;
  risk_profile: string | null;
  holdings: Holding[];
  transactions: Transaction[];
}

export interface TradeResponse {
  message: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  total_cost: number;
  new_cash_balance: number;
}

export interface DividendHolding {
  ticker: string;
  name: string;
  quantity: number;
  current_price: number;
  annual_dividend_per_share: number;
  dividend_yield: number;
  estimated_annual_income: number;
}

export interface DividendsData {
  total_annual_dividend_income: number;
  holdings: DividendHolding[];
}

export interface NewsItem {
  title: string;
  text: string;
  publishedDate: string;
  site: string;
  url: string;
  image?: string;
}

export interface QAEntry {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface QuizResponse {
  risk_profile: string;
  label: string;
  description: string;
  allocation: { name: string; value: number; color: string }[];
  suggested_tickers: string[];
}

export interface HistoricalPoint {
  date: string;
  close: number;
}

// Casing normalization utility helper
export function normalizeRiskProfile(profile: string | null | undefined): RiskProfile | 'Unassessed' {
  if (!profile) return 'Unassessed';
  const p = profile.toLowerCase();
  if (p === 'conservative') return 'Conservative';
  if (p === 'moderate') return 'Moderate';
  if (p === 'aggressive') return 'Aggressive';
  return 'Unassessed';
}

// Persist a unique session ID per browser client to track custom mock portfolios
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('investiq_session_id');
  if (!sessionId) {
    // Generate simple client-side UUID
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('investiq_session_id', sessionId);
  }
  return sessionId;
}

// Request headers builder
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Session-ID': getSessionId(),
  };
}

export async function fetchNews(): Promise<{ data: MockNewsItem[]; status: ApiStatus }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/`, {
      headers: getHeaders(),
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('API server returned error');
    
    const result = await res.json();
    const data = Array.isArray(result) ? result : (result.results || []);
    
    if (data.length === 0) {
      return { 
        data: MOCK_NEWS, 
        status: { connected: true, source: 'Local Sandbox Fallback' } 
      };
    }
    
    return {
      data,
      status: { connected: true, source: 'Django API' }
    };
  } catch (error) {
    console.warn('Backend API unreachable. Falling back to 2020 Mock News.', error);
    return {
      data: MOCK_NEWS,
      status: { connected: false, source: 'Local Sandbox Fallback' }
    };
  }
}

export async function fetchArticles(): Promise<{ data: MockArticle[]; status: ApiStatus }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/articles/`, {
      headers: getHeaders(),
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('API server returned error');
    
    const result = await res.json();
    const data = Array.isArray(result) ? result : (result.results || []);
    
    if (data.length === 0) {
      return { 
        data: MOCK_ARTICLES, 
        status: { connected: true, source: 'Local Sandbox Fallback' } 
      };
    }
    
    const mappedData = data.map((item: { id: number; title: string; category?: string; markdown_content?: string; content?: string }) => ({
      id: item.id,
      title: item.title,
      category: item.category || 'General',
      markdown_content: item.markdown_content || item.content || ''
    }));

    return {
      data: mappedData,
      status: { connected: true, source: 'Django API' }
    };
  } catch (error) {
    console.warn('Backend API unreachable. Falling back to 2020 Mock Articles.', error);
    return {
      data: MOCK_ARTICLES,
      status: { connected: false, source: 'Local Sandbox Fallback' }
    };
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${BACKEND_URL}/api/portfolio/dashboard/`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function executeTrade(ticker: string, action: 'BUY' | 'SELL', quantity: number): Promise<TradeResponse> {
  const res = await fetch(`${BACKEND_URL}/api/portfolio/trade/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ticker, action, quantity })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to execute transaction');
  }
  return data;
}

export async function fetchDividends(): Promise<DividendsData> {
  const res = await fetch(`${BACKEND_URL}/api/portfolio/dividends/`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch dividend metrics');
  return res.json();
}

export async function fetchMarketNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/market/news/`, {
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch market news');
    return res.json();
  } catch (e) {
    console.warn('Live news fetch failed. Falling back to seeded database news', e);
    const dbNews = await fetchNews();
    return dbNews.data.map(item => ({
      title: item.title,
      text: item.content,
      publishedDate: item.date_published,
      site: item.source,
      url: '#'
    }));
  }
}

export async function fetchHistoricalData(ticker: string, days: number = 90): Promise<HistoricalPoint[]> {
  const res = await fetch(`${BACKEND_URL}/api/market/historical/${ticker.toUpperCase()}/?days=${days}`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch historical data for ${ticker}`);
  return res.json();
}

export async function fetchBulkHistoricalData(tickers: string[], days: number = 90): Promise<Record<string, HistoricalPoint[]>> {
  if (tickers.length === 0) return {};
  const query = tickers.join(',');
  const res = await fetch(`${BACKEND_URL}/api/portfolio/history/?tickers=${query}&days=${days}`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch bulk historical data`);
  return res.json();
}

export async function fetchQAEntries(): Promise<QAEntry[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/qa/`, {
      headers: getHeaders(),
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('Failed to fetch Q&A entries');
    const result = await res.json();
    return Array.isArray(result) ? result : (result.results || []);
  } catch (e) {
    console.warn('Failed to fetch Q&A entries. Falling back to local hardcoded values.', e);
    return [];
  }
}

export async function submitQuiz(answers: { timeline: string; volatility_response: string; income_source: string }): Promise<QuizResponse> {
  const res = await fetch(`${BACKEND_URL}/api/onboarding/quiz/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(answers)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err) || 'Failed to submit quiz');
  }
  return res.json();
}

export async function fetchQuotes(tickers?: string): Promise<Quote[]> {
  const url = tickers ? `${BACKEND_URL}/api/market/quotes/?tickers=${tickers}` : `${BACKEND_URL}/api/market/quotes/`;
  const res = await fetch(url, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch market quotes');
  return res.json();
}
