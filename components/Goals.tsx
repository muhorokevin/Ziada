
import React, { useState, useMemo } from 'react';
import { Transaction, UserProfile, SavingsChallenge } from '../types';
import { CURRENCY } from '../constants';

interface GoalsProps {
  transactions: Transaction[];
  profile: UserProfile;
  challenges: SavingsChallenge[];
  onUpdateChallenges: (ch: SavingsChallenge[]) => void;
  onUpdateGoals: (goals: string[]) => void;
  lang: 'en' | 'sw';
}

const PRESET_TEMPLATES = [
  { id: 'chama100', name: 'Chama 100', seed: 100, increment: 100, weeks: 52, icon: '🤝', desc: 'Progressive weekly savings.', color: 'emerald' },
  { id: 'emergency', name: 'Emergency Fund', seed: 500, increment: 0, weeks: 12, icon: '🛡️', desc: 'Secure your peace of mind.', color: 'blue' },
  { id: 'school_fees', name: 'School Fees Goal', seed: 1000, increment: 0, weeks: 20, icon: '📚', desc: 'Prepare for next term.', color: 'purple' },
  { id: 'plot_deposit', name: 'Plot Deposit', seed: 5000, increment: 500, weeks: 48, icon: '🏔️', desc: 'Saving for your first land.', color: 'amber' },
  { id: 'holiday', name: 'Diani Holiday', seed: 200, increment: 100, weeks: 16, icon: '🏖️', desc: 'Save for that beach trip.', color: 'red' },
  { id: 'business_cap', name: 'Business Capital', seed: 2000, increment: 0, weeks: 24, icon: '💼', desc: 'Start your own hustle.', color: 'indigo' },
];

