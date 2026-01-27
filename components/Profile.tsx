
import React, { useState } from 'react';
import { UserProfile, EmploymentType } from '../types';
import { CURRENCY, TRANSLATIONS } from '../constants';

interface ProfileProps {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  lang: 'en' | 'sw';
  onLangToggle: (l: 'en' | 'sw') => void;
}

const KENYAN_AVATARS = [
  { id: 'lion', emoji: '🦁', label: 'Simba' },
  { id: 'runner', emoji: '🏃🏾‍♂️', label: 'Athlete' },
  { id: 'maasai', emoji: '🛡️', label: 'Warrior' },
  { id: 'coffee', emoji: '☕', label: 'Kahawa' },
  { id: 'elephant', emoji: '🐘', label: 'Tembo' },
  { id: 'tea', emoji: '🍃', label: 'Kericho' },
  { id: 'giraffe', emoji: '🦒', label: 'Twiga' },
  { id: 'shield', emoji: '🛡️', label: 'Ngao' },
];

const INDUSTRIES = [
  'Agriculture & Agribusiness',
  'Technology & Digital Services',
  'Transport & Logistics (Matatu/Boda)',
  'Retail & Wholesale (Duka)',
  'Creative & Entertainment',
  'Education',
  'Healthcare',
  'Public Service',
  'Hospitality & Tourism',
  'Other'
];

