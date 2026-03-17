
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, FunctionDeclaration, Type, LiveServerMessage } from '@google/genai';
import { Transaction, UserProfile, ExpenseCategory, IncomeCategory, Category } from '../types';

// Manual implementation of encode/decode for the Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface VoiceCoachProps {
  transactions: Transaction[];
  profile?: UserProfile;
  onAddTransaction: (t: Transaction) => void;
}

const VoiceCoach: React.FC<VoiceCoachProps> = ({ transactions, profile, onAddTransaction }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [lastAdded, setLastAdded] = useState<{ merchant: string, amount: number } | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const combinedCategories = [...Object.values(ExpenseCategory), ...Object.values(IncomeCategory)];

  const addTransactionFn: FunctionDeclaration = {
    name: 'addTransaction',
    parameters: {
      type: Type.OBJECT,
      description: 'Add a new financial transaction (expense or income) to the user tracker.',
      properties: {
        merchant: { type: Type.STRING, description: 'The merchant or source of income (e.g., Naivas, Upwork, Mama Mboga).' },
        amount: { type: Type.NUMBER, description: 'The amount in KES.' },
        type: { type: Type.STRING, enum: ['expense', 'income'], description: 'Whether this is an expense or income.' },
        category: { 
          type: Type.STRING, 
          enum: combinedCategories, 
          description: 'The category of the transaction. Use appropriate ones for expense vs income.' 
        },
      },
      required: ['merchant', 'amount', 'type', 'category'],
    },
  };

  const startCoaching = async () => {
    setStatus('connecting');
    setIsActive(true);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      alert("GEMINI_API_KEY is not set. Please configure it in your environment.");
      setStatus('idle');
      setIsActive(false);
      return;
    }
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmData = new Uint8Array(int16.buffer);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { 
                    data: encode(pcmData), 
                    mimeType: 'audio/pcm;rate=16000' 
                  }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall && message.toolCall.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'addTransaction') {
                  const args = fc.args as any;
                  const newTransaction: Transaction = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString().split('T')[0],
                    merchant: args.merchant,
                    amount: args.amount,
                    category: args.category as Category,
                    type: args.type as 'expense' | 'income',
                    source: 'manual'
                  };
                  onAddTransaction(newTransaction);
                  setLastAdded({ merchant: args.merchant, amount: args.amount });
                  setTimeout(() => setLastAdded(null), 5000);

                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Transaction recorded successfully." },
                      }
                    });
                  });
                }
              }
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime,
              );
              
              const audioBuffer = await decodeAudioData(
                decode(audioData),
                outputCtx,
                24000,
                1,
              );
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              
              source.onended = () => {
                if (outputCtx.currentTime >= nextStartTimeRef.current - 0.1) {
                    setStatus('listening');
                }
              };
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Live API Error:', e);
            setStatus('idle');
          },
          onclose: () => {
            setIsActive(false);
            setStatus('idle');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [addTransactionFn] }],
          systemInstruction: `You are Akiba AI Financial Coach. Help the user manage their Kenyan finances. 
          Use Kenyan context (KES, Naivas, M-Pesa). Talk about tax returns, KRA, and budgeting.
          
          You can help the user add transactions quickly. If they say something like "I spent 200 on lunch at Mama Mboga", use the addTransaction tool.
          
          User Profile:
          - Name: ${profile?.fullName || 'Valued User'}
          - Employment: ${profile?.employmentType || 'Unknown'}
          - Industry: ${profile?.industry || 'Unknown'}
          - Goals: ${profile?.financialGoals.join(', ') || 'None set'}
          
          User recent transactions: ${JSON.stringify(transactions.slice(0, 5))}. 
          
          Keep responses short, human-like, and encouraging. Greet them by name occasionally.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('idle');
      setIsActive(false);
    }
  };

  const stopCoaching = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    setIsActive(false);
    setStatus('idle');
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 min-h-[60vh]">
      <div className="text-center max-w-xs px-4">
        <h2 className="text-3xl font-black text-black uppercase tracking-tighter">AI Money Coach</h2>
        <p className="text-gray-500 text-xs mt-3 font-bold uppercase tracking-widest leading-relaxed">Add transactions by voice or ask for financial advice.</p>
      </div>

      <div className="relative">
        {lastAdded && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 w-max animate-bounce border-2 border-emerald-500">
            <span className="text-xl">✅</span>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Added!</p>
              <p className="text-xs font-bold text-emerald-400">KES {lastAdded.amount} @ {lastAdded.merchant}</p>
            </div>
          </div>
        )}

        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 border-8 ${
          status === 'speaking' ? 'border-red-600 bg-red-50 scale-105 shadow-2xl' : 
          status === 'listening' ? 'border-emerald-700 bg-emerald-50 scale-100 shadow-xl shadow-emerald-100' : 
          'border-black bg-white shadow-inner'
        }`}>
          {status === 'speaking' ? (
             <div className="flex gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-10 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
             </div>
          ) : (
            <svg className={`w-20 h-20 ${status === 'listening' ? 'text-emerald-700' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V7a3 3 0 013-3z" />
            </svg>
          )}
        </div>
        
        {status === 'listening' && (
          <div className="absolute inset-0 rounded-full border-4 border-emerald-700 animate-ping opacity-30"></div>
        )}
      </div>

      <div className="text-center w-full px-8">
        <p className="text-black font-black mb-6 uppercase tracking-[0.3em] text-[10px]">
          {status === 'connecting' ? 'Connecting to AI...' : status === 'listening' ? 'I am listening...' : status === 'speaking' ? 'Coach is talking...' : 'Ready to Start'}
        </p>
        
        {!isActive ? (
          <button 
            onClick={startCoaching}
            className="w-full bg-emerald-800 text-white py-5 rounded-[32px] font-black shadow-2xl hover:bg-emerald-900 transition-all active:scale-95 uppercase tracking-widest text-sm border-b-4 border-black"
          >
            Start Conversation
          </button>
        ) : (
          <button 
            onClick={stopCoaching}
            className="w-full bg-black text-white py-5 rounded-[32px] font-black shadow-md hover:bg-gray-900 transition-all uppercase tracking-widest text-sm border-b-4 border-red-600"
          >
            Stop
          </button>
        )}
      </div>

      <div className="bg-emerald-50 p-6 rounded-[32px] max-w-xs text-center border-2 border-emerald-700 mx-4">
        <p className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-2">Voice Shortcuts:</p>
        <p className="text-xs text-emerald-800 font-bold italic leading-relaxed">"I just spent 50 shillings on Boda Boda" or "I received 5000 from a gig"</p>
      </div>
    </div>
  );
};

export default VoiceCoach;
