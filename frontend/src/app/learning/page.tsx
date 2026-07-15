'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Header from '../../components/layout/Header';
import { fetchArticles, ApiStatus } from '../../utils/api';
import { MockArticle } from '../../utils/mockData';
import { ChevronRight, X, Sparkles, RefreshCw } from 'lucide-react';

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-emerald-300">{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default function LearningPage() {
  const [articles, setArticles] = useState<MockArticle[]>([]);
  const [status, setStatus] = useState<ApiStatus>({ connected: false, source: 'Local Sandbox Fallback' });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeArticle, setActiveArticle] = useState<MockArticle | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadArticles = useCallback(async () => {
    // Only set refreshing to true if we are not doing the initial page load
    // This avoids triggering synchronous setState linter warnings inside the mount useEffect
    if (!loading) {
      setRefreshing(true);
    }
    
    try {
      const result = await fetchArticles();
      setArticles(result.data);
      setStatus(result.status);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadArticles();
  }, [loadArticles]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Learning Hub" />
      
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Top Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Knowledge Academy for Kenyan Investors</h3>
            <p className="text-sm text-gray-400">Master double taxation, index funds, and hedging currency conversion volatility.</p>
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
              onClick={loadArticles} 
              disabled={refreshing}
              className="p-2 rounded-xl border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div 
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                {/* Glow Backdrop */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-300" />
                
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-4 inline-block">
                    {article.category}
                  </span>
                  <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">
                    {article.markdown_content.replace(/[#*`\-]/g, '').trim()}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Read Article</span>
                  </div>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expanded Article Modal */}
        {activeArticle && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-panel border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-1.5 inline-block">
                    {activeArticle.category}
                  </span>
                  <h3 className="text-xl font-bold text-white">{activeArticle.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveArticle(null)}
                  className="p-1.5 rounded-xl border border-white/5 bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable Article content) */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 prose prose-invert text-gray-300 text-sm leading-relaxed max-w-none">
                {activeArticle.markdown_content.split('\n').map((line, idx) => {
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-bold text-white mt-6 mb-3 first:mt-0">{renderBoldText(line.replace('### ', ''))}</h3>;
                  }
                  if (line.startsWith('#### ')) {
                    return <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2">{renderBoldText(line.replace('#### ', ''))}</h4>;
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={idx} className="ml-4 list-disc mb-1.5">{renderBoldText(line.substring(2))}</li>;
                  }
                  if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
                    return <li key={idx} className="ml-4 list-decimal mb-1.5">{renderBoldText(line.substring(3))}</li>;
                  }
                  if (line.trim() === '') {
                    return <div key={idx} className="h-2" />;
                  }
                  return <p key={idx} className="mb-3 font-light">{renderBoldText(line)}</p>;
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-900/60 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl active:scale-[0.98] transition-all"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
