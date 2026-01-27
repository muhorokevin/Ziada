
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

// Always use process.env.API_KEY directly and use named parameter in constructor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReceipt = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "Extract transaction details from this Kenyan receipt. Return JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          date: { type: Type.STRING },
          vatAmount: { type: Type.NUMBER },
          category: { 
            type: Type.STRING, 
            description: "Categorize into: Food, Transport, Rent, Utilities, Business, Medical, Education, Church, Personal" 
          },
          isBusiness: { type: Type.BOOLEAN }
        },
        required: ["merchant", "amount", "date", "category"]
      }
    }
  });

  // Use the .text property directly
  return JSON.parse(response.text || '{}');
};

export const parseMpesaMessage = async (text: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this Kenyan M-Pesa SMS and extract structured data. It could be a P2P transfer, Buy Goods (Till), Paybill, or withdrawal.
    
    Format Example 1: "UAR594TQV1 Confirmed. Ksh1,000.00 sent to Safaricom Post Paid for account 0728999073 on 27/1/26 at 2:11 PM"
    Expected: { "amount": 1000, "merchant": "Safaricom Post Paid", "date": "2026-01-27", "transactionType": "expense", "category": "Utilities", "referenceId": "UAR594TQV1" }

    Format Example 2: "RBS1234567 Confirmed. Ksh2,500.00 paid to NAIVAS SUPERMARKET on 15/2/25"
    Expected: { "amount": 2500, "merchant": "NAIVAS SUPERMARKET", "date": "2025-02-15", "transactionType": "expense", "category": "Food & Groceries", "referenceId": "RBS1234567" }

    Text to parse: "${text}"
    
    Return JSON with fields: amount (number), merchant (string), date (string as YYYY-MM-DD), transactionType (expense/income), category (one of the app's categories), referenceId (string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          merchant: { type: Type.STRING },
          date: { type: Type.STRING },
          transactionType: { type: Type.STRING },
          category: { type: Type.STRING },
          referenceId: { type: Type.STRING }
        }
      }
    }
  });

  // Use the .text property directly
  return JSON.parse(response.text || '{}');
};