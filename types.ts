
export enum ExpenseCategory {
  FOOD = 'Food & Groceries',
  TRANSPORT = 'Transport (Matatu/Boda)',
  RENT = 'Rent & Housing',
  UTILITIES = 'Utilities (Tokens/Water)',
  INTERNET = 'Internet & Airtime',
  BUSINESS = 'Business Expenses',
  MEDICAL = 'Medical & Health',
  EDUCATION = 'Education & School Fees',
  FAMILY = 'Family Support',
  CHURCH = 'Church & Tithe',
  PERSONAL = 'Personal Care',
  SHOPPING = 'Shopping & Lifestyle',
  INVESTMENTS = 'Investments',
  LOANS = 'Loan Repayments',
  CHAMA = 'Chama & Savings',
  ENTERTAINMENT = 'Entertainment',
  MPESA_CHARGES = 'M-Pesa Charges',
  OTHER = 'Other Expenses'
}

export enum IncomeCategory {
  SALARY = 'Salary',
  FREELANCE = 'Freelance/Gigs',
  BUSINESS_REVENUE = 'Business Revenue',
  GIFT = 'Gift/Support',
  RENTAL_INCOME = 'Rental Income',
  INTEREST = 'Interest & Dividends',
  OTHER = 'Other Income'
}

export type Category = ExpenseCategory | IncomeCategory;

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
  hasSeenGuide?: boolean;
}

export interface Budget {
  category: ExpenseCategory;
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
