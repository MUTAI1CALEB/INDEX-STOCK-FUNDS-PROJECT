'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, 
  LayoutDashboard, 
  Award, 
  BookOpen, 
  Newspaper,
  Compass
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Risk Advisor', href: '/quiz', icon: Award },
    { name: 'Learning Hub', href: '/learning', icon: BookOpen },
    { name: 'Market News', href: '/news', icon: Newspaper },
  ];

  return (
    <aside className={`w-64 glass-panel border-r border-white/5 flex flex-col h-screen sticky top-0 ${className}`}>
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white leading-none">Global InvestIQ</h1>
          <span className="text-[10px] font-semibold tracking-widest text-emerald-500 uppercase mt-1 block">Live Markets</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'text-gray-400 border border-transparent hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Live Market Status Footer */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20">
        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-3 flex flex-col gap-1 text-[11px] text-emerald-400/90 leading-normal">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            LIVE MARKET FEED ACTIVE
          </div>
          <p className="text-gray-400 font-light text-[10px]">
            Connected to real-time global asset quote wrappers. Fractional orders execute instantly.
          </p>
        </div>
      </div>
    </aside>
  );
}
