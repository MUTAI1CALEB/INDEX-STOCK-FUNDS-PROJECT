import { MOCK_NEWS, MOCK_ARTICLES, MockNewsItem, MockArticle } from './mockData';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiStatus {
  connected: boolean;
  source: 'Django API' | 'Local Sandbox Fallback';
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
    
    const mappedData = data.map((item: any) => ({
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

export async function fetchDashboard(): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/api/portfolio/dashboard/`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function executeTrade(ticker: string, action: 'BUY' | 'SELL', quantity: number): Promise<any> {
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

export async function fetchDividends(): Promise<any> {
  const res = await fetch(`${BACKEND_URL}/api/portfolio/dividends/`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch dividend metrics');
  return res.json();
}

export async function fetchMarketNews(): Promise<any[]> {
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

export async function fetchHistoricalData(ticker: string, days: number = 90): Promise<any[]> {
  const res = await fetch(`${BACKEND_URL}/api/market/historical/${ticker.toUpperCase()}/?days=${days}`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to fetch historical data for ${ticker}`);
  return res.json();
}

export async function fetchQAEntries(): Promise<any[]> {
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

export async function submitQuiz(answers: { timeline: string; volatility_response: string; income_source: string }): Promise<any> {
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

export async function fetchQuotes(): Promise<any[]> {
  const res = await fetch(`${BACKEND_URL}/api/market/quotes/`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch market quotes');
  return res.json();
}
