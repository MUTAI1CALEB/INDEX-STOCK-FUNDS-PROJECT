'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Shield, Clock } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [riskProfile, setRiskProfile] = useState<string>('Unassigned');
  const [cashBalance, setCashBalance] = useState<number>(10000);

  useEffect(() => {
    // Read from localStorage to coordinate dashboard state
    const savedProfile = localStorage.getItem('investiq_risk_profile');
    if (savedProfile) {
      setRiskProfile(savedProfile);
    }
    
    const savedBalance = localStorage.getItem('investiq_cash_balance');
    if (savedBalance) {
      setCashBalance(parseFloat(savedBalance));
    }

    // Set up a listener for custom event or local storage changes
    const handleStorageChange = () => {
      const p = localStorage.getItem('investiq_risk_profile');
      if (p) setRiskProfile(p);
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
        {/* Sandbox Date Lock Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/[0.05] rounded-xl px-4 py-2 text-xs text-gray-400">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Timeline: <strong>Full-Year 2020</strong></span>
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
