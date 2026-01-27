
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

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* 1. Savings Hero */}
      <div className="bg-emerald-800 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-white border-b-8 border-red-600">
        <div className="relative z-10">
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center opacity-80">Disposable Capital Available</p>
          <h2 className="text-5xl md:text-7xl font-black text-center tracking-tighter mb-8 flex items-center justify-center gap-2">
            <span className="text-xl md:text-2xl opacity-50">{CURRENCY}</span> 
            <span className="text-emerald-400">{potentialSavings.toLocaleString()}</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-black/20 p-4 rounded-3xl backdrop-blur-md border border-white/5 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-300 mb-1">Savings Goal</p>
              <p className="text-sm font-black">{CURRENCY} {(profile.monthlyIncome * 0.25).toLocaleString()}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-3xl backdrop-blur-md border border-white/5 text-center">
              <p className="text-[9px] font-black uppercase text-red-300 mb-1">Efficiency Score</p>
              <p className="text-sm font-black">{totalIncome > 0 ? Math.floor((potentialSavings / totalIncome) * 100) : 0}%</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-3 h-full bg-red-600"></div>
        <div className="absolute top-0 right-3 w-1 h-full bg-white opacity-20"></div>
      </div>

      {/* 2. Progressive Savings Challenges Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Savings Challenges</h3>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1">Growth Mindset 🇰🇪</p>
          </div>
          <button 
            onClick={() => setIsCreatingChallenge(true)}
            className="bg-black text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all active:scale-95 shadow-lg"
          >
            + Create New
          </button>
        </div>

        {isCreatingChallenge && (
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-emerald-800 space-y-6 animate-in zoom-in-95 duration-300">
            <h4 className="text-lg font-black uppercase tracking-tight text-center">Setup Your Challenge</h4>
            <div className="space-y-4">
              <ChallengeInput 
                label="Challenge Name" 
                value={challengeForm.name} 
                onChange={v => setChallengeForm({...challengeForm, name: v})} 
              />
              <div className="grid grid-cols-2 gap-4">
                <ChallengeInput 
                  label="Seed Price (Week 1)" 
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
            
            <div className="bg-emerald-50 p-4 rounded-3xl text-center">
              <p className="text-[10px] font-black uppercase text-emerald-800 mb-1">Projected Total Savings</p>
              <p className="text-2xl font-black text-emerald-900">
                {CURRENCY} {calculateTotal(challengeForm.seed, challengeForm.increment, challengeForm.weeks).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsCreatingChallenge(false)}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-gray-100 text-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={createChallenge}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-emerald-800 text-white shadow-xl shadow-emerald-100"
              >
                Launch Challenge 🚀
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6 px-2">
          {challenges.map(ch => (
            <ChallengeTracker 
              key={ch.id} 
              challenge={ch} 
              onToggleWeek={(w) => toggleWeek(ch.id, w)} 
              onDelete={() => deleteChallenge(ch.id)}
            />
          ))}
          
          {challenges.length === 0 && !isCreatingChallenge && (
            <div className="py-20 text-center border-4 border-dashed border-gray-100 rounded-[40px] bg-white/50">
              <p className="text-4xl mb-4">📈</p>
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No active challenges</p>
              <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">Start a progressive saving habit today</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Wealth Milestones */}
      <section className="space-y-4 px-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Wealth Milestones</h3>
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-4">
            {profile.financialGoals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black">🇰🇪</div>
                  <p className="font-black text-sm uppercase tracking-tight">{goal}</p>
                </div>
                <button onClick={() => removeGoal(goal)} className="text-gray-300 hover:text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Add new goal (e.g. Shamba in Isinya)"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="flex-1 p-5 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-emerald-50 outline-none text-sm font-bold text-gray-900"
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
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative transition-all hover:shadow-xl">
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xl font-black uppercase tracking-tight text-gray-900">{challenge.name}</h4>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-1">
              {challenge.completedWeeks.length} of {challenge.durationWeeks} Weeks Completed
            </p>
          </div>
          <button onClick={onDelete} className="text-gray-300 hover:text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
            <p className="text-[9px] font-black uppercase text-emerald-800 mb-1">Accumulated Saved</p>
            <p className="text-lg font-black">{CURRENCY} {currentTotal.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
            <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Total Target</p>
            <p className="text-lg font-black">{CURRENCY} {projectedTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-800">
             <span>Challenge Progress</span>
             <span>{progressPercent}%</span>
           </div>
           <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
           </div>
        </div>

        {/* Weekly Checklist Grid */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tap to check off week</p>
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
                    isCompleted ? 'bg-emerald-800 border-emerald-900 text-white scale-95 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-emerald-700'
                  }`}
                >
                  <span className="text-[9px] font-black leading-none">{weekNum}</span>
                  <span className="text-[7px] font-bold mt-1 opacity-60">{weeklyAmount}</span>
                  {isCompleted && <span className="absolute -top-1 -right-1 text-[8px]">✅</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-2 h-full bg-emerald-800/10"></div>
    </div>
  );
};

const calculateTotal = (seed: number, increment: number, weeks: number) => {
  // Sum of arithmetic progression: S = (n/2) * [2a + (n-1)d]
  return (weeks / 2) * (2 * seed + (weeks - 1) * increment);
};

export default Goals;
