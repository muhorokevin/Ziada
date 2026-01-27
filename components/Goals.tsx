
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
  { id: 'chama100', name: 'Chama 100', seed: 100, increment: 100, weeks: 52, icon: '🤝', desc: 'The classic progressive saving challenge for long-term wealth.', color: 'emerald' },
  { id: 'boda_save', name: 'Boda Fuel Save', seed: 50, increment: 50, weeks: 12, icon: '🏍️', desc: 'Quick save for maintenance, insurance, or fuel reserves.', color: 'blue' },
  { id: 'rent_guard', name: 'Rent Guardian', seed: 500, increment: 0, weeks: 4, icon: '🏠', desc: 'Consistent weekly lock for rent peace of mind.', color: 'purple' },
  { id: 'hustle_cap', name: 'Hustle Capital', seed: 200, increment: 50, weeks: 24, icon: '💼', desc: 'Building funds for your next big stock up or shop move.', color: 'orange' },
  { id: 'education', name: 'School Fees Lock', seed: 1000, increment: 0, weeks: 13, icon: '📚', desc: 'Save weekly during the term to be ready for the next one.', color: 'indigo' },
  { id: 'shamba', name: 'Plot Deposit', seed: 2000, increment: 500, weeks: 48, icon: '🏔️', desc: 'Aggressive saving for your first piece of land.', color: 'amber' },
  { id: 'festive', name: 'Krismasi Lock', seed: 100, increment: 20, weeks: 52, icon: '🎄', desc: 'Long term saving for December travel and festivities.', color: 'red' },
  { id: 'emergency', name: 'M-Shwari Backup', seed: 50, increment: 10, weeks: 52, icon: '🚑', desc: 'Building a rainy day fund 10 bob at a time.', color: 'rose' },
];

