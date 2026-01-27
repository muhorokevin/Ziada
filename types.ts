
export enum Category {
  FOOD = 'Food & Groceries',
  TRANSPORT = 'Transport',
  RENT = 'Rent & Housing',
  UTILITIES = 'Utilities',
  BUSINESS = 'Business',
  MEDICAL = 'Medical',
  EDUCATION = 'Education',
  CHURCH = 'Church/Giving',
  PERSONAL = 'Personal/Lifestyle',
  OTHER = 'Other'
}

export enum EmploymentType {
  SALARIED = 'Salaried Employee',
  FREELANCER = 'Freelancer / Consultant',
  SME_OWNER = 'SME Owner',
  FARMER = 'Farmer',
  STUDENT = 'Student',
  OTHER = 'Other'
}

export interface UserProfile {
  fullName: string;
  employmentType: EmploymentType;
  monthlyIncome: number;
  industry: string;
  kraPin?: string;
  financialGoals: string[];
  avatar?: string;
  isPasswordEnabled?: boolean;
  password?: string;
  insurancePremium?: number;
  mortgageInterest?: number;
  hasOnboarded?: boolean;
}

export interface Budget {
  category: Category;
  weeklyLimit: number;
  monthlyLimit: number;
}

export interface SavingsChallenge {
  id: string;
  name: string;
  seedAmount: number;
  weeklyIncrement: number;
  durationWeeks: number;
  startDate: string;
  completedWeeks: number[]; // 1-indexed week numbers
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  type: 'expense' | 'income';
  source: 'mpesa' | 'receipt' | 'manual';
  vatAmount?: number;
  isBusiness?: boolean;
}

export interface TaxRelief {
  personalRelief: number;
  insuranceRelief: number;
  mortgageRelief: number;
  pensionRelief: number;
}

export interface TaxReport {
  totalIncome: number;
  totalExpenses: number;
  deductibleExpenses: number;
  estimatedTaxLiability: number;
  reliefsClaimed: number;
  refundPotential: number;
  refundScore: number;
}