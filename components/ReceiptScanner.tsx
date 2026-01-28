
import React, { useState, useRef } from 'react';
import { analyzeReceipt } from '../services/geminiService';
import { Transaction, Category, ExpenseCategory } from '../types';

interface ReceiptScannerProps {
  onAdd: (t: Transaction) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onAdd }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreview(reader.result as string);
      setIsScanning(true);
      setError(null);

      try {
        const result = await analyzeReceipt(base64);
        const newTransaction: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          date: result.date || new Date().toISOString().split('T')[0],
          merchant: result.merchant || 'Unknown Merchant',
          amount: result.amount || 0,
          // Fixed: Use ExpenseCategory.OTHER instead of Category.OTHER
          category: (result.category as Category) || ExpenseCategory.OTHER,
          type: 'expense',
          source: 'receipt',
          vatAmount: result.vatAmount,
          isBusiness: result.isBusiness
        };
        onAdd(newTransaction);
        setIsScanning(false);
        setPreview(null);
      } catch (err) {
        console.error(err);
        setError('Failed to analyze. Ensure receipt is clear.');
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-10 h-10 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Receipt Scanner</h2>
        <p className="text-gray-400 text-xs font-medium mt-3 px-4">Place receipt on a flat surface. Our AI identifies Merchant & VAT automatically.</p>
        
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full mt-8 bg-emerald-700 text-white py-5 rounded-[28px] font-black uppercase tracking-widest text-sm hover:bg-emerald-800 disabled:bg-gray-200 transition-all shadow-xl shadow-emerald-100 active:scale-95"
        >
          {isScanning ? 'Extracting Data...' : '📸 Capture Receipt'}
        </button>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-2xl border border-red-100">⚠️ {error}</div>}
      </div>

      {isScanning && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-emerald-700/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest animate-pulse">Running OCR & Tax Analysis</p>
        </div>
      )}

      {preview && !isScanning && (
        <div className="rounded-[32px] overflow-hidden border-4 border-white shadow-2xl relative">
          <div className="absolute inset-0 bg-emerald-700/10 mix-blend-overlay"></div>
          <img src={preview} alt="Receipt Preview" className="w-full h-auto" />
          <div className="absolute top-4 right-4 bg-emerald-700 text-white p-2 rounded-full shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100/50">
        <h4 className="text-emerald-900 font-black text-xs uppercase tracking-wider mb-2">Did you know?</h4>
        <p className="text-emerald-700/80 text-[11px] font-medium leading-relaxed">Freelancers can claim up to 100% of business-related expenses. Scanning keeps your documents audit-ready for KRA.</p>
      </div>
    </div>
  );
};

export default ReceiptScanner;
