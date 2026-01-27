
export const KENYA_TAX_BANDS = [
  { upTo: 24000, rate: 0.10 },
  { upTo: 32333, rate: 0.25 },
  { upTo: 500000, rate: 0.30 },
  { upTo: 800000, rate: 0.325 },
  { upTo: Infinity, rate: 0.35 }
];

export const PERSONAL_RELIEF_MONTHLY = 2400;
export const SHIF_RATE = 0.0275; // Social Health Insurance Fund

export const CURRENCY = 'KES';

export const LOCAL_MERCHANTS = [
  'Naivas', 'Quickmart', 'Carrefour', 'Shell', 'Rubis', 'TotalEnergies', 
  'Jumia', 'KPLC', 'Zuku', 'Safaricom', 'Airtel', 'Mama Mboga', 'Matatu'
];

export const TRANSLATIONS = {
  en: {
    home: "Home",
    tax: "Tax",
    coach: "Coach",
    goals: "Goals",
    add: "Add",
    spending_total: "Monthly Spending",
    tax_insight: "KRA Tax Insight",
    refund_estimate: "Potential Refund",
    top_spend: "Top Category",
    sync_mpesa: "Sync M-Pesa",
    scan_receipt: "Scan Receipt",
    quick_cash: "Quick Cash",
    citizen: "Citizen",
    language: "Language",
    paid_tax: "Estimated Tax Paid",
    due_tax: "Tax Due or Refundable",
  },
  sw: {
    home: "Nyumbani",
    tax: "Kodi",
    coach: "Mshauri",
    goals: "Malengo",
    add: "Ongeza",
    spending_total: "Matumizi ya Mwezi",
    tax_insight: "Maelezo ya KRA",
    refund_estimate: "Pesa za Kurudishiwa",
    top_spend: "Unatumia zaidi kwa",
    sync_mpesa: "Unganisha M-Pesa",
    scan_receipt: "Piga Picha Risiti",
    quick_cash: "Andika Matumizi",
    citizen: "Mwananchi",
    language: "Lugha",
    paid_tax: "Kodi Uliyolipa",
    due_tax: "Kodi ya Kulipa au Kurudishiwa",
  }
};
