
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
    contents: `Analyze this M-Pesa SMS and extract structured data. 
    Text: "${text}"
    Return JSON with fields: amount (number), merchant (string), date (string), transactionType (expense/income), category (one of the app's categories), referenceId (string).`,
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
