
import React, { useState } from 'react';
import { parseMultipleMpesaMessages } from '../services/geminiService';
import { Transaction, Category, ExpenseCategory, IncomeCategory } from '../types';

interface MpesaInputProps {
  onAdd: (t: Transaction) => void;
  onBulkAdd?: (ts: Transaction[]) => void;
}

const MpesaInput: React.FC<MpesaInputProps> = ({ onAdd, onBulkAdd }) => {
  const [smsText, setSmsText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePaste = async () => {
    if (!smsText.trim()) return;
    setIsAnalyzing(true);
    try {
      const results = await parseMultipleMpesaMessages(smsText);
      const newTransactions: Transaction[] = results.map((result: any) => ({
        id: result.referenceId || Math.random().toString(36).substr(2, 9),
        date: result.date || new Date().toISOString().split('T')[0],
        merchant: result.merchant || 'M-Pesa Transaction',
        amount: result.amount || 0,
        category: (result.category as Category) || (result.transactionType === 'income' ? IncomeCategory.OTHER : ExpenseCategory.OTHER),
        type: (result.transactionType === 'income' ? 'income' : 'expense'),
        source: 'mpesa'
      }));

      if (onBulkAdd) {
        onBulkAdd(newTransactions);
      } else {
        newTransactions.forEach(t => onAdd(t));
      }
      
      setSmsText('');
      alert(`${newTransactions.length} M-Pesa transactions recorded!`);
    } catch (err) {
      console.error(err);
      alert('Could not parse SMS. Please check format.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">M-Pesa Analyzer</h2>
        <p className="text-gray-500 text-sm mb-6">Paste your M-Pesa SMS messages here to automatically track spending.</p>

        <textarea 
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="e.g. OBI1234567 Confirmed. You have paid KES 2,500 to Naivas Supermarket..."
          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-700 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
        />

        <button 
          onClick={handlePaste}
          disabled={isAnalyzing || !smsText.trim()}
          className="w-full mt-4 bg-emerald-700 text-white py-4 rounded-2xl font-bold hover:bg-emerald-800 disabled:bg-gray-300 transition-colors shadow-md"
        >
          {isAnalyzing ? 'Analyzing SMS...' : 'Process SMS'}
        </button>
      </div>

      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
        <div className="flex gap-3">
          <div className="bg-emerald-700 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-bold">!</span>
          </div>
          <div>
            <h4 className="text-emerald-900 font-bold text-sm mb-1">Privacy First</h4>
            <p className="text-emerald-800 text-xs leading-relaxed font-medium">We only extract amount, merchant, and category. Your reference numbers and balance are not stored on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MpesaInput;
