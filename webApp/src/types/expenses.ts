export interface WebExpense {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMode: string;
  paidTo?: string;
  description?: string;
  createdAt: string;
}

export const INITIAL_WEB_EXPENSES: WebExpense[] = [];
