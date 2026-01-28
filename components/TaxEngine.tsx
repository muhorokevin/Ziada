
import React, { useMemo } from 'react';
import { Transaction, Category, UserProfile, ExpenseCategory } from '../types';
import { KENYA_TAX_BANDS, CURRENCY, SHIF_RATE, HOUSING_LEVY_RATE, PERSONAL_RELIEF_MONTHLY } from '../constants';

interface TaxEngineProps {
  transactions: Transaction[];
  profile: UserProfile;
  lang: 'en' | 'sw';
  onNavigate: (tab: any) => void;
}

const TaxEngine: React.FC<TaxEngineProps> = ({ transactions, profile, lang, onNavigate }) => {
  const taxStats = useMemo(() => {
    const gross = profile.monthlyIncome || 0;
    
    // 1. Calculate PAYE
    let remaining = gross;
    let paye = 0;
    let prevLimit = 0;
    for (const band of KENYA_TAX_BANDS) {
      const taxableInBand = Math.min(Math.max(0, gross - prevLimit), band.upTo - prevLimit);
      paye += taxableInBand * band.rate;
      prevLimit = band.upTo;
      if (gross <= band.upTo) break;
    }

    // 2. Levies
    const shif = gross * SHIF_RATE;
    const housingLevy = gross * HOUSING_LEVY_RATE;

    // 3. Reliefs
    const insuranceRelief = (profile.insurancePremium || 0) * 0.15;
    const personalRelief = PERSONAL_RELIEF_MONTHLY;
    const totalRelief = personalRelief + insuranceRelief;

    const netTax = Math.max(0, paye - totalRelief);
    const takeHome = gross - netTax - shif - housingLevy;

    // 4. Refund Potential from business expenses
    const bizExpenses = transactions
      // Fixed: Use ExpenseCategory.BUSINESS instead of Category.BUSINESS
      .filter(tr => tr.isBusiness || tr.category === ExpenseCategory.BUSINESS)
      .reduce((sum, tr) => sum + tr.amount, 0);
    const refundPotential = (bizExpenses / 12) * 0.16; // Simplified estimate

    return { gross, paye, shif, housingLevy, netTax, takeHome, reliefs: totalRelief, refundPotential };
  }, [profile, transactions]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="bg-red-600 text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-red-100 text-[10px] font-black uppercase tracking-widest mb-2">Monthly Tax Liability Preview</p>
          <h2 className="text-5xl font-black mb-6">{CURRENCY} {taxStats.netTax.toLocaleString()}</h2>
          <div className="flex gap-4">
             <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/5 flex-1">
               <p className="text-[9px] font-black uppercase text-red-100 mb-1">Take Home</p>
               <p className="text-lg font-black">{CURRENCY} {taxStats.takeHome.toLocaleString()}</p>
             </div>
             <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/5 flex-1 text-center">
               <p className="text-[9px] font-black uppercase text-red-100 mb-1">Refund Potential</p>
               <p className="text-lg font-black text-emerald-400">+{CURRENCY} {taxStats.refundPotential.toLocaleString()}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Tax Breakdown</h3>
          <div className="space-y-4">
            <TaxRow label="Gross Salary" value={taxStats.gross} />
            <TaxRow label="PAYE (Before Relief)" value={taxStats.paye} />
            <TaxRow label="Personal Relief" value={-2400} color="text-emerald-600" />
            <TaxRow label="Insurance Relief" value={-((profile.insurancePremium || 0) * 0.15)} color="text-emerald-600" />
            <div className="border-t border-gray-100 pt-4 mt-4">
              <TaxRow label="SHIF (2.75%)" value={taxStats.shif} />
              <TaxRow label="Housing Levy (1.5%)" value={taxStats.housingLevy} />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Optimization Tips</h3>
          <div className="space-y-6">
            <TaxTip icon="🏦" title="Housing Interest" desc="Your mortgage interest is deductible up to KES 300k p.a." />
            <TaxTip icon="🏥" title="Life Insurance" desc="Claim 15% relief on your premiums to lower your PAYE." />
            <TaxTip icon="💼" title="Business Expenses" desc="Freelancers can claim data, travel and tools as business costs." />
          </div>
        </section>
      </div>

      <button className="w-full bg-black text-white py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl border-b-4 border-emerald-800 active:scale-95 transition-all">Prepare My iTax Preview 🇰🇪</button>
    </div>
  );
};

const TaxRow: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = "text-gray-900" }) => (
  <div className="flex justify-between items-center text-sm font-bold">
    <span className="text-gray-500 font-medium">{label}</span>
    <span className={color}>{CURRENCY} {Math.abs(value).toLocaleString()}</span>
  </div>
);

const TaxTip: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-4 items-start">
    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0">{icon}</div>
    <div>
      <h4 className="text-xs font-black uppercase tracking-tight">{title}</h4>
      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);

export default TaxEngine;