const Profile: React.FC<ProfileProps> = ({ profile, onSave, lang, onLangToggle }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ 
    ...profile,
    isPasswordEnabled: profile.isPasswordEnabled || false,
    password: profile.password || '',
    insurancePremium: profile.insurancePremium || 0,
    mortgageInterest: profile.mortgageInterest || 0
  });
  const [isSaved, setIsSaved] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const t = TRANSLATIONS[lang];

  const handleSave = () => {
    onSave(editedProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const addGoal = () => {
    if (newGoal.trim() && !editedProfile.financialGoals.includes(newGoal.trim())) {
      setEditedProfile({
        ...editedProfile,
        financialGoals: [...editedProfile.financialGoals, newGoal.trim()]
      });
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setEditedProfile({
      ...editedProfile,
      financialGoals: editedProfile.financialGoals.filter(g => g !== goal)
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* 1. Language & Accessibility */}
      <section className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex items-center justify-between">
         <span className="text-xs font-black uppercase tracking-widest text-gray-400 px-4">{t.language}</span>
         <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button 
              onClick={() => onLangToggle('en')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              English
            </button>
            <button 
              onClick={() => onLangToggle('sw')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'sw' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              Kiswahili
            </button>
         </div>
      </section>

      {/* 2. Personalized Avatar Selection */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-24 h-24 text-emerald-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
        </div>
        <div className="w-32 h-32 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-6xl mb-6 shadow-inner border-4 border-white relative z-10">
          {KENYAN_AVATARS.find(a => a.id === editedProfile.avatar)?.emoji || '🦁'}
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Select Your Citizen Spirit</p>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
          {KENYAN_AVATARS.map((av) => (
            <button 
              key={av.id}
              onClick={() => setEditedProfile({ ...editedProfile, avatar: av.id })}
              className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${editedProfile.avatar === av.id ? 'bg-emerald-800 text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-emerald-50'}`}
            >
              <span className="text-2xl">{av.emoji}</span>
              <span className="text-[9px] font-black uppercase mt-1">{av.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Income & Tax Details */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">Income & Tax Details</h3>
        
        <ProfileInput 
          label="Base Monthly Salary (Gross)" 
          type="number"
          value={editedProfile.monthlyIncome.toString()} 
          onChange={v => setEditedProfile({...editedProfile, monthlyIncome: Number(v)})} 
          placeholder="e.g. 50000"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileInput 
            label="Monthly Insurance Premium" 
            type="number"
            value={(editedProfile.insurancePremium || 0).toString()} 
            onChange={v => setEditedProfile({...editedProfile, insurancePremium: Number(v)})} 
            placeholder="For 15% relief claim"
          />
          <ProfileInput 
            label="Monthly Mortgage Interest" 
            type="number"
            value={(editedProfile.mortgageInterest || 0).toString()} 
            onChange={v => setEditedProfile({...editedProfile, mortgageInterest: Number(v)})} 
            placeholder="Max 300k claim p.a."
          />
        </div>
      </section>

      {/* 4. Work & Identity */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">Identification & Profession</h3>
        
        <ProfileInput 
          label="Full Name" 
          value={editedProfile.fullName} 
          onChange={v => setEditedProfile({...editedProfile, fullName: v})} 
          placeholder="e.g. Omari Otieno"
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Industry / Sector</label>
          <select 
            value={editedProfile.industry}
            onChange={e => setEditedProfile({...editedProfile, industry: e.target.value})}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-800 outline-none text-sm font-bold text-gray-900 appearance-none shadow-sm"
          >
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Employment Type</label>
          <select 
            value={editedProfile.employmentType}
            onChange={e => setEditedProfile({...editedProfile, employmentType: e.target.value as EmploymentType})}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-800 outline-none text-sm font-bold text-gray-900 appearance-none shadow-sm"
          >
            {Object.values(EmploymentType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </section>

      {/* 5. Wealth Milestones */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-2">Wealth Milestones</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {editedProfile.financialGoals.map(goal => (
            <span key={goal} className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-2 border border-emerald-100 group">
              {goal}
              <button onClick={() => removeGoal(goal)} className="text-emerald-400 hover:text-red-500 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
          {editedProfile.financialGoals.length === 0 && (
            <p className="text-gray-300 text-xs italic p-2">No goals set yet. What are you building towards?</p>
          )}
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="e.g. Buy Land in Kajiado"
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-800 outline-none text-sm font-bold text-gray-900"
          />
          <button 
            onClick={addGoal}
            className="bg-black text-white px-6 rounded-2xl font-black text-xl hover:bg-emerald-800 transition-all active:scale-95"
          >
            +
          </button>
        </div>
      </section>

      {/* 6. Security Settings */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Security Lock</h3>
          <div 
            onClick={() => setEditedProfile({...editedProfile, isPasswordEnabled: !editedProfile.isPasswordEnabled})}
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${editedProfile.isPasswordEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${editedProfile.isPasswordEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>

        {editedProfile.isPasswordEnabled && (
          <div className="animate-in slide-in-from-top-2 duration-300">
             <ProfileInput 
               label="Set Access PIN / Password" 
               type="password" 
               value={editedProfile.password || ''} 
               onChange={v => setEditedProfile({...editedProfile, password: v})} 
               placeholder="Enter secure code"
             />
             <p className="text-[10px] text-gray-400 mt-2 italic px-2">This code will be required when opening the app on this device.</p>
          </div>
        )}
      </section>

      {/* 7. KRA & Compliance */}
      <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Tax Registration</h3>
        <ProfileInput 
          label="KRA PIN (Local Only)" 
          placeholder="A012345678X" 
          value={editedProfile.kraPin || ''} 
          onChange={v => setEditedProfile({...editedProfile, kraPin: v.toUpperCase()})} 
        />
      </section>

      {/* Action Buttons */}
      <div className="max-w-md mx-auto w-full px-2 space-y-4">
        <button 
          onClick={handleSave}
          className={`w-full py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${isSaved ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500' : 'bg-black text-white hover:bg-gray-900 border-b-4 border-emerald-800'}`}
        >
          {isSaved ? 'Details Secured! 🇰🇪' : 'Save Profile Changes'}
        </button>
      </div>

      {/* Trust Footer */}
      <div className="bg-emerald-50/50 p-8 rounded-[40px] border border-emerald-100 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0">🛡️</div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-emerald-900 tracking-widest mb-1">Your Trust Charter</h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              Information updated here is encrypted and used only for personalized tax insights. We never share your goals or income with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-800 outline-none text-sm font-bold text-gray-900 shadow-sm transition-all"
    />
  </div>
);

export default Profile;