const Goals: React.FC<GoalsProps> = ({ transactions, profile, challenges, onUpdateChallenges, onUpdateGoals, lang }) => {
  const [newGoal, setNewGoal] = useState('');
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    name: '52 Week Wealth Challenge',
    seed: 50,
    increment: 50,
    weeks: 52
  });
  
  // Calculate savings pool
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const potentialSavings = Math.max(0, totalIncome - totalExpenses);

  const addGoal = () => {
    if (newGoal.trim() && !profile.financialGoals.includes(newGoal.trim())) {
      onUpdateGoals([...profile.financialGoals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    onUpdateGoals(profile.financialGoals.filter(g => g !== goal));
  };

  const createChallenge = (overrides?: any) => {
    const data = overrides || challengeForm;
    const newCh: SavingsChallenge = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      seedAmount: data.seed,
      weeklyIncrement: data.increment,
      durationWeeks: data.weeks,
      startDate: new Date().toISOString(),
      completedWeeks: []
    };
    onUpdateChallenges([...challenges, newCh]);
    setIsCreatingChallenge(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteChallenge = (id: string) => {
    if (confirm("Stop this challenge? Progress will be lost.")) {
      onUpdateChallenges(challenges.filter(c => c.id !== id));
    }
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
  };

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-500',
    blue: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-500',
    purple: 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-500',
    orange: 'bg-orange-50 text-orange-700 border-orange-100 hover:border-orange-500',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-500',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-500',
    red: 'bg-red-50 text-red-700 border-red-100 hover:border-red-500',
    rose: 'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-500',
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* 1. Savings Hero */}
      <div className="bg-emerald-800 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-white border-b-8 border-red-600">
        <div className="relative z-10 text-center">
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-80">Disposable Capital Available</p>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 flex items-center justify-center gap-2">
            <span className="text-xl md:text-2xl opacity-50">{CURRENCY}</span> 
            <span className="text-emerald-400">{potentialSavings.toLocaleString()}</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-black/20 p-4 rounded-3xl backdrop-blur-md border border-white/5 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-300 mb-1">Savings Target</p>
              <p className="text-sm font-black">{CURRENCY} {(profile.monthlyIncome * 0.25).toLocaleString()}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-3xl backdrop-blur-md border border-white/5 text-center">
              <p className="text-[9px] font-black uppercase text-red-300 mb-1">Wealth Score</p>
              <p className="text-sm font-black">{totalIncome > 0 ? Math.floor((potentialSavings / totalIncome) * 100) : 0}%</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-3 h-full bg-red-600"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* 2. Active Challenges List (Prioritize Visibility of ongoing work) */}
      <section className="px-4 space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Progress</h3>
          {challenges.length > 0 && (
             <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-100 px-3 py-1 rounded-full">{challenges.length} Active</span>
          )}
        </div>
        <div className="space-y-6">
          {challenges.map(ch => (
            <ChallengeTracker 
              key={ch.id} 
              challenge={ch} 
              onToggleWeek={(w) => toggleWeek(ch.id, w)} 
              onDelete={() => deleteChallenge(ch.id)}
            />
          ))}
          
          {challenges.length === 0 && !isCreatingChallenge && (
            <div className="py-12 text-center border-4 border-dashed border-gray-100 rounded-[40px] bg-white/50">
              <p className="text-4xl mb-4">📈</p>
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No active challenges</p>
              <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">Pick a template below to start building wealth</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Challenge Library (Fixed Visibility with Grid) */}
      <section className="space-y-6 px-4">
        <div className="px-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Challenge Library</h3>
          <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1">New saving ideas for you</p>
        </div>
        
        {/* Improved visibility: Responsive grid instead of just a hidden scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {PRESET_TEMPLATES.map((tmpl) => (
            <button 
              key={tmpl.id}
              onClick={() => {
                setChallengeForm({ name: tmpl.name, seed: tmpl.seed, increment: tmpl.increment, weeks: tmpl.weeks });
                setIsCreatingChallenge(true);
              }}
              className={`p-6 rounded-[32px] border-2 transition-all text-left shadow-sm group active:scale-95 flex flex-col justify-between h-full ${colorMap[tmpl.color]}`}
            >
              <div>
                <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  {tmpl.icon}
                </div>
                <h4 className="font-black uppercase text-sm tracking-tight">{tmpl.name}</h4>
                <p className="text-[10px] mt-1 mb-4 leading-tight opacity-70">{tmpl.desc}</p>
              </div>
              <div className="flex justify-between items-end border-t border-black/5 pt-4">
                <div className="space-y-1">
                   <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Starts at</p>
                   <p className="text-xs font-black">{CURRENCY} {tmpl.seed}</p>
                </div>
                <div className="bg-black/90 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                  {tmpl.weeks} Weeks
                </div>
              </div>
            </button>
          ))}
          <button 
            onClick={() => {
              setChallengeForm({ name: 'Custom Challenge', seed: 50, increment: 50, weeks: 52 });
              setIsCreatingChallenge(true);
            }}
            className="p-6 rounded-[32px] border-2 border-dashed border-gray-300 transition-all text-center flex flex-col items-center justify-center hover:bg-white min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full border-2 border-emerald-700 flex items-center justify-center text-2xl mb-2 text-emerald-700">
              +
            </div>
            <h4 className="font-black text-gray-900 uppercase text-sm">Custom Challenge</h4>
            <p className="text-[10px] text-gray-400 uppercase font-black mt-1">Set your own rules</p>
          </button>
        </div>

        {isCreatingChallenge && (
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-emerald-800 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-black uppercase tracking-tight">Setup Your Goal</h4>
              <button onClick={() => setIsCreatingChallenge(false)} className="text-gray-400 hover:text-black p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <ChallengeInput 
                label="Challenge Name" 
                value={challengeForm.name} 
                onChange={v => setChallengeForm({...challengeForm, name: v})} 
              />
              <div className="grid grid-cols-2 gap-4">
                <ChallengeInput 
                  label="Starting (Week 1)" 
                  type="number" 
                  value={challengeForm.seed} 
                  onChange={v => setChallengeForm({...challengeForm, seed: Number(v)})} 
                />
                <ChallengeInput 
                  label="Weekly Increase" 
                  type="number" 
                  value={challengeForm.increment} 
                  onChange={v => setChallengeForm({...challengeForm, increment: Number(v)})} 
                />
              </div>
              <ChallengeInput 
                label="Duration (Weeks)" 
                type="number" 
                value={challengeForm.weeks} 
                onChange={v => setChallengeForm({...challengeForm, weeks: Number(v)})} 
              />
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-3xl text-center border border-emerald-100 shadow-inner">
              <p className="text-[10px] font-black uppercase text-emerald-800 mb-1">Maturity Amount (Target)</p>
              <p className="text-3xl font-black text-emerald-900">
                {CURRENCY} {calculateTotal(challengeForm.seed, challengeForm.increment, challengeForm.weeks).toLocaleString()}
              </p>
            </div>

            <button 
              onClick={() => createChallenge()}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm bg-emerald-800 text-white shadow-xl hover:bg-black border-b-4 border-black active:scale-95 transition-all"
            >
              Launch Challenge 🚀
            </button>
          </div>
        )}
      </section>

      {/* 4. Wealth Milestones */}
      <section className="space-y-4 px-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Asset Goals</h3>
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-4">
            {profile.financialGoals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-emerald-500 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-800 text-white rounded-xl flex items-center justify-center font-black shadow-sm">🎯</div>
                  <p className="font-black text-sm uppercase tracking-tight text-gray-900">{goal}</p>
                </div>
                <button onClick={() => removeGoal(goal)} className="text-gray-300 hover:text-red-600 p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {profile.financialGoals.length === 0 && (
              <p className="text-center py-4 text-[10px] text-gray-400 uppercase font-black tracking-widest">No assets listed yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g. Buying a Dairy Cow"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="flex-1 p-5 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-emerald-50 outline-none text-sm font-bold text-gray-900 shadow-inner"
            />
            <button 
              onClick={addGoal}
              className="bg-emerald-800 text-white p-5 rounded-3xl hover:bg-black transition-all shadow-xl active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Subcomponents ---

const ChallengeInput: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none font-bold text-sm shadow-inner"
    />
  </div>
);

const ChallengeTracker: React.FC<{ challenge: SavingsChallenge; onToggleWeek: (w: number) => void; onDelete: () => void }> = ({ challenge, onToggleWeek, onDelete }) => {
  const currentTotal = useMemo(() => {
    return challenge.completedWeeks.reduce((sum, w) => {
      return sum + (challenge.seedAmount + (w - 1) * challenge.weeklyIncrement);
    }, 0);
  }, [challenge]);

  const projectedTotal = calculateTotal(challenge.seedAmount, challenge.weeklyIncrement, challenge.durationWeeks);
  const progressPercent = Math.floor((challenge.completedWeeks.length / challenge.durationWeeks) * 100);

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative transition-all hover:shadow-xl group">
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-xl font-black uppercase tracking-tight text-gray-900">{challenge.name}</h4>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                 Week {challenge.completedWeeks.length} of {challenge.durationWeeks}
               </p>
            </div>
          </div>
          <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <p className="text-[9px] font-black uppercase text-emerald-800 mb-1">Saved So Far</p>
            <p className="text-xl font-black">{CURRENCY} {currentTotal.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Maturity Target</p>
            <p className="text-xl font-black">{CURRENCY} {projectedTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-800">
             <span>Completion Status</span>
             <span>{progressPercent}%</span>
           </div>
           <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
             <div className="h-full bg-emerald-600 transition-all duration-1000 rounded-full shadow-lg" style={{ width: `${progressPercent}%` }}></div>
           </div>
        </div>

        {/* Weekly Checklist Grid - Improved for touch and visibility */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Check off your weeks</p>
            <p className="text-[9px] font-bold text-emerald-800">TAP TO SAVE</p>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
            {[...Array(challenge.durationWeeks)].map((_, i) => {
              const weekNum = i + 1;
              const isCompleted = challenge.completedWeeks.includes(weekNum);
              const weeklyAmount = challenge.seedAmount + (i * challenge.weeklyIncrement);
              
              return (
                <button 
                  key={i}
                  onClick={() => onToggleWeek(weekNum)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square border-2 ${
                    isCompleted 
                      ? 'bg-emerald-800 border-emerald-900 text-white scale-95 shadow-lg' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span className={`text-[10px] font-black leading-none ${isCompleted ? 'text-white' : 'text-gray-900'}`}>{weekNum}</span>
                  <span className={`text-[7px] font-bold mt-1 ${isCompleted ? 'text-emerald-200' : 'text-gray-400'}`}>{weeklyAmount}</span>
                  {isCompleted && <span className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow-sm">✅</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-2 h-full bg-emerald-800 group-hover:w-3 transition-all"></div>
    </div>
  );
};

const calculateTotal = (seed: number, increment: number, weeks: number) => {
  // Sum of arithmetic progression: S = (n/2) * [2a + (n-1)d]
  return (weeks / 2) * (2 * seed + (weeks - 1) * increment);
};

export default Goals;
