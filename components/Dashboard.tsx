
import React from 'react';
import { Transaction, ExpenseCategory, IncomeCategory, Category, UserProfile, Budget } from '../types';
import { CURRENCY, TRANSLATIONS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  profile: UserProfile;
  budgets?: Budget[];
  onNavigate: (tab: any) => void;
  lang: 'en' | 'sw';
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, profile, budgets = [], onNavigate, lang }) => {
  const t = TRANSLATIONS[lang];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Financial Metrics Calculations
  const currentMonthExpenses = transactions
    .filter(tr => {
      const d = new Date(tr.date);
      return tr.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, tr) => sum + tr.amount, 0);

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthExpenses = transactions
    .filter(tr => {
      const d = new Date(tr.date);
      return tr.type === 'expense' && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    })
    .reduce((sum, tr) => sum + tr.amount, 0);

  const dailyAverage = currentMonthExpenses / currentDay;
  const projectedTotal = dailyAverage * daysInMonth;
  const percentChange = lastMonthExpenses > 0 
    ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0;

  const categoryTotals = Object.values(ExpenseCategory).map(cat => ({
    name: cat,
    value: transactions
      .filter(tr => tr.category === cat && tr.type === 'expense')
      .reduce((sum, tr) => sum + tr.amount, 0)
  })).sort((a, b) => b.value - a.value);

  const topCategory = categoryTotals[0];
  const refundPotential = currentMonthExpenses * 0.16 * 0.25;

  // Unified Budget Summary for Dashboard
  const monthlyBudgets = budgets.filter(b => b.monthlyLimit > 0).map(b => {
    const spent = transactions
      .filter(t => t.category === b.category && t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      category: b.category,
      spent,
      limit: b.monthlyLimit,
      period: 'Monthly',
      progress: Math.min(100, (spent / b.monthlyLimit) * 100)
    };
  });

  const weeklyBudgets = budgets.filter(b => b.weeklyLimit > 0).map(b => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const spent = transactions
      .filter(t => t.category === b.category && t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      category: b.category,
      spent,
      limit: b.weeklyLimit,
      period: 'Weekly',
      progress: Math.min(100, (spent / b.weeklyLimit) * 100)
    };
  });

  const budgetSummary = [...monthlyBudgets, ...weeklyBudgets]
    .sort((a, b) => b.progress - a.progress) 
    .slice(0, 3);

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-500">
      <section className="bg-[#0A0D10] text-white rounded-[40px] p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-emerald-900/50">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #065f46 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Akiba Live Terminal
              </p>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">{t.spending_total}</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${percentChange > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
              {percentChange > 0 ? '▲' : '▼'} {Math.abs(percentChange).toFixed(1)}% vs Last Month
            </div>
          </div>

          <div className="flex flex-col items-baseline mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-medium text-emerald-500/50">{CURRENCY}</span>
              <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white tabular-nums">
                {currentMonthExpenses.toLocaleString()}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-8">
            <MetricBox label="VELOCITY" value={`${CURRENCY} ${Math.round(dailyAverage).toLocaleString()}`} sub="PER DAY" />
            <MetricBox label="PROJECTION" value={`${CURRENCY} ${Math.round(projectedTotal).toLocaleString()}`} sub="BY MONTH END" trend={projectedTotal > (profile.monthlyIncome || 0) ? 'bad' : 'good'} />
            <MetricBox label="VOL" value={`${transactions.filter(t => t.type === 'expense').length}`} sub="TX COUNT" />
            <MetricBox label="KRA POS" value={`${CURRENCY} ${Math.round(refundPotential).toLocaleString()}`} sub="CLAIMABLE" variant="emerald" />
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => onNavigate('analysis')}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Advanced Stats &rarr;
            </button>
          </div>
        </div>
      </section>

      {budgetSummary.length > 0 && (
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Spending Limits</h3>
            <button onClick={() => onNavigate('analysis')} className="text-[10px] font-black text-emerald-800 uppercase tracking-widest hover:underline">Manage All &rarr;</button>
          </div>
          <div className="space-y-6">
            {budgetSummary.map((b, idx) => (
              <div key={`${b.category}-${b.period}-${idx}`} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-tight">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{b.category}</span>
                    <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{b.period}</span>
                  </div>
                  <span className={b.spent > b.limit ? 'text-red-600 font-black' : 'text-emerald-700'}>
                    {CURRENCY} {b.spent.toLocaleString()} / {b.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${b.spent > b.limit ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} 
                    style={{ width: `${b.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div 
          className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-emerald-700 hover:shadow-xl transition-all cursor-pointer" 
          onClick={() => onNavigate('coach')}
        >
          <div>
            <p className="text-gray-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-6">{t.top_spend}</p>
            {topCategory && topCategory.value > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center text-3xl sm:text-4xl shadow-inner group-hover:bg-emerald-100 transition-colors">
                   {getCategoryEmoji(topCategory.name)}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg sm:text-xl leading-tight uppercase tracking-tight">{topCategory.name}</h4>
                  <p className="text-emerald-700 font-black text-base sm:text-lg">{CURRENCY} {topCategory.value.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-gray-300 font-bold italic text-sm">Add transactions to see insights</p>
              </div>
            )}
          </div>
          <div className="mt-8 flex items-center gap-2 text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            <span>View Coach Report</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('tax')}
          className="bg-white p-8 sm:p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-red-600 hover:shadow-xl transition-all cursor-pointer"
        >
          <div>
            <p className="text-gray-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-6">{t.tax_insight}</p>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 rounded-[24px] flex items-center justify-center text-3xl sm:text-4xl shadow-inner group-hover:bg-red-100 transition-colors">
                 🇰🇪
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg sm:text-xl leading-tight uppercase tracking-tight">{t.refund_estimate}</h4>
                <p className="text-red-600 font-black text-base sm:text-lg">{CURRENCY} {refundPotential.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-[10px] sm:text-xs font-black text-red-700 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            <span>{lang === 'en' ? 'Check Refund Eligibility' : 'Angalia Pesa Zako'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>

      <section className="bg-emerald-50/50 rounded-[40px] p-8 sm:p-10 border border-emerald-100 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="text-center lg:text-left flex-1">
          <h4 className="font-black text-gray-900 text-xl sm:text-2xl leading-tight uppercase tracking-tight">{t.sync_mpesa}</h4>
          <p className="text-emerald-800 text-sm sm:text-base font-medium mt-2 max-w-lg">
            Our AI automatically identifies Till, Paybill, and P2P transactions to sort your spending in seconds.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('add')}
          className="w-full lg:w-auto bg-black text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-widest text-sm border-b-4 border-emerald-800 active:scale-95 transition-all shadow-xl hover:bg-gray-900 shrink-0"
        >
          Sync Now 📩
        </button>
      </section>

      <div className="hidden lg:block h-8"></div>
    </div>
  );
};

interface MetricBoxProps {
  label: string;
  value: string;
  sub: string;
  trend?: 'good' | 'bad';
  variant?: 'white' | 'emerald' | 'red';
}

const MetricBox: React.FC<MetricBoxProps> = ({ label, value, sub, trend, variant = 'white' }) => (
  <div className="space-y-1">
    <p className="text-[8px] font-black text-gray-500 tracking-widest uppercase">{label}</p>
    <p className={`text-sm font-black tracking-tight tabular-nums ${
      variant === 'emerald' ? 'text-emerald-400' : 
      trend === 'bad' ? 'text-red-500' : 
      'text-white'
    }`}>
      {value}
    </p>
    <p className="text-[8px] font-bold text-gray-600 tracking-widest uppercase">{sub}</p>
  </div>
);

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
