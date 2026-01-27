
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Budget } from '../types';
import { CURRENCY } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface FinancialAnalysisProps {
  transactions: Transaction[];
  budgets: Budget[];
  onUpdateBudgets: (budgets: Budget[]) => void;
  lang: 'en' | 'sw';
}

const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({ transactions, budgets, onUpdateBudgets, lang }) => {
  const [activeView, setActiveView] = useState<'logs' | 'analysis' | 'budget'>('analysis');
  const [budgetPeriod, setBudgetPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [search, setSearch] = useState('');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Financial Metrics
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = monthlyIncome - monthlyExpense;
  const flowRatio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.merchant.toLowerCase().includes(search.toLowerCase()) || 
      t.category.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth).forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions, currentMonth]);

  const weeklySpendingData = useMemo(() => {
    const data: Record<string, number> = {};
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    transactions.filter(t => t.type === 'expense' && new Date(t.date) > oneWeekAgo).forEach(t => {
      const day = new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' });
      data[day] = (data[day] || 0) + t.amount;
    });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({ day, amount: data[day] || 0 }));
  }, [transactions]);

  const COLORS = ['#10b981', '#ef4444', '#065f46', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

  const handleSetBudget = (cat: Category, limit: number, period: 'weekly' | 'monthly') => {
    const existingIndex = budgets.findIndex(b => b.category === cat);
    if (existingIndex > -1) {
      const newBudgets = [...budgets];
      if (period === 'weekly') newBudgets[existingIndex].weeklyLimit = limit;
      else newBudgets[existingIndex].monthlyLimit = limit;
      onUpdateBudgets(newBudgets);
    } else {
      onUpdateBudgets([...budgets, { 
        category: cat, 
        weeklyLimit: period === 'weekly' ? limit : 0,
        monthlyLimit: period === 'monthly' ? limit : 0
      }]);
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {/* View Switcher */}
      <div className="flex bg-gray-200 p-1.5 rounded-[28px] sm:rounded-[36px] gap-1 shadow-inner max-w-md mx-auto">
        <button 
          onClick={() => setActiveView('analysis')}
          className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'analysis' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
        >
          Analysis
        </button>
        <button 
          onClick={() => setActiveView('logs')}
          className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'logs' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
        >
          Logs
        </button>
        <button 
          onClick={() => setActiveView('budget')}
          className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'budget' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
        >
          Budgets
        </button>
      </div>

      {activeView === 'analysis' && (
        <div className="space-y-8">
          {/* Terminal Style Summary */}
          <section className="bg-[#0A0D10] text-white rounded-[40px] p-8 border border-emerald-900/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #065f46 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">CASH FLOW STATUS</p>
                <h4 className="text-3xl font-black tabular-nums">{CURRENCY} {netFlow.toLocaleString()}</h4>
                <div className="flex items-center gap-2">
                   <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${netFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(netFlow)/10000 * 100)}%` }}></div>
                   </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">{netFlow >= 0 ? 'Surplus Position' : 'Deficit Detected'}</p>
              </div>

              <div className="space-y-2">
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">BURN RATE (MONTHLY)</p>
                <h4 className="text-3xl font-black tabular-nums">{flowRatio.toFixed(1)}%</h4>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-1000 ${flowRatio < 70 ? 'bg-emerald-500' : flowRatio < 95 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, flowRatio)}%` }}></div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Expense to Income ratio</p>
              </div>

              <div className="space-y-2">
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">INCOME STRENGTH</p>
                <h4 className="text-3xl font-black tabular-nums">{CURRENCY} {monthlyIncome.toLocaleString()}</h4>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Current Month Inflows</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 sm:p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Spending Breakdown</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${CURRENCY} ${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Last 7 Days Velocity</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySpendingData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="amount" fill="#065f46" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'logs' && (
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by merchant or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-3xl shadow-sm focus:ring-2 focus:ring-emerald-700 outline-none"
            />
            <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, idx) => (
                  <div key={t.id} className={`p-5 flex items-center justify-between border-b border-gray-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {t.source === 'mpesa' ? '📩' : t.source === 'receipt' ? '📸' : '✍️'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-black text-gray-900 truncate uppercase text-xs tracking-tight">{t.merchant}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{t.date} • {t.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {t.type === 'expense' ? '-' : '+'}{CURRENCY} {t.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-300">No transactions found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'budget' && (
        <div className="space-y-6">
          <div className="bg-emerald-800 text-white rounded-[40px] p-8 shadow-xl border-b-4 border-red-600">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-2">Wealth Discipline</h3>
                <p className="text-lg font-bold">Manage your {budgetPeriod} spending limits.</p>
              </div>
              <div className="bg-black/20 p-1 rounded-xl flex">
                <button 
                  onClick={() => setBudgetPeriod('weekly')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${budgetPeriod === 'weekly' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setBudgetPeriod('monthly')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${budgetPeriod === 'monthly' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(Category).map(cat => {
              const budget = budgets.find(b => b.category === cat);
              const limit = budgetPeriod === 'weekly' ? (budget?.weeklyLimit || 0) : (budget?.monthlyLimit || 0);
              
              const startDate = new Date();
              if (budgetPeriod === 'weekly') startDate.setDate(startDate.getDate() - 7);
              else startDate.setDate(1); // Start of month

              const spentInPeriod = transactions
                .filter(t => t.category === cat && t.type === 'expense' && new Date(t.date) >= startDate)
                .reduce((sum, t) => sum + t.amount, 0);
              
              const progress = limit > 0 ? Math.min(100, (spentInPeriod / limit) * 100) : 0;

              return (
                <div key={cat} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4 transition-all hover:border-emerald-700">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-gray-900 text-xs uppercase tracking-tight">{cat}</h4>
                    <span className="text-[10px] font-black text-gray-400 capitalize">{budgetPeriod}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative w-full">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">{CURRENCY}</span>
                      <input 
                        type="number" 
                        placeholder="Set limit"
                        value={limit || ''}
                        onChange={(e) => handleSetBudget(cat, Number(e.target.value), budgetPeriod)}
                        className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 text-sm font-bold"
                      />
                    </div>
                  </div>

                  {limit > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className={spentInPeriod > limit ? 'text-red-600 font-black' : 'text-emerald-700'}>
                          Spent: {CURRENCY} {spentInPeriod.toLocaleString()}
                        </span>
                        <span className="text-gray-400">Target: {CURRENCY} {limit.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${spentInPeriod > limit ? 'bg-red-600' : 'bg-emerald-600'}`} 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAnalysis;