const Goals: React.FC<GoalsProps> = ({ transactions, profile, challenges, onUpdateChallenges, onUpdateGoals, lang }) => {
  const [newGoal, setNewGoal] = useState('');
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [viewingChallenge, setViewingChallenge] = useState<SavingsChallenge | null>(null);
  const [challengeForm, setChallengeForm] = useState({ name: 'Challenge', seed: 50, increment: 50, weeks: 52 });
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const potentialSavings = Math.max(0, totalIncome - totalExpenses);

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.trim() && !profile.financialGoals.includes(newGoal.trim())) {
      onUpdateGoals([...profile.financialGoals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const createChallenge = () => {
    const newCh: SavingsChallenge = {
      id: Math.random().toString(36).substr(2, 9),
      name: challengeForm.name,
      seedAmount: challengeForm.seed,
      weeklyIncrement: challengeForm.increment,
      durationWeeks: challengeForm.weeks,
      startDate: new Date().toISOString(),
      completedWeeks: []
    };
    onUpdateChallenges([...challenges, newCh]);
    setIsCreatingChallenge(false);
  };

  const toggleWeek = (challengeId: string, week: number) => {
    const newChallenges = challenges.map(c => {
      if (c.id === challengeId) {
        const completed = c.completedWeeks.includes(week)
          ? c.completedWeeks.filter(w => w !== week)
          : [...c.completedWeeks, week];
        return { ...c, completedWeeks: completed };
      }
      return c;
    });
    onUpdateChallenges(newChallenges);
    const updated = newChallenges.find(c => c.id === challengeId);
    if (updated) setViewingChallenge(updated);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Wealth Header */}
      <section className="bg-emerald-800 rounded-[50px] p-10 md:p-14 shadow-2xl relative overflow-hidden text-white border-b-8 border-red-600">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Net Monthly Capacity</p>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter flex items-center justify-center gap-2">
            <span className="text-xl md:text-3xl opacity-50 font-medium">{CURRENCY}</span> 
            <span className="text-emerald-400 drop-shadow-lg">{potentialSavings.toLocaleString()}</span>
          </h2>
          <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">This is your potential seed for wealth creation.</p>
        </div>
      </section>

      {/* Active Challenges Grid */}
      <section className="px-2 space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Challenges</h3>
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[9px] font-black">{challenges.length} active</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(ch => (
            <button key={ch.id} onClick={() => setViewingChallenge(ch)} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-emerald-700 hover:shadow-xl transition-all text-left">
              <div className="mb-6">
                <h4 className="font-black uppercase text-lg tracking-tight text-gray-900">{ch.name}</h4>
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-1">
                  Week {ch.completedWeeks.length} of {ch.durationWeeks}
                </p>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${(ch.completedWeeks.length / ch.durationWeeks) * 100}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>View Progress</span>
                <span className="text-emerald-800">→</span>
              </div>
            </button>
          ))}
          <button onClick={() => setIsCreatingChallenge(true)} className="bg-gray-50 p-8 rounded-[40px] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-white hover:border-emerald-200 transition-all">
            <span className="text-4xl">+</span>
            <span className="font-black uppercase text-[10px] tracking-widest">Create New Hustle Challenge</span>
          </button>
        </div>
      </section>

      {/* Challenges Marketplace */}
      <section className="space-y-6 px-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">Wealth Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {PRESET_TEMPLATES.map((tmpl) => (
            <button key={tmpl.id} onClick={() => { setChallengeForm({ name: tmpl.name, seed: tmpl.seed, increment: tmpl.increment, weeks: tmpl.weeks }); setIsCreatingChallenge(true); }} className="bg-white p-6 rounded-[32px] border border-gray-100 text-left hover:scale-105 transition-all shadow-sm">
              <div className="text-3xl mb-4">{tmpl.icon}</div>
              <h4 className="font-black uppercase text-[10px] tracking-tight text-gray-900 leading-tight">{tmpl.name}</h4>
              <p className="text-[9px] font-black text-emerald-800 mt-1 uppercase opacity-60">{tmpl.weeks} Weeks</p>
            </button>
          ))}
        </div>
      </section>

      {/* Wealth Milestones List */}
      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6 mx-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Personal Wealth Milestones</h3>
        <div className="space-y-3">
          {profile.financialGoals.map((goal, idx) => (
            <div key={idx} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100 group">
              <span className="text-sm font-black uppercase tracking-tight text-gray-800">{goal}</span>
              <button onClick={() => onUpdateGoals(profile.financialGoals.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-600 transition-colors">🗑️</button>
            </div>
          ))}
          <form onSubmit={addGoal} className="flex gap-2">
            <input type="text" placeholder="Add a new milestone (e.g. Build House)" value={newGoal} onChange={e => setNewGoal(e.target.value)} className="flex-1 p-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-800 outline-none text-sm font-bold" />
            <button type="submit" className="bg-black text-white px-6 rounded-2xl font-black text-xl hover:bg-emerald-800 active:scale-95">+</button>
          </form>
        </div>
      </section>

      {/* TRACKER MODAL */}
      {viewingChallenge && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[50px] sm:rounded-[50px] p-10 max-h-[90vh] overflow-y-auto shadow-2xl border-t-8 border-emerald-800">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-3xl font-black uppercase tracking-tighter">{viewingChallenge.name}</h4>
              <button onClick={() => setViewingChallenge(null)} className="bg-gray-100 p-3 rounded-full text-lg">✖</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 text-center">
                 <p className="text-[10px] font-black uppercase text-emerald-800 mb-2 tracking-widest">Progress</p>
                 <p className="text-3xl font-black">{viewingChallenge.completedWeeks.length} / {viewingChallenge.durationWeeks}</p>
               </div>
               <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 text-center">
                 <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Next Target</p>
                 <p className="text-3xl font-black text-emerald-800">
                    {CURRENCY} {(viewingChallenge.seedAmount + (viewingChallenge.completedWeeks.length * viewingChallenge.weeklyIncrement)).toLocaleString()}
                 </p>
               </div>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-10">
              {[...Array(viewingChallenge.durationWeeks)].map((_, i) => {
                const weekNum = i + 1;
                const isCompleted = viewingChallenge.completedWeeks.includes(weekNum);
                return (
                  <button key={i} onClick={() => toggleWeek(viewingChallenge.id, weekNum)} className={`aspect-square rounded-2xl flex items-center justify-center font-black text-xs transition-all border-2 ${isCompleted ? 'bg-emerald-800 border-emerald-900 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-emerald-200'}`}>
                    {weekNum}
                  </button>
                );
              })}
            </div>

            <button onClick={() => { if(confirm("Stop challenge?")) { onUpdateChallenges(challenges.filter(c => c.id !== viewingChallenge.id)); setViewingChallenge(null); }}} className="w-full text-red-500 font-black uppercase tracking-widest text-[11px] py-4 bg-red-50 rounded-2xl">Abort Financial Mission</button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreatingChallenge && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl border-t-8 border-black">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-black uppercase tracking-tight">Setup Mission</h4>
              <button onClick={() => setIsCreatingChallenge(false)} className="text-gray-400">✖</button>
            </div>
            <div className="space-y-4">
              <ChallengeInput label="Challenge Name" value={challengeForm.name} onChange={v => setChallengeForm({...challengeForm, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <ChallengeInput label="Week 1 Aim" type="number" value={challengeForm.seed} onChange={v => setChallengeForm({...challengeForm, seed: Number(v)})} />
                <ChallengeInput label="Step Increase" type="number" value={challengeForm.increment} onChange={v => setChallengeForm({...challengeForm, increment: Number(v)})} />
              </div>
              <ChallengeInput label="Duration (Weeks)" type="number" value={challengeForm.weeks} onChange={v => setChallengeForm({...challengeForm, weeks: Number(v)})} />
              <button onClick={createChallenge} className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm bg-black text-white shadow-xl mt-6">Confirm Setup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChallengeInput: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold" />
  </div>
);

export default Goals;
