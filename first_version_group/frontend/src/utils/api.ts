import { MOCK_NEWS, MOCK_ARTICLES, MockNewsItem, MockArticle } from './mockData';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiStatus {
  connected: boolean;
  source: 'Django API' | 'Local Sandbox Fallback';
}

export async function fetchNews(): Promise<{ data: MockNewsItem[]; status: ApiStatus }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/`, {
      next: { revalidate: 60 } // cache for 60 seconds
    });
    if (!res.ok) throw new Error('API server returned error');
    
    // Django REST Framework default list returns array or { results: Array } depending on pagination
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
    
    // Map backend articles mapping backend field names if necessary
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
