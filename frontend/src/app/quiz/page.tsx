'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import { RISK_ALLOCATIONS, RiskProfile, Allocation } from '../../utils/mockData';
import { submitQuiz, normalizeRiskProfile } from '../../utils/api';
import { toast } from 'sonner';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Award, 
  CheckCircle2, 
  Compass, 
  ChevronRight, 
  RotateCcw 
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  field: 'timeline' | 'volatility_response' | 'income_source';
  options: { text: string; value: string }[];
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'What is your planned investment horizon?',
    field: 'timeline',
    options: [
      { text: 'Short term — less than 2 years', value: 'short' },
      { text: 'Medium term — 2 to 7 years', value: 'medium' },
      { text: 'Long term — more than 7 years', value: 'long' }
    ]
  },
  {
    id: 2,
    text: 'How would you react if your portfolio fell 20% in value due to a market drop?',
    field: 'volatility_response',
    options: [
      { text: 'Panicked: I would sell all holdings immediately to save capital', value: 'sell' },
      { text: 'Neutral: I would wait it out and wait for recovery', value: 'hold' },
      { text: 'Opportunistic: I would buy more shares at discounted prices', value: 'buy_more' }
    ]
  },
  {
    id: 3,
    text: 'What is your primary source of income or currency exposure?',
    field: 'income_source',
    options: [
      { text: 'Only Kenyan Shillings (salary/business in KSh)', value: 'salary_ksh' },
      { text: 'Mixed sources (some foreign currency or import/export exposure)', value: 'mixed' },
      { text: 'International sources (income/salary in USD or foreign currency)', value: 'international' }
    ]
  }
];

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({
    timeline: '',
    volatility_response: '',
    income_source: '',
  });

  // Initialize with deterministic default values to prevent hydration mismatch
  const [resultProfile, setResultProfile] = useState<RiskProfile>('Moderate');
  const [allocation, setAllocation] = useState<Allocation[]>([]);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Sync with localStorage after mount to prevent SSR hydration errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('investiq_risk_profile');
      if (saved) {
        const norm = normalizeRiskProfile(saved);
        if (norm !== 'Unassessed') {
          setResultProfile(norm);
          setAllocation(RISK_ALLOCATIONS[norm] || []);
          setQuizFinished(true);
        }
      }
    }
  }, []);

  const handleNext = async () => {
    if (selectedOption === null) return;
    
    const currentField = QUIZ_QUESTIONS[currentQuestion].field;
    const nextAnswers = { ...answers, [currentField]: selectedOption };
    setAnswers(nextAnswers);
    
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      try {
        const res = await submitQuiz(nextAnswers);
        const capitalizedProfile = normalizeRiskProfile(res.label);
        
        if (capitalizedProfile !== 'Unassessed') {
          setResultProfile(capitalizedProfile);
          setAllocation(res.allocation);
          setQuizFinished(true);
          
          // Save normalized profile
          localStorage.setItem('investiq_risk_profile', capitalizedProfile);
          // Dispatch custom event to notify Header
          window.dispatchEvent(new Event('storage_updated'));
        }
      } catch (error) {
        console.error('Failed to submit quiz:', error);
        toast.error('Failed to submit quiz responses to the backend. Please try again.');
      }
    }
  };

  const handleReset = () => {
    localStorage.removeItem('investiq_risk_profile');
    window.dispatchEvent(new Event('storage_updated'));
    
    setCurrentQuestion(0);
    setSelectedOption(null);
    setQuizFinished(false);
    // Fixed: Removed the undefined setTotalScore(0) call which caused runtime crashes
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Risk Advisor Profile" />
      
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        {!quizFinished ? (
          /* Quiz Interface Card */
          <div className="glass-panel border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient Background blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
            
            {/* Progress bar */}
            <div className="w-full bg-slate-900 h-1.5 rounded-full mb-8 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Question Counter */}
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 block">
              Step {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </span>

            {/* Question Text */}
            <h3 className="text-xl font-bold text-white mb-6">
              {QUIZ_QUESTIONS[currentQuestion].text}
            </h3>

            {/* Options List */}
            <div className="space-y-3.5 mb-8">
              {QUIZ_QUESTIONS[currentQuestion].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedOption(opt.value)}
                  className={`w-full text-left p-4 rounded-2xl text-sm transition-all border ${
                    selectedOption === opt.value
                      ? 'bg-emerald-500/10 border-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/5'
                      : 'bg-slate-900/60 border-white/[0.04] text-gray-300 hover:text-white hover:border-white/10 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedOption === opt.value 
                        ? 'border-emerald-500 bg-emerald-500 text-slate-900' 
                        : 'border-gray-500'
                    }`}>
                      {selectedOption === opt.value && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <span>{opt.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Button */}
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-gray-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Result Interface Card */
          <div className="glass-panel border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Risk Profile: {resultProfile}</h3>
                  <p className="text-xs text-gray-400">Based on your sandbox preferences, here is your recommended asset allocation model.</p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="px-4 py-2 border border-white/5 bg-gray-900/60 hover:bg-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            </div>

            {/* Split layout: recommended chart vs description */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Pie Chart container */}
              <div className="md:col-span-6 h-[250px] w-full relative flex items-center justify-center">
                {/* Responsive chart wrapper */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#0F172A', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        color: '#FFF' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Inside circle text */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Profile</span>
                  <span className="text-base font-extrabold text-white mt-1 leading-none">{resultProfile}</span>
                </div>
              </div>

              {/* Allocation values table/labels */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Recommended Allocation Weights:</h4>
                <div className="space-y-2.5">
                  {allocation.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-300 font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>

                {/* Educational callout */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 text-xs text-emerald-400 leading-normal flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="font-light">
                    This allocation serves as a baseline model for listed assets. For investments in US index funds, be sure to complete a **W-8BEN form** to avoid double withholding taxes. Read more in the **Learning Hub**.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
