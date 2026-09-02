export interface WebPLStatementItem {
  label: string;
  amount: number;
  type: 'INCOME' | 'COST' | 'NET';
  isHighlight?: boolean;
}

export interface WebCostProfitBreakdownData {
  purchases: number;
  expenses: number;
  salaries: number;
  netProfit: number;
}

export interface WebProfitLossReport {
  fromDate: string;
  toDate: string;
  revenue: number;
  purchases: number;
  expenses: number;
  salaries: number;
  expensesPlusSalaries: number;
  netProfit: number;
  isLoss: boolean;
  statementItems: WebPLStatementItem[];
  breakdown: WebCostProfitBreakdownData;
}
