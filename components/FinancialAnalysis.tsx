
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, ExpenseCategory, IncomeCategory, Category, Budget } from '../types';
import { CURRENCY } from '../constants';
import { GoogleGenAI } from '@google/genai';

interface FinancialAnalysisProps {
  transactions: Transaction[];
  budgets: Budget[];
  onUpdateBudgets: (budgets: Budget[]) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  lang: 'en' | 'sw';
}

const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({ transactions, budgets, onUpdateBudgets, onUpdateTransaction, onDeleteTransaction, lang }) => {
  const [activeView, setActiveView] = useState<'logs' | 'analysis' | 'budget'>('analysis');
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<ExpenseCategory | null>(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();

  // Cash Stats
  const totalIn = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const cashAtHand = totalIn - totalOut;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.merchant.toLowerCase().includes(search.toLowerCase()) || 
      t.category.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search]);

  // Generate Written Analysis
  const generateWrittenAnalysis = async () => {
    if (transactions.length === 0) {
      setWeeklyAnalysis("No transactions found yet. Start logging to get your weekly wealth narrative.");
      return;
    }

    setIsGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Get last 7 days of data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyData = transactions.filter(t => new Date(t.date) >= weekAgo);
    
    const weeklySpend = weeklyData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const weeklyIncome = weeklyData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    
    const prompt = `Act as Akiba, a smart Kenyan financial coach. Analyze these transactions for the LAST 7 DAYS and provide a detailed written report in 3 paragraphs. 
    Metrics: Weekly Spend KES ${weeklySpend}, Weekly Income KES ${weeklyIncome}. 
    Transactions: ${JSON.stringify(weeklyData.slice(0, 10))}.
    
    Instructions:
    1. Paragraph 1: Summary of the week. Mention if spending was high or low.
    2. Paragraph 2: Point out the biggest expense category and if it's justified (e.g., Food vs M-Pesa Charges).
    3. Paragraph 3: A sharp financial advice for the coming week to grow 'Cash at Hand' (currently KES ${cashAtHand}).
    Use Kenyan context (Matatus, M-Pesa, Mama Mboga, Naivas). Keep it professional but conversational.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setWeeklyAnalysis(response.text || "Analysis could not be generated at this time.");
    } catch (err) {
      setWeeklyAnalysis("Your wealth narrative is being prepared. Please check back shortly.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeView === 'analysis') {
      generateWrittenAnalysis();
    }
  }, [activeView, transactions.length]); // Regenerate when transactions change

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction);
      setEditingTransaction(null);
    }
  };

  const updateBudgetLimit = (category: ExpenseCategory, field: 'weeklyLimit' | 'monthlyLimit', value: number) => {
    const exists = budgets.find(b => b.category === category);
    if (exists) {
      onUpdateBudgets(budgets.map(b => b.category === category ? { ...b, [field]: value } : b));
    } else {
      onUpdateBudgets([...budgets, { category, weeklyLimit: 0, monthlyLimit: 0, [field]: value }]);
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="flex bg-gray-200 p-1.5 rounded-[28px] sm:rounded-[36px] gap-1 shadow-inner max-w-md mx-auto">
        <button onClick={() => setActiveView('analysis')} className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'analysis' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Weekly Report</button>
        <button onClick={() => setActiveView('logs')} className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'logs' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Tx Logs</button>
        <button onClick={() => setActiveView('budget')} className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'budget' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Budgets</button>
      </div>

      {activeView === 'analysis' && (
        <div className="space-y-8">
          <section className="bg-black text-white rounded-[40px] p-8 sm:p-10 border border-emerald-900/50 shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <div>
                   <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em]">Wealth Summary</p>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Cash Terminal</h3>
                </div>
                <div className="text-right">
                   <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">Net Assets</p>
                   <p className="text-xl font-black text-emerald-400">{CURRENCY} {cashAtHand.toLocaleString()}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-3xl">
                   <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Money In</p>
                   <p className="text-lg font-black text-white">{CURRENCY} {totalIn.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-3xl">
                   <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Money Out</p>
                   <p className="text-lg font-black text-white">{CURRENCY} {totalOut.toLocaleString()}</p>
                </div>
             </div>
          </section>

          <section className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-gray-100 min-h-[300px] relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Narrative Analysis</h3>
              {isGenerating && (
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            <div className={`prose prose-sm max-w-none text-gray-800 font-medium leading-relaxed transition-opacity duration-500 ${isGenerating ? 'opacity-40' : 'opacity-100'}`}>
              {weeklyAnalysis.split('\n').map((para, i) => (
                <p key={i} className="mb-4 text-sm sm:text-base">{para}</p>
              ))}
            </div>

            <button 
              onClick={generateWrittenAnalysis}
              className="mt-6 flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:text-emerald-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh Narrative
            </button>
          </section>
        </div>
      )}

      {activeView === 'logs' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Filter by shop or category..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="flex-1 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none font-bold text-sm" 
            />
          </div>
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
              <div key={t.id} className="p-5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {t.type === 'income' ? '💰' : '💸'}
                  </div>
                  <div className="max-w-[140px] sm:max-w-none">
                    <p className="font-black text-xs uppercase tracking-tight truncate">{t.merchant}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-black text-sm tabular-nums ${t.type === 'income' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {t.type === 'expense' ? '-' : '+'}{CURRENCY} {t.amount.toLocaleString()}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingTransaction(t)} className="p-2 text-gray-300 hover:text-blue-500">✏️</button>
                    <button onClick={() => { if(confirm('Delete permanently?')) onDeleteTransaction(t.id); }} className="p-2 text-gray-300 hover:text-red-500">🗑️</button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center">
                 <p className="text-gray-300 italic font-black uppercase text-[10px] tracking-[0.2em]">No Records Found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'budget' && (
        <div className="space-y-6">
          <section className="bg-emerald-800 text-white rounded-[40px] p-8 shadow-xl">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Monthly Outflow Control</h3>
             <p className="text-4xl font-black">{CURRENCY} {totalOut.toLocaleString()} spent</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(ExpenseCategory).map(cat => {
              const budget = budgets.find(b => b.category === cat) || { category: cat, weeklyLimit: 0, monthlyLimit: 0 };
              const spentThisMonth = transactions.filter(t => t.category === cat && t.type === 'expense' && new Date(t.date).getMonth() === currentMonth).reduce((sum, t) => sum + t.amount, 0);
              const progress = budget.monthlyLimit > 0 ? (spentThisMonth / budget.monthlyLimit) * 100 : 0;

              return (
                <div key={cat} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-tight truncate mr-2">{cat}</h4>
                    <button onClick={() => setEditingBudget(cat)} className="text-[9px] font-black text-emerald-800 uppercase bg-emerald-50 px-3 py-1 rounded-full">Adjust</button>
                  </div>
                  
                  {budget.monthlyLimit > 0 ? (
                    <div className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
                         <span>Spent: {spentThisMonth.toLocaleString()}</span>
                         <span>Limit: {budget.monthlyLimit.toLocaleString()}</span>
                       </div>
                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-700 ${progress > 100 ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                       </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-300 italic">No limit set.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingBudget && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight">Limit: {editingBudget}</h3>
                <button onClick={() => setEditingBudget(null)} className="text-gray-400">✖</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Limit ({CURRENCY})</label>
                   <input 
                     type="number" 
                     value={budgets.find(b => b.category === editingBudget)?.monthlyLimit || ''}
                     onChange={(e) => updateBudgetLimit(editingBudget, 'monthlyLimit', Number(e.target.value))}
                     className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-2xl"
                   />
                </div>
                <button onClick={() => setEditingBudget(null)} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95">Lock Limit</button>
              </div>
           </div>
        </div>
      )}

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

export default FinancialAnalysis;
