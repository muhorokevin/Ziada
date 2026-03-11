
import React, { useState } from 'react';
import { Chama, UserProfile } from '../types';
import { CURRENCY } from '../constants';

interface ChamaManagerProps {
  profile: UserProfile;
  onUpdateChamas: (chamas: Chama[]) => void;
}

const ChamaManager: React.FC<ChamaManagerProps> = ({ profile, onUpdateChamas }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newChama, setNewChama] = useState<Partial<Chama>>({
    frequency: 'monthly',
    contributionAmount: 0
  });

  const chamas = profile.chamas || [];

  const handleAdd = () => {
    if (!newChama.name || !newChama.contributionAmount) return;
    const chama: Chama = {
      id: Math.random().toString(36).substr(2, 9),
      name: newChama.name!,
      contributionAmount: Number(newChama.contributionAmount),
      frequency: newChama.frequency as any,
      nextContributionDate: new Date().toISOString().split('T')[0],
      totalContributed: 0
    };
    onUpdateChamas([...chamas, chama]);
    setShowAdd(false);
    setNewChama({ frequency: 'monthly', contributionAmount: 0 });
  };

  const recordContribution = (id: string) => {
    const updated = chamas.map(c => {
      if (c.id === id) {
        return { ...c, totalContributed: c.totalContributed + c.contributionAmount };
      }
      return c;
    });
    onUpdateChamas(updated);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tight">Chama Groups</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-black text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
        >
          New Chama +
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-in">
          <h3 className="font-black uppercase tracking-tight mb-4">Join/Create Chama</h3>
          <div className="space-y-4">
            <input 
              placeholder="Chama Name (e.g. Family Merry-Go-Round)"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
              value={newChama.name || ''}
              onChange={e => setNewChama({...newChama, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number"
                placeholder="Contribution Amount"
                className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newChama.contributionAmount || ''}
                onChange={e => setNewChama({...newChama, contributionAmount: Number(e.target.value)})}
              />
              <select 
                className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newChama.frequency}
                onChange={e => setNewChama({...newChama, frequency: e.target.value as any})}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
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
                Save Chama
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {chamas.length === 0 && !showAdd && (
          <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 font-medium">No chamas tracked yet. Start one to manage your group savings.</p>
          </div>
        )}
        {chamas.map(chama => (
          <div key={chama.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">🛖</div>
              <div>
                <h4 className="font-black text-gray-900 uppercase tracking-tight">{chama.name}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{chama.frequency} • {CURRENCY} {chama.contributionAmount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Contributed</p>
                <p className="font-black text-emerald-700">{CURRENCY} {chama.totalContributed.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => recordContribution(chama.id)}
                className="bg-emerald-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Paid
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-8 rounded-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
        <h4 className="font-black uppercase tracking-widest text-xs text-emerald-500 mb-2">Chama Wisdom</h4>
        <p className="text-sm font-medium leading-relaxed max-w-md">
          Chamas are the backbone of Kenyan wealth creation. Ensure your group has a formal constitution and uses a dedicated bank account or M-Pesa Paybill for transparency.
        </p>
      </div>
    </div>
  );
};

export default ChamaManager;
