'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Header from '../../components/layout/Header';
import { fetchMarketNews, fetchQAEntries, QAEntry, NewsItem } from '../../utils/api';
import { Newspaper, HelpCircle, Calendar, User, ChevronDown, ChevronUp, Loader2, BookOpen, RefreshCw } from 'lucide-react';

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<'news' | 'qa'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [qaEntries, setQaEntries] = useState<QAEntry[]>([]);
  
  // Loading & Refreshing states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedQA, setExpandedQA] = useState<Record<number, boolean>>({});

  const loadData = useCallback(async (isSilent = false) => {
    // Only toggle loading if we're not already loading
    if (!isSilent && !loading) {
      setLoading(true);
    }
    // Only set refreshing to true if it is not the initial loading mount
    // This avoids triggering synchronous setState linter warnings in useEffect
    if (!loading) {
      setRefreshing(true);
    }
    
    try {
      if (activeTab === 'news') {
        const liveNews = await fetchMarketNews();
        setNews(liveNews);
      } else {
        const qaData = await fetchQAEntries();
        setQaEntries(qaData);
      }
    } catch (e) {
      console.error('Failed to load news page data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, loading]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [activeTab, loadData]);

  const toggleQA = (id: number) => {
    setExpandedQA(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Market News & Q&A Hub" />
      
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Information & Intel Desk</h3>
            <p className="text-sm text-gray-400">Stay updated with present-day macro market feeds and localized Kenyan guidance.</p>
          </div>

          {/* Tab selectors and Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/5 rounded-2xl p-1">
              <button
                onClick={() => setActiveTab('news')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  activeTab === 'news'
                    ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Live Market News
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  activeTab === 'qa'
                    ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Kenyan Q&A Hub
              </button>
            </div>

            <button 
              onClick={() => loadData(false)} 
              disabled={refreshing}
              className="p-2 rounded-xl border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center"
              title="Refresh Feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs text-gray-500">Retrieving feed updates...</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Live Market News Tab */}
            {activeTab === 'news' && (
              <div className="grid grid-cols-1 gap-6">
                {news.map((item, idx) => {
                  const pubDate = item.publishedDate 
                    ? new Date(item.publishedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'Recent';

                  return (
                    <article key={idx} className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                      {/* Visual Accent */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Meta details */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 ml-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{pubDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                          <span>Source: {item.site}</span>
                        </div>
                      </div>

                      {/* News Title */}
                      <h4 className="text-base font-bold text-white mb-2 ml-2 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>

                      {/* News Content */}
                      <p className="text-xs text-gray-300 leading-relaxed mb-4 ml-2 font-light">
                        {item.text}
                      </p>

                      {/* Read More button */}
                      <div className="flex items-center justify-between ml-2 pt-3 border-t border-white/5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          LIVE MACRO NEWS
                        </span>
                        {item.url && item.url !== '#' && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-gray-400 hover:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            Read Full Article &rarr;
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}

                {news.length === 0 && (
                  <div className="text-center py-12 glass-panel rounded-2xl border border-white/5 p-8">
                    <Newspaper className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h4 className="font-bold text-white mb-1">No news found</h4>
                    <p className="text-xs text-gray-400">Database could not yield any live macro updates.</p>
                  </div>
                )}
              </div>
            )}

            {/* Kenyan Q&A Hub Tab (Interactive Accordion) */}
            {activeTab === 'qa' && (
              <div className="space-y-4">
                <div className="glass-panel border border-white/5 rounded-2xl p-5 mb-6 text-xs text-gray-400 flex gap-3 bg-emerald-500/5 border-emerald-500/10">
                  <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-emerald-400 mb-0.5">Kenyan Investor Localized Advisory</h5>
                    <p className="font-light leading-relaxed">
                      Find details about US dividend withholding taxes, exchange rate hedging, Capital Gains Tax, KRA reporting requirements, and optimal brokerage options for Kenyan residents.
                    </p>
                  </div>
                </div>

                {qaEntries.map((item) => {
                  const isExpanded = !!expandedQA[item.id];
                  
                  return (
                    <div 
                      key={item.id} 
                      className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-200"
                    >
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => toggleQA(item.id)}
                        className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex-shrink-0">
                            <HelpCircle className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span>{item.question}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-5 pt-0 border-t border-white/5 bg-slate-900/20 text-xs text-gray-300 font-light leading-relaxed whitespace-pre-line">
                          {item.answer}
                          <div className="mt-4 pt-3 border-t border-dashed border-white/5 flex justify-end">
                            <span className="text-[9px] font-bold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                              Category: {item.category}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {qaEntries.length === 0 && (
                  <div className="text-center py-12 glass-panel rounded-2xl border border-white/5 p-8">
                    <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h4 className="font-bold text-white mb-1">No Q&As found</h4>
                    <p className="text-xs text-gray-400">Database could not yield any seeded localized Q&As.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
