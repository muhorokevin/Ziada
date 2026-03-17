
import React, { useState, useEffect } from 'react';
import { Transaction, Category, UserProfile, EmploymentType, Budget, SavingsChallenge, Investment, Chama, Wallet } from './types';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import TaxEngine from './components/TaxEngine';
import VoiceCoach from './components/VoiceCoach';
import Profile from './components/Profile';
import FinancialAnalysis from './components/FinancialAnalysis';
import Goals from './components/Goals';
import InvestmentTracker from './components/InvestmentTracker';
import ChamaManager from './components/ChamaManager';
import WalletComponent from './components/Wallet';
import { TRANSLATIONS } from './constants';
import { encryptData, decryptData } from './utils/security';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, orderBy, getDoc, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreError';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'tax' | 'coach' | 'analysis' | 'profile' | 'goals' | 'investments' | 'chamas' | 'wallet'>('home');
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [challenges, setChallenges] = useState<SavingsChallenge[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    employmentType: EmploymentType.OTHER,
    monthlyIncome: 0,
    industry: 'Other',
    financialGoals: [],
    avatar: 'lion',
    hasOnboarded: false,
    hasSeenGuide: false,
    investments: [],
    chamas: []
  });
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, currency: 'KES', lastUpdated: new Date().toISOString() });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sync Profile
    const profilePath = `users/${user.uid}`;
    const profileRef = doc(db, profilePath);
    const unsubProfile = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      } else {
        // Initialize profile if it doesn't exist
        setDoc(profileRef, profile).catch(e => handleFirestoreError(e, OperationType.WRITE, profilePath));
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, profilePath));

    // Sync Transactions
    const txPath = `users/${user.uid}/transactions`;
    const txRef = collection(db, txPath);
    const qTx = query(txRef, orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs);
    }, (e) => handleFirestoreError(e, OperationType.GET, txPath));

    // Sync Budgets
    const budgetPath = `users/${user.uid}/budgets`;
    const budgetRef = collection(db, budgetPath);
    const unsubBudget = onSnapshot(budgetRef, (snapshot) => {
      const bgs = snapshot.docs.map(d => d.data() as Budget);
      setBudgets(bgs);
    }, (e) => handleFirestoreError(e, OperationType.GET, budgetPath));

    // Sync Challenges
    const challengePath = `users/${user.uid}/challenges`;
    const challengeRef = collection(db, challengePath);
    const unsubChallenge = onSnapshot(challengeRef, (snapshot) => {
      const chs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavingsChallenge));
      setChallenges(chs);
    }, (e) => handleFirestoreError(e, OperationType.GET, challengePath));

    // Sync Wallet
    const walletPath = `users/${user.uid}/wallet/main`;
    const walletRef = doc(db, walletPath);
    const unsubWallet = onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        setWallet(doc.data() as Wallet);
      } else {
        setDoc(walletRef, wallet).catch(e => handleFirestoreError(e, OperationType.WRITE, walletPath));
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, walletPath));

    return () => {
      unsubProfile();
      unsubTx();
      unsubBudget();
      unsubChallenge();
      unsubWallet();
    };
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (!profile.hasOnboarded) {
      setShowWelcome(true);
    } else if (!profile.hasSeenGuide) {
      setShowGuide(true);
    }
  }, [profile.hasOnboarded, profile.hasSeenGuide]);

  useEffect(() => {
    if (profile.isPasswordEnabled && profile.password) {
      setIsLocked(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('akiba_pr_secure', encryptData(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('akiba_tx_secure', encryptData(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('akiba_bg_secure', encryptData(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('akiba_ch_secure', encryptData(challenges));
  }, [challenges]);

  const addTransaction = async (t: Transaction) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions`;
    try {
      const txRef = doc(collection(db, path));
      await setDoc(txRef, { ...t, id: txRef.id });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const addBulkTransactions = async (ts: Transaction[]) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions`;
    try {
      for (const t of ts) {
        const txRef = doc(collection(db, path));
        await setDoc(txRef, { ...t, id: txRef.id });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${updated.id}`;
    try {
      await setDoc(doc(db, path), updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const updateBudgets = async (newBudgets: Budget[]) => {
    if (!user) return;
    const pathPrefix = `users/${user.uid}/budgets`;
    try {
      for (const b of newBudgets) {
        await setDoc(doc(db, `${pathPrefix}/${b.category}`), b);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, pathPrefix);
    }
  };

  const updateChallenges = async (newChallenges: SavingsChallenge[]) => {
    if (!user) return;
    const pathPrefix = `users/${user.uid}/challenges`;
    try {
      for (const ch of newChallenges) {
        await setDoc(doc(db, `${pathPrefix}/${ch.id}`), ch);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, pathPrefix);
    }
  };

  const toggleChallengeWeek = async (challengeId: string, week: number) => {
    if (!user) return;
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const isCompleting = !challenge.completedWeeks.includes(week);
    const amount = challenge.seedAmount + (week - 1) * challenge.weeklyIncrement;

    if (isCompleting && wallet.balance < amount) {
      alert(`Insufficient wallet balance! You need ${amount} KES to save for Week ${week}.`);
      return;
    }

    const newCompleted = isCompleting 
      ? [...challenge.completedWeeks, week]
      : challenge.completedWeeks.filter(w => w !== week);

    const challengePath = `users/${user.uid}/challenges/${challengeId}`;
    const walletPath = `users/${user.uid}/wallet/main`;
    const walletTxPath = `users/${user.uid}/wallet_transactions`;

    try {
      // Update Challenge
      await setDoc(doc(db, challengePath), {
        ...challenge,
        completedWeeks: newCompleted
      });

      // Update Wallet
      const newBalance = isCompleting ? wallet.balance - amount : wallet.balance + amount;
      await setDoc(doc(db, walletPath), {
        ...wallet,
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      });

      // Log Wallet Transaction
      await addDoc(collection(db, walletTxPath), {
        date: new Date().toISOString(),
        amount,
        type: isCompleting ? 'payment' : 'deposit',
        status: 'completed',
        description: `${isCompleting ? 'Saved for' : 'Refund from'} ${challenge.name} - Week ${week}`,
        reference: 'CH' + Math.random().toString(36).substring(7).toUpperCase()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'multiple-paths');
    }
  };

  const updateInvestments = async (investments: Investment[]) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, path), { ...profile, investments }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const updateChamas = async (chamas: Chama[]) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, path), { ...profile, chamas }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
  };

  const completeOnboarding = () => {
    setProfile(prev => ({ ...prev, hasOnboarded: true }));
    setShowWelcome(false);
  };

  const closeGuide = () => {
    setProfile(prev => ({ ...prev, hasSeenGuide: true }));
    setShowGuide(false);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === profile.password) {
      setIsLocked(false);
      setPinInput('');
    } else {
      alert("Invalid PIN. Access Denied.");
      setPinInput('');
    }
  };

  const t = TRANSLATIONS[lang];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col p-8 items-center justify-center text-center">
        <div className="w-32 h-32 bg-emerald-800 rounded-[40px] flex items-center justify-center text-6xl shadow-2xl mb-12 border-b-8 border-red-600">🇰🇪</div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Akiba Kenya</h1>
        <p className="text-gray-500 max-w-xs mb-12 font-medium leading-relaxed">Secure your financial future. Track, save, and invest with the power of AI.</p>
        <button onClick={handleLogin} className="w-full max-w-xs bg-black text-white py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-emerald-900 transition-all active:scale-95 flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.292-2.09 4.413-1.477 1.408-3.762 2.816-7.84 2.816-6.34 0-11.246-5.116-11.246-11.464s4.906-11.464 11.246-11.464c3.42 0 5.846 1.348 7.746 3.18l2.314-2.314c-2.644-2.546-6.187-4.413-10.06-4.413-7.22 0-13.12 5.9-13.12 13.12s5.9 13.12 13.12 13.12c3.75 0 6.59-1.247 8.89-3.645 2.293-2.398 3.013-5.736 3.013-8.347 0-.633-.056-1.232-.148-1.782h-11.755z"/></svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-24 h-24 bg-black/30 rounded-full flex items-center justify-center text-4xl mb-8 border-4 border-emerald-400">🔐</div>
        <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Vault Secured</h2>
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
          <input 
            autoFocus
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            className="w-full bg-white/10 border-2 border-emerald-400/30 rounded-3xl p-5 text-center text-3xl font-black tracking-[1em] focus:outline-none focus:border-emerald-400 transition-all"
          />
          <button type="submit" className="w-full bg-emerald-500 text-black py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-all">Unlock Now</button>
        </form>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-white flex flex-col p-8 items-center justify-center text-center animate-in">
        <div className="w-32 h-32 bg-emerald-800 rounded-[40px] flex items-center justify-center text-6xl shadow-2xl mb-12 border-b-8 border-red-600">🇰🇪</div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Welcome to Akiba</h1>
        <p className="text-gray-500 max-w-xs mb-12 font-medium leading-relaxed">The smart financial tracker designed for Kenyans. Track M-Pesa, maximize KRA refunds, and build wealth.</p>
        <button onClick={completeOnboarding} className="w-full max-w-xs bg-black text-white py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-emerald-900 transition-all active:scale-95">Get Started &rarr;</button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard transactions={transactions} profile={profile} budgets={budgets} onNavigate={setActiveTab} lang={lang} onUpdateProfile={setProfile} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} />;
      case 'add': return <AddTransaction onAdd={(t) => { addTransaction(t); setActiveTab('home'); }} onBulkAdd={(ts) => { addBulkTransactions(ts); setActiveTab('home'); }} lang={lang} />;
      case 'tax': return <TaxEngine transactions={transactions} profile={profile} lang={lang} onNavigate={setActiveTab} />;
      case 'coach': return <VoiceCoach transactions={transactions} profile={profile} onAddTransaction={addTransaction} />;
      case 'profile': return <Profile profile={profile} onSave={setProfile} lang={lang} onLangToggle={(l) => setLang(l)} />;
      case 'analysis': return <FinancialAnalysis transactions={transactions} budgets={budgets} onUpdateBudgets={updateBudgets} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} lang={lang} />;
      case 'goals': return <Goals transactions={transactions} profile={profile} challenges={challenges} onUpdateChallenges={updateChallenges} onToggleWeek={toggleChallengeWeek} onUpdateGoals={(g) => setProfile({...profile, financialGoals: g})} lang={lang} />;
      case 'investments': return <InvestmentTracker profile={profile} onUpdateInvestments={updateInvestments} />;
      case 'chamas': return <ChamaManager profile={profile} onUpdateChamas={updateChamas} />;
      case 'wallet': return <WalletComponent wallet={wallet} userId={user.uid} />;
      default: return <Dashboard transactions={transactions} profile={profile} budgets={budgets} onNavigate={setActiveTab} lang={lang} onUpdateProfile={setProfile} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} />;
    }
  };

  const getAvatarEmoji = (id?: string) => {
    const avatars: Record<string, string> = {
      lion: '🦁', runner: '🏃🏾‍♂️', maasai: '🛡️', coffee: '☕', elephant: '🐘', tea: '🍃', landscape: '🏔️', truck: '🚛', giraffe: '🦒', shield: '🛡️'
    };
    return avatars[id || 'lion'] || '🦁';
  };

  const guideSteps = [
    { title: "Your Dashboard", desc: "This is where you see your total spending velocity and KRA refund potential.", pos: "top-40", tab: 'home' },
    { title: "KRA Optimization", desc: "Track PAYE, Housing Levy, and SHIF here to maximize your tax refunds.", pos: "bottom-32", tab: 'tax' },
    { title: "AI Voice Coach", desc: "Talk to your coach to log spending using voice or get financial advice.", pos: "bottom-32", tab: 'coach' },
    { title: "Wealth Goals", desc: "Start savings challenges like Chama 100 to reach your wealth milestones.", pos: "bottom-32", tab: 'goals' }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-24 sm:pb-32 selection:bg-emerald-200 transition-all">
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-in fade-in duration-500 flex flex-col items-center justify-center p-8">
          <div className={`bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl transform transition-all duration-500 scale-100`}>
             <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-emerald-800">{guideSteps[guideStep].title}</h2>
             <p className="text-gray-500 mb-8 font-medium leading-relaxed">{guideSteps[guideStep].desc}</p>
             <button 
               onClick={() => {
                 if (guideStep < guideSteps.length - 1) {
                   setGuideStep(guideStep + 1);
                   setActiveTab(guideSteps[guideStep + 1].tab as any);
                 } else {
                   closeGuide();
                 }
               }}
               className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95"
             >
               {guideStep < guideSteps.length - 1 ? "Next Tip &rarr;" : "Got it! Let's Go"}
             </button>
          </div>
          <div className="mt-8 flex gap-2">
            {guideSteps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === guideStep ? 'w-8 bg-white' : 'w-1.5 bg-white/30'}`}></div>
            ))}
          </div>
        </div>
      )}

      <header className="bg-emerald-800 text-white pt-6 pb-4 px-4 sm:px-8 shadow-md sticky top-0 z-50 border-b-4 border-red-600">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div className="flex-1">
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Akiba 🇰🇪</p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase truncate max-w-[180px] sm:max-w-none">{profile.fullName ? profile.fullName.split(' ')[0] : t.citizen}</h1>
          </div>
          <button onClick={() => setActiveTab('profile')} className="relative group focus:outline-none flex-shrink-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all text-xl sm:text-2xl ${activeTab === 'profile' ? 'bg-red-600 text-white scale-110 shadow-lg' : 'bg-black text-white hover:bg-emerald-700'}`}>
              {getAvatarEmoji(profile.avatar)}
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">{renderContent()}</main>

      <button onClick={() => setActiveTab('add')} className={`fixed bottom-24 right-6 sm:right-12 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all active:scale-90 z-40 border-4 border-white ${activeTab === 'add' ? 'bg-red-600 text-white rotate-45' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>
        <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
      </button>

      <nav className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[550px] bg-black/95 backdrop-blur-md flex justify-around items-center p-3 z-50 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-emerald-800/50">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon="home" label={t.home} />
        <NavButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon="wallet" label="Wallet" />
        <NavButton active={activeTab === 'tax'} onClick={() => setActiveTab('tax')} icon="tax" label={t.tax} />
        <NavButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon="analysis" label="Insights" />
        <NavButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} icon="goals" label={t.goals} />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: 'home' | 'tax' | 'voice' | 'analysis' | 'goals' | 'wallet';
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  const iconMap = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    tax: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1.0 01.293.707V19a2 2 0 01-2 2z" />,
    voice: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V7a3 3 0 013-3z" />,
    analysis: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />,
    goals: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-1 transition-all ${active ? 'text-red-500 scale-105' : 'text-emerald-100 hover:text-emerald-400'}`}>
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{iconMap[icon]}</svg>
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">{label}</span>
    </button>
  );
};

export default App;
