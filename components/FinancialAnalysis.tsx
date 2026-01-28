
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Budget } from '../types';
import { CURRENCY } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
  const [editingBudget, setEditingBudget] = useState<Category | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();

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

  const COLORS = ['#10b981', '#ef4444', '#065f46', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction);
      setEditingTransaction(null);
    }
  };

  const updateBudgetLimit = (category: Category, field: 'weeklyLimit' | 'monthlyLimit', value: number) => {
    const exists = budgets.find(b => b.category === category);
    if (exists) {
      onUpdateBudgets(budgets.map(b => b.category === category ? { ...b, [field]: value } : b));
    } else {
      onUpdateBudgets([...budgets, { category, weeklyLimit: 0, monthlyLimit: 0, [field]: value }]);
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      <div className="flex bg-gray-200 p-1.5 rounded-[28px] sm:rounded-[36px] gap-1 shadow-inner max-w-md mx-auto">
        <button onClick={() => setActiveView('analysis')} className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'analysis' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Analysis</button>
        <button onClick={() => setActiveView('logs')} className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'logs' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Logs</button>
        <button onClick={() => setActiveView('budget')} className={`flex-1 py-3 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'budget' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}>Budgets</button>
      </div>

      {activeView === 'analysis' && (
        <div className="space-y-8">
          <section className="bg-[#0A0D10] text-white rounded-[40px] p-8 border border-emerald-900/50 relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">CASH FLOW</p>
                <h4 className="text-3xl font-black">{CURRENCY} {netFlow.toLocaleString()}</h4>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">BURN RATE</p>
                <h4 className="text-3xl font-black">{flowRatio.toFixed(1)}%</h4>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">INCOME</p>
                <h4 className="text-3xl font-black">{CURRENCY} {monthlyIncome.toLocaleString()}</h4>
              </div>
            </div>
          </section>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Spending Breakdown</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeView === 'logs' && (
        <div className="space-y-4">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-3xl shadow-sm outline-none" />
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            {filteredTransactions.map(t => (
              <div key={t.id} className="p-5 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {t.source === 'mpesa' ? '📩' : t.source === 'receipt' ? '📸' : '✍️'}
                  </div>
                  <div className="max-w-[120px] sm:max-w-none">
                    <p className="font-black text-xs uppercase tracking-tight truncate">{t.merchant}</p>
                    <p className="text-[10px] text-gray-400">{t.date} • {t.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {t.type === 'expense' ? '-' : '+'}{CURRENCY} {t.amount.toLocaleString()}
                  </p>
                  <button onClick={() => setEditingTransaction(t)} className="text-blue-500 hover:text-blue-700 p-2 text-lg">✏️</button>
                  <button onClick={() => { if(confirm('Delete?')) onDeleteTransaction(t.id); }} className="text-red-300 hover:text-red-600 p-2 text-lg">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'budget' && (
        <div className="space-y-6">
          <section className="bg-emerald-800 text-white rounded-[40px] p-8 shadow-xl relative overflow-hidden">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Budget Summary</h3>
             <p className="text-4xl font-black">{CURRENCY} {monthlyExpense.toLocaleString()} spent</p>
             <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">This month so far</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(Category).filter(cat => cat !== Category.SALARY && cat !== Category.FREELANCE).map(cat => {
              const budget = budgets.find(b => b.category === cat) || { category: cat, weeklyLimit: 0, monthlyLimit: 0 };
              const spentThisMonth = transactions.filter(t => t.category === cat && t.type === 'expense' && new Date(t.date).getMonth() === currentMonth).reduce((sum, t) => sum + t.amount, 0);
              const progress = budget.monthlyLimit > 0 ? (spentThisMonth / budget.monthlyLimit) * 100 : 0;

              return (
                <div key={cat} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-tight truncate mr-2">{cat}</h4>
                    <button onClick={() => setEditingBudget(cat)} className="text-[9px] font-black text-emerald-800 uppercase bg-emerald-50 px-3 py-1 rounded-full">Set Limit</button>
                  </div>
                  
                  {budget.monthlyLimit > 0 ? (
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                         <span>Spent: {spentThisMonth.toLocaleString()}</span>
                         <span>Limit: {budget.monthlyLimit.toLocaleString()}</span>
                       </div>
                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-700 ${progress > 100 ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                       </div>
                       <p className={`text-[9px] font-black uppercase text-center ${progress > 100 ? 'text-red-600' : 'text-emerald-800'}`}>
                         {progress > 100 ? `Over by ${CURRENCY} ${(spentThisMonth - budget.monthlyLimit).toLocaleString()}` : `${CURRENCY} ${(budget.monthlyLimit - spentThisMonth).toLocaleString()} left`}
                       </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-300 italic">No budget set for this category.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingBudget && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight">Set Budget: {editingBudget}</h3>
                <button onClick={() => setEditingBudget(null)} className="text-gray-400">✖</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Limit ({CURRENCY})</label>
                   <input 
                     type="number" 
                     placeholder="0"
                     value={budgets.find(b => b.category === editingBudget)?.monthlyLimit || ''}
                     onChange={(e) => updateBudgetLimit(editingBudget, 'monthlyLimit', Number(e.target.value))}
                     className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-2xl"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Limit ({CURRENCY})</label>
                   <input 
                     type="number" 
                     placeholder="0"
                     value={budgets.find(b => b.category === editingBudget)?.weeklyLimit || ''}
                     onChange={(e) => updateBudgetLimit(editingBudget, 'weeklyLimit', Number(e.target.value))}
                     className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-2xl"
                   />
                </div>
                <button onClick={() => setEditingBudget(null)} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95">Save Budget</button>
              </div>
           </div>
        </div>
      )}

      {editingTransaction && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter">Edit Entry</h3>
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
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
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
