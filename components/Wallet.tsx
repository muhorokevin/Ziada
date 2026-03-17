import React, { useState, useEffect } from 'react';
import { Wallet, WalletTransaction } from '../types';
import { CURRENCY } from '../constants';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface WalletProps {
  wallet: Wallet;
  userId: string;
}

const WalletComponent: React.FC<WalletProps> = ({ wallet, userId }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  useEffect(() => {
    const txRef = collection(db, 'users', userId, 'wallet_transactions');
    const q = query(txRef, orderBy('date', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction)));
    });
    return () => unsub();
  }, [userId]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !phoneNumber) return;
    
    setIsDepositing(true);
    setStatus({ type: 'info', msg: 'Requesting M-Pesa STK Push...' });

    // Simulate STK Push delay
    setTimeout(async () => {
      const newBalance = wallet.balance + Number(amount);
      const tx: Omit<WalletTransaction, 'id'> = {
        date: new Date().toISOString(),
        amount: Number(amount),
        type: 'deposit',
        status: 'completed',
        description: `M-Pesa Deposit from ${phoneNumber}`,
        reference: 'R' + Math.random().toString(36).substring(7).toUpperCase(),
        phoneNumber
      };

      try {
        await addDoc(collection(db, 'users', userId, 'wallet_transactions'), tx);
        await setDoc(doc(db, 'users', userId, 'wallet', 'main'), {
          ...wallet,
          balance: newBalance,
          lastUpdated: new Date().toISOString()
        });
        setStatus({ type: 'success', msg: `Successfully deposited ${CURRENCY} ${amount}` });
        setAmount('');
        setPhoneNumber('');
        setIsDepositing(false);
      } catch (err) {
        setStatus({ type: 'error', msg: 'Transaction failed. Please try again.' });
        setIsDepositing(false);
      }
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !recipient) return;
    if (Number(amount) > wallet.balance) {
      setStatus({ type: 'error', msg: 'Insufficient balance' });
      return;
    }

    setIsSending(true);
    setStatus({ type: 'info', msg: 'Processing transfer...' });

    setTimeout(async () => {
      const newBalance = wallet.balance - Number(amount);
      const tx: Omit<WalletTransaction, 'id'> = {
        date: new Date().toISOString(),
        amount: Number(amount),
        type: 'transfer',
        status: 'completed',
        description: `Sent to ${recipient}`,
        reference: 'T' + Math.random().toString(36).substring(7).toUpperCase()
      };

      try {
        await addDoc(collection(db, 'users', userId, 'wallet_transactions'), tx);
        await setDoc(doc(db, 'users', userId, 'wallet', 'main'), {
          ...wallet,
          balance: newBalance,
          lastUpdated: new Date().toISOString()
        });
        setStatus({ type: 'success', msg: `Sent ${CURRENCY} ${amount} to ${recipient}` });
        setAmount('');
        setRecipient('');
        setIsSending(false);
      } catch (err) {
        setStatus({ type: 'error', msg: 'Transfer failed' });
        setIsSending(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* BALANCE CARD */}
      <section className="bg-emerald-900 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <p className="text-emerald-300 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Virtual Savings Balance</p>
          <h2 className="text-5xl font-black tracking-tighter tabular-nums">
            {CURRENCY} {wallet.balance.toLocaleString()}
          </h2>
          <p className="text-emerald-500/60 text-[8px] font-black uppercase tracking-widest mt-4">Last Updated: {new Date(wallet.lastUpdated).toLocaleString()}</p>
        </div>
      </section>

      {status && (
        <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center ${status.type === 'success' ? 'bg-emerald-100 text-emerald-700' : status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DEPOSIT FORM */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Deposit via M-Pesa</h3>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="0712345678" 
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Amount ({CURRENCY})</label>
              <input 
                type="number" 
                placeholder="1000" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
              />
            </div>
            <button 
              disabled={isDepositing}
              className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isDepositing ? 'Processing...' : 'Deposit Now'}
            </button>
          </form>
        </div>

        {/* SEND FORM */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Send Money</h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Recipient (Name/Phone)</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Amount ({CURRENCY})</label>
              <input 
                type="number" 
                placeholder="500" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
              />
            </div>
            <button 
              disabled={isSending}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isSending ? 'Processing...' : 'Send Money'}
            </button>
          </form>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Wallet Activity</p>
        <div className="space-y-4">
          {transactions.length > 0 ? transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {tx.type === 'deposit' ? '📥' : '📤'}
                </div>
                <div>
                  <p className="font-black text-xs uppercase tracking-tight text-gray-900">{tx.description}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(tx.date).toLocaleString()} • {tx.reference}</p>
                </div>
              </div>
              <p className={`font-black text-sm tabular-nums ${tx.type === 'deposit' ? 'text-emerald-700' : 'text-red-600'}`}>
                {tx.type === 'deposit' ? '+' : '-'}{CURRENCY} {tx.amount.toLocaleString()}
              </p>
            </div>
          )) : (
            <p className="text-gray-300 italic text-sm text-center py-4">No wallet activity yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default WalletComponent;
