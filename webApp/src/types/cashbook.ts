export interface WebCashBookEntry {
  id: string;
  date: string;
  particulars: string;
  type: 'IN' | 'OUT';
  amount: number;
  runningBalance: number;
  sourceModule: string;
  createdAt: string;
}

export interface WebCashBookSummary {
  totalIn: number;
  totalOut: number;
  netCash: number;
  fromDate: string;
  toDate: string;
  entryCount: number;
}

export const INITIAL_WEB_CASHBOOK_ENTRIES: WebCashBookEntry[] = [];
