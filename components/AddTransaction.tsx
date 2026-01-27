
import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import ReceiptScanner from './ReceiptScanner';
import MpesaInput from './MpesaInput';
import { CURRENCY, TRANSLATIONS } from '../constants';

interface AddTransactionProps {
  onAdd: (t: Transaction) => void;
  lang: 'en' | 'sw';
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd, lang }) => {
  const t = TRANSLATIONS[lang];
  const [method, setMethod] = useState<'receipt' | 'mpesa' | 'manual'>('manual');
  const [manualType, setManualType] = useState<'expense' | 'income'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    category: Category.OTHER,
    date: new Date().toISOString().split('T')[0],
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.merchant) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      date: formData.date,
      merchant: formData.merchant,
      amount: Number(formData.amount),
      category: formData.category,
      type: manualType,
      source: 'manual',
    });
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-12 animate-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      {/* Method Selection - Responsive Tabs */}
      <div className="flex bg-gray-200 p-1.5 rounded-[28px] sm:rounded-[36px] gap-1 shadow-inner">
        <TabBtn active={method === 'manual'} onClick={() => setMethod('manual')} label={t.quick_cash} />
        <TabBtn active={method === 'receipt'} onClick={() => setMethod('receipt')} label={t.scan_receipt} />
        <TabBtn active={method === 'mpesa'} onClick={() => setMethod('mpesa')} label="M-Pesa Sync" />
      </div>

      <div className="w-full">
        {method === 'receipt' && <ReceiptScanner onAdd={onAdd} />}
        {method === 'mpesa' && <MpesaInput onAdd={onAdd} />}

        {method === 'manual' && (
          <div className="bg-white rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
            {/* Type Selector */}
            <div className="flex justify-center mb-8 sm:mb-12 bg-gray-50 p-2 rounded-2xl border border-gray-100 max-w-sm mx-auto">
              <button 
                onClick={() => setManualType('expense')}
                className={`flex-1 py-3 px-6 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${manualType === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}
              >
                Expense
              </button>
              <button 
                onClick={() => setManualType('income')}
                className={`flex-1 py-3 px-6 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${manualType === 'income' ? 'bg-emerald-800 text-white shadow-lg' : 'text-gray-400'}`}
              >
                Income
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-6 sm:space-y-8">
              {/* Amount Field - Prominent */}
              <div className="space-y-2 text-center">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest block">
                  {manualType === 'expense' ? t.spending_total : 'Total Inflow'} ({CURRENCY})
                </label>
                <input 
                  required
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full max-w-xs mx-auto block p-5 bg-transparent border-b-4 border-gray-100 focus:border-emerald-700 outline-none text-4xl sm:text-5xl font-black text-gray-900 text-center transition-all"
                />
              </div>

              {/* Responsive Grid for Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest px-2">
                    {manualType === 'expense' ? 'Merchant / Recipient' : 'Payer / Source'}
                  </label>
                  <input 
                    required
                    type="text"
                    placeholder={manualType === 'expense' ? 'e.g. Mama Mboga' : 'e.g. Salary / Freelance Client'}
                    value={formData.merchant}
                    onChange={e => setFormData({...formData, merchant: e.target.value})}
                    className="w-full p-4 sm:p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest px-2">
                    {manualType === 'expense' ? 'Expense Category' : 'Income Stream'}
                  </label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                    className="w-full p-4 sm:p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-gray-800 appearance-none shadow-sm cursor-pointer"
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest px-2">Transaction Date</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-4 sm:p-5 bg-gray-50 border border-gray-100 rounded-[24px] focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-gray-800 block cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 max-w-sm mx-auto">
                <button 
                  type="submit"
                  className={`w-full py-5 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${manualType === 'expense' ? 'bg-red-600 text-white shadow-red-100 border-b-4 border-black' : 'bg-emerald-800 text-white shadow-emerald-100 border-b-4 border-black'}`}
                >
                  {manualType === 'expense' ? 'Record Matumizi' : 'Save Income Inflow'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 sm:py-4 px-2 rounded-[22px] sm:rounded-[28px] font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-white text-black shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {label}
  </button>
);

export default AddTransaction;
