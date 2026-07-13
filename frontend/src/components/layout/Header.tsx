'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Shield, Globe } from 'lucide-react';
import { normalizeRiskProfile } from '../../utils/api';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  // Initialize with deterministic default values to prevent hydration mismatch
  const [riskProfile, setRiskProfile] = useState<string>('Unassessed');
  const [cashBalance, setCashBalance] = useState<number>(10000);

  useEffect(() => {
    // Read from localStorage strictly on the client side after mount
    const localP = localStorage.getItem('investiq_risk_profile');
    if (localP) setRiskProfile(normalizeRiskProfile(localP));
    const localB = localStorage.getItem('investiq_cash_balance');
    if (localB) setCashBalance(parseFloat(localB));

    const checkBackendSync = async () => {
      const p = localStorage.getItem('investiq_risk_profile');
      const b = localStorage.getItem('investiq_cash_balance');
      
      // If we don't have local values, fetch them from backend
      if (!p || !b) {
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          let sessionId = localStorage.getItem('investiq_session_id');
          if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('investiq_session_id', sessionId);
          }
          
          const res = await fetch(`${BACKEND_URL}/api/portfolio/dashboard/`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Session-ID': sessionId,
            }
          });
          if (res.ok) {
            const data = await res.json();
            const normalizedP = normalizeRiskProfile(data.risk_profile);
            setCashBalance(data.cash_balance);
            setRiskProfile(normalizedP);
            localStorage.setItem('investiq_cash_balance', data.cash_balance.toString());
            localStorage.setItem('investiq_risk_profile', normalizedP);
          }
        } catch (err) {
          console.warn('Failed to sync header values from backend', err);
        }
      }
    };

    checkBackendSync();

    // Set up a listener for custom event or local storage changes
    const handleStorageChange = () => {
      const p = localStorage.getItem('investiq_risk_profile');
      if (p) setRiskProfile(normalizeRiskProfile(p));
      const b = localStorage.getItem('investiq_cash_balance');
      if (b) setCashBalance(parseFloat(b));
    };

    window.addEventListener('storage_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <header className="h-20 border-b border-white/5 bg-gray-950/20 backdrop-blur-md px-8 flex items-center justify-between z-10 sticky top-0">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      {/* Financial Status Summary Widgets */}
      <div className="flex items-center gap-4">
        {/* Live Market Data Feed Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-emerald-400">
          <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Data Feed: <strong>Live Markets</strong></span>
        </div>

        {/* Risk Profile Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-gray-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Risk: <strong className="text-white">{riskProfile}</strong></span>
        </div>

        {/* Cash Balance Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-gray-400">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Cash Left: <strong className="text-emerald-400">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
        </div>
      </div>
    </header>
  );
}
