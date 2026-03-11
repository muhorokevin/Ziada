
import React, { useState } from 'react';
import { Transaction, ExpenseCategory, IncomeCategory, Category, UserProfile, Budget, FinancialHealth } from '../types';
import { CURRENCY, TRANSLATIONS } from '../constants';
import { analyzeFinancialHealth } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
  profile: UserProfile;
  budgets?: Budget[];
  onNavigate: (tab: any) => void;
  lang: 'en' | 'sw';
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  profile, 
  budgets = [], 
  onNavigate, 
  lang, 
  onUpdateProfile,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const t = TRANSLATIONS[lang];
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Financial Metrics
  const totalIn = transactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + tr.amount, 0);
  const totalOut = transactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + tr.amount, 0);
  const cashAtHand = totalIn - totalOut;

  const currentMonthExpenses = transactions
    .filter(tr => {
      const d = new Date(tr.date);
      return tr.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tr) => sum + tr.amount, 0);

  const totalInvested = (profile.investments || []).reduce((sum, inv) => sum + inv.balance, 0);
  const totalChama = (profile.chamas || []).reduce((sum, c) => sum + c.totalContributed, 0);

  const handleAnalyzeHealth = async () => {
    setIsAnalyzing(true);
    try {
      const health = await analyzeFinancialHealth(transactions, profile);
      onUpdateProfile({ ...profile, health: { ...health, lastAnalyzed: new Date().toISOString() } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction);
      setEditingTransaction(null);
    }
  };

  const categoryTotals = Object.values(ExpenseCategory).map(cat => ({
    name: cat,
    value: transactions
      .filter(tr => tr.category === cat && tr.type === 'expense' && new Date(tr.date).getMonth() === currentMonth)
      .reduce((sum, tr) => sum + tr.amount, 0)
  })).sort((a, b) => b.value - a.value);

  const topCategory = categoryTotals[0];
  const refundPotential = currentMonthExpenses * 0.16 * 0.25;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in">
      {/* MAIN WALLET */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Available Cash</p>
            <h1 className="text-5xl font-black tracking-tighter text-gray-900 tabular-nums">
              {CURRENCY} {cashAtHand.toLocaleString()}
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onNavigate('add')}
              className="bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
            >
              Add Money
            </button>
            <button 
              onClick={() => onNavigate('add')}
              className="bg-black text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
            >
              Log Expense
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-gray-50">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Investments</p>
            <p className="font-black text-emerald-700">{CURRENCY} {totalInvested.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Chama Savings</p>
            <p className="font-black text-emerald-700">{CURRENCY} {totalChama.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Monthly In</p>
            <p className="font-black text-gray-900">{CURRENCY} {totalIn.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Monthly Out</p>
            <p className="font-black text-gray-900">{CURRENCY} {totalOut.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* FINANCIAL HEALTH SCORE */}
      <section className="bg-[#0A0D10] text-white rounded-[40px] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <circle 
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={364.4} 
                strokeDashoffset={364.4 - (364.4 * (profile.health?.score || 0)) / 100} 
                className="text-emerald-500 transition-all duration-1000" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{profile.health?.score || '--'}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Score</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">AI Financial Health</h3>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {profile.health?.summary || "Analyze your spending to get a personalized health score and recommendations."}
              </p>
            </div>
            <button 
              onClick={handleAnalyzeHealth}
              disabled={isAnalyzing}
              className="bg-emerald-500 text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh Health Score'}
            </button>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'investments', label: 'Investments', icon: '📈', color: 'bg-emerald-50' },
          { id: 'chamas', label: 'Chamas', icon: '🛖', color: 'bg-amber-50' },
          { id: 'tax', label: 'KRA Tax', icon: '🇰🇪', color: 'bg-red-50' },
          { id: 'goals', label: 'Goals', icon: '🎯', color: 'bg-blue-50' }
        ].map(action => (
          <button 
            key={action.id}
            onClick={() => onNavigate(action.id)}
            className={`${action.color} p-6 rounded-[32px] flex flex-col items-center justify-center gap-3 border border-transparent hover:border-gray-200 transition-all active:scale-95`}
          >
            <span className="text-3xl">{action.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{action.label}</span>
          </button>
        ))}
      </div>

      {/* TOP SPENDING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Top Spending (Month)</p>
          {topCategory && topCategory.value > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center text-3xl">
                 {getCategoryEmoji(topCategory.name)}
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{topCategory.name}</h4>
                <p className="text-emerald-700 font-black text-lg">{CURRENCY} {topCategory.value.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 italic text-sm">No spending data yet.</p>
          )}
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Recommendations</p>
          <div className="space-y-3">
            {(profile.health?.recommendations || ["Start tracking your expenses to get AI-powered tips."]).slice(0, 2).map((rec, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">✓</div>
                <p className="text-xs font-medium text-gray-600 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* RECENT TRANSACTIONS */}
      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Recent Transactions</p>
          <button onClick={() => onNavigate('analysis')} className="text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {transactions.slice(0, 5).length > 0 ? transactions.slice(0, 5).map(tr => (
            <div key={tr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-200 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${tr.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {getCategoryEmoji(tr.category)}
                </div>
                <div>
                  <p className="font-black text-xs uppercase tracking-tight text-gray-900">{tr.merchant}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(tr.date).toLocaleDateString()} • {tr.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-black text-sm tabular-nums ${tr.type === 'income' ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {tr.type === 'expense' ? '-' : '+'}{CURRENCY} {tr.amount.toLocaleString()}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setEditingTransaction(tr)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors">✏️</button>
                  <button onClick={() => { if(confirm('Delete permanently?')) onDeleteTransaction(tr.id); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-300 italic text-sm text-center py-4">No transactions logged yet.</p>
          )}
        </div>
      </section>

      {/* EDIT MODAL */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter">Modify Log</h3>
              <button onClick={() => setEditingTransaction(null)} className="text-gray-400">✖</button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Merchant</label>
                <input type="text" value={editingTransaction.merchant} onChange={e => setEditingTransaction({...editingTransaction, merchant: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount</label>
                <input type="number" value={editingTransaction.amount} onChange={e => setEditingTransaction({...editingTransaction, amount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
                <select value={editingTransaction.category} onChange={e => setEditingTransaction({...editingTransaction, category: e.target.value as Category})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold">
                  {editingTransaction.type === 'expense' 
                    ? Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)
                    : Object.values(IncomeCategory).map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
              <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all mt-4">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const getCategoryEmoji = (cat: Category) => {
  const map: Record<string, string> = {
    [ExpenseCategory.FOOD]: '🍲', [ExpenseCategory.TRANSPORT]: '🚕', [ExpenseCategory.RENT]: '🏠',
    [ExpenseCategory.UTILITIES]: '⚡', [ExpenseCategory.BUSINESS]: '💼', [ExpenseCategory.MEDICAL]: '🏥',
    [ExpenseCategory.EDUCATION]: '📚', [ExpenseCategory.CHURCH]: '⛪', [ExpenseCategory.PERSONAL]: '🛍️',
    [ExpenseCategory.INTERNET]: '📶', [ExpenseCategory.FAMILY]: '👨‍👩‍👧', [ExpenseCategory.SHOPPING]: '🛒',
    [ExpenseCategory.INVESTMENTS]: '📈', [ExpenseCategory.LOANS]: '📉', [ExpenseCategory.CHAMA]: '🛖',
    [ExpenseCategory.ENTERTAINMENT]: '🎬', [ExpenseCategory.MPESA_CHARGES]: '💸', [ExpenseCategory.OTHER]: '📦',
    [IncomeCategory.SALARY]: '💰', [IncomeCategory.FREELANCE]: '💻', [IncomeCategory.BUSINESS_REVENUE]: '🏪',
    [IncomeCategory.GIFT]: '🎁', [IncomeCategory.RENTAL_INCOME]: '🏢', [IncomeCategory.INTEREST]: '🏦',
    [IncomeCategory.OTHER]: '📥'
  };
  return map[cat] || '📦';
};

export default Dashboard;
