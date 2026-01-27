
import React, { useMemo } from 'react';
import { Transaction, Category, UserProfile } from '../types';
import { KENYA_TAX_BANDS, CURRENCY, TRANSLATIONS } from '../constants';

interface TaxEngineProps {
  transactions: Transaction[];
  profile: UserProfile;
  lang: 'en' | 'sw';
  onNavigate: (tab: any) => void;
}

const TaxEngine: React.FC<TaxEngineProps> = ({ transactions, profile, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(tr => tr.type === 'income')
      .reduce((sum, tr) => sum + tr.amount, 0) || (profile.monthlyIncome * 12);

    const deductibleExpenses = transactions
      .filter(tr => tr.isBusiness || tr.category === Category.BUSINESS)
      .reduce((sum, tr) => sum + tr.amount, 0);

    const estimatedTaxPaid = totalIncome * 0.18; // Mock assumption of PAYE
    const estimatedRefund = deductibleExpenses * 0.16;

    return {
      estimatedTaxPaid,
      estimatedRefund,
      score: transactions.length > 3 ? 85 : 40
    };
  }, [transactions, profile]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* 1. Friendly Summary Hero */}
      <div className="bg-red-600 text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
        <div className="relative z-10">
          <p className="text-red-100 text-[10px] font-black uppercase tracking-widest mb-4">
            {lang === 'en' ? 'You may have paid more tax than needed' : 'Huenda ulilipa kodi zaidi kuliko inavyohitajika'}
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-8">
            {stats.estimatedRefund > 0 ? `+${CURRENCY} ${stats.estimatedRefund.toLocaleString()}` : 'Scan Receipts'}
          </h2>
          <div className="bg-black/20 p-6 rounded-3xl backdrop-blur-sm border border-white/10 max-w-sm mx-auto">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-red-100">Audit Confidence</span>
               <span className="text-lg font-black">{stats.score}%</span>
             </div>
             <div className="w-full h-2 bg-red-900/50 rounded-full overflow-hidden">
               <div style={{ width: `${stats.score}%` }} className="h-full bg-white rounded-full"></div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-2 h-full bg-black opacity-20"></div>
      </div>

      {/* 2. Simplified Paid vs Due */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">{t.paid_tax}</p>
          <p className="text-2xl font-black text-gray-900">{CURRENCY} {stats.estimatedTaxPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">{t.due_tax}</p>
          <p className="text-2xl font-black text-emerald-700">
            {stats.estimatedRefund > 0 ? `Refundable` : 'On Track'}
          </p>
        </div>
      </div>

      {/* 3. Friendly Strategy List */}
      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-900 mb-8 uppercase tracking-tight text-xs">Maximize Your Refund</h3>
        <div className="space-y-6">
          <TaxTip 
            icon="🏦" 
            title="Mortgage Interest Relief" 
            desc="Every interest shilling paid on your house loan reduces your taxable income."
            action="Update Profile Info"
            onClick={() => onNavigate('profile')}
          />
          <TaxTip 
            icon="🏥" 
            title="Insurance & NHIF Claims" 
            desc="KRA allows 15% relief on your life and health insurance premiums."
            action="Check eligibility details"
            onClick={() => alert('Guided info: Ensure you upload your insurance certificate in the KRA iTax portal to claim 15% relief.')}
          />
          <TaxTip 
            icon="💼" 
            title="Hustle Expenses" 
            desc="Claim equipment, data, and travel costs if you freelance or run an SME."
            action="Scan biz receipts now"
            onClick={() => onNavigate('add')}
          />
        </div>
      </section>

      <div className="px-4">
        <button className="w-full bg-black text-white py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl border-b-4 border-emerald-800 active:scale-95 transition-all">
          Prepare My KRA Preview 🇰🇪
        </button>
      </div>
    </div>
  );
};

const TaxTip: React.FC<{ icon: string; title: string; desc: string; action: string; onClick: () => void }> = ({ icon, title, desc, action, onClick }) => (
  <div className="flex gap-4 items-start group">
    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner group-hover:bg-emerald-50 transition-colors">{icon}</div>
    <div className="flex-1">
      <h4 className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight">{title}</h4>
      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed font-medium">{desc}</p>
      <button 
        onClick={onClick}
        className="text-[10px] font-black text-emerald-800 mt-2 uppercase tracking-widest hover:underline decoration-2"
      >
        {action} &rarr;
      </button>
    </div>
  </div>
);

export default TaxEngine;
