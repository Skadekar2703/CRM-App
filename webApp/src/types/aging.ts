export interface WebAgingCustomer {
  uid: string;
  customerName: string;
  mobile: string;
  cibilStatus: 'GOOD' | 'AVERAGE' | 'BAD';
  balance: number;
  ageDays: number;
  agingBucket: string;
}

export interface WebAgingReportSummary {
  bucket0to30Total: number;
  bucket31to60Total: number;
  bucket61to90Total: number;
  bucket90PlusTotal: number;
  totalOutstanding: number;
  customerCount: number;
}

export const INITIAL_WEB_AGING_CUSTOMERS: WebAgingCustomer[] = [];
