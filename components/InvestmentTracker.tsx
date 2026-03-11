
import React, { useState } from 'react';
import { Investment, UserProfile } from '../types';
import { CURRENCY } from '../constants';

interface InvestmentTrackerProps {
  profile: UserProfile;
  onUpdateInvestments: (investments: Investment[]) => void;
}

const InvestmentTracker: React.FC<InvestmentTrackerProps> = ({ profile, onUpdateInvestments }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newInv, setNewInv] = useState<Partial<Investment>>({
    type: 'MMF',
    balance: 0,
    institution: ''
  });

  const investments = profile.investments || [];

  const handleAdd = () => {
    if (!newInv.name || !newInv.institution) return;
    const inv: Investment = {
      id: Math.random().toString(36).substr(2, 9),
      name: newInv.name!,
      type: newInv.type as any,
      institution: newInv.institution!,
      balance: Number(newInv.balance) || 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      expectedAnnualReturn: Number(newInv.expectedAnnualReturn) || 0
    };
    onUpdateInvestments([...investments, inv]);
    setShowAdd(false);
    setNewInv({ type: 'MMF', balance: 0, institution: '' });
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.balance, 0);

  return (
    <div className="space-y-6 animate-in">
      <div className="bg-[#0A0D10] text-white p-8 rounded-[40px] shadow-2xl border border-emerald-900/30">
        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Portfolio Value</p>
        <h2 className="text-4xl font-black tracking-tighter tabular-nums">
          {CURRENCY} {totalInvested.toLocaleString()}
        </h2>
        <div className="mt-6 flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {investments.map(inv => (
            <div key={inv.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl min-w-[160px]">
              <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{inv.type}</p>
              <p className="font-bold text-sm truncate">{inv.name}</p>
              <p className="text-emerald-400 font-black text-sm mt-1">{CURRENCY} {inv.balance.toLocaleString()}</p>
            </div>
          ))}
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-emerald-500/10 border border-emerald-500/30 border-dashed p-4 rounded-2xl min-w-[160px] flex flex-col items-center justify-center gap-1 hover:bg-emerald-500/20 transition-all"
          >
            <span className="text-xl">+</span>
            <span className="text-[10px] font-black uppercase">Add Asset</span>
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-in">
          <h3 className="font-black uppercase tracking-tight mb-4">Add New Investment</h3>
          <div className="space-y-4">
            <input 
              placeholder="Asset Name (e.g. Emergency Fund)"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-700"
              value={newInv.name || ''}
              onChange={e => setNewInv({...newInv, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newInv.type}
                onChange={e => setNewInv({...newInv, type: e.target.value as any})}
              >
                <option value="MMF">MMF</option>
                <option value="Sacco">Sacco</option>
                <option value="Stocks">Stocks</option>
                <option value="M-Akiba">M-Akiba</option>
                <option value="Treasury Bonds">Treasury Bonds</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Crypto">Crypto</option>
                <option value="Gold">Gold</option>
                <option value="Other">Other</option>
              </select>
              <input 
                placeholder="Institution"
                className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newInv.institution || ''}
                onChange={e => setNewInv({...newInv, institution: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number"
                placeholder="Current Balance"
                className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newInv.balance || ''}
                onChange={e => setNewInv({...newInv, balance: Number(e.target.value)})}
              />
              <input 
                type="number"
                placeholder="Expected Return %"
                className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newInv.expectedAnnualReturn || ''}
                onChange={e => setNewInv({...newInv, expectedAnnualReturn: Number(e.target.value)})}
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAdd(false)}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-700 text-white"
              >
                Save Investment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Asset Allocation</h4>
          <div className="space-y-3">
            {['MMF', 'Sacco', 'Stocks', 'M-Akiba', 'Treasury Bonds', 'Real Estate', 'Crypto', 'Gold', 'Other'].map(type => {
              const typeTotal = investments.filter(i => i.type === type).reduce((s, i) => s + i.balance, 0);
              const percentage = totalInvested > 0 ? (typeTotal / totalInvested) * 100 : 0;
              if (typeTotal === 0) return null;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{type}</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4">Investment Tip</h4>
          <p className="text-emerald-900 text-sm font-medium leading-relaxed">
            {totalInvested < profile.monthlyIncome * 3 
              ? "Your emergency fund should ideally cover 3-6 months of expenses. Consider increasing your MMF contributions."
              : "Great job! You have a solid base. Have you considered diversifying into Treasury Bonds or M-Akiba?"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestmentTracker;
