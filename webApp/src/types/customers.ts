export interface WebCustomer {
  uid: string;
  name: string;
  mobile: string;
  area: string;
  category: string;
  cibilScore: number;
  cibilStatus: 'Good' | 'Average' | 'Bad' | 'Normal';
  creditLimit: number;
  balance: number;
  balanceType: 'Baki' | 'Jama';
  baakiAmount?: number;
  jamaAmount?: number;
  lastTxnDate: string;
  status: 'Active' | 'Inactive';
}

export const INITIAL_WEB_CUSTOMERS: WebCustomer[] = [];
