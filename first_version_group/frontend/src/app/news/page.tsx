'use client';

import React, { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { fetchNews, ApiStatus } from '../../utils/api';
import { MockNewsItem } from '../../utils/mockData';
import { Newspaper, Rss, Calendar, User, RefreshCw } from 'lucide-react';

export default function NewsPage() {
  const [news, setNews] = useState<MockNewsItem[]>([]);
  const [status, setStatus] = useState<ApiStatus>({ connected: false, source: 'Local Sandbox Fallback' });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadNews = async () => {
    setRefreshing(true);
    const result = await fetchNews();
    setNews(result.data);
    setStatus(result.status);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Market News & AGMs" />
      
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Header section with connection state */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Corporate Updates & Publications</h3>
            <p className="text-sm text-gray-400">Track key 2020 announcements and shareholder meeting summaries for listed assets.</p>
          </div>
          
          {/* Status Badge & Refresh */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-xs ${
              status.connected 
                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span>Database: <strong>{status.source}</strong></span>
            </div>
            
            <button 
              onClick={loadNews} 
              disabled={refreshing}
              className="p-2 rounded-xl border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {news.map((item) => (
              <article key={item.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                
                {/* Meta details */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 ml-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{item.date_published}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span>Source: {item.source}</span>
                  </div>
                </div>

                {/* News Title */}
                <h4 className="text-lg font-bold text-white mb-3 ml-2 group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h4>

                {/* News Content */}
                <p className="text-sm text-gray-300 leading-relaxed mb-4 ml-2">
                  {item.content}
                </p>

                {/* Tags or interactive elements */}
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    2020 SEC FILING
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/5">
                    MARKET IMPACT
                  </span>
                </div>
              </article>
            ))}
            
            {news.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-2xl border border-white/5 p-8">
                <Newspaper className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h4 className="font-bold text-white mb-1">No news found</h4>
                <p className="text-xs text-gray-400">Database could not yield any sandbox updates.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
