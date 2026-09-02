export interface WebSupplierOverview {
  supplierId: string;
  supplierName: string;
  opening: number;
  purchases: number;
  paid: number;
  returns: number;
  payable: number;
}

export interface WebSupplierLedgerEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  transactionType: string; // 'Opening Balance' | 'Purchase' | 'Payment' | 'Return'
  amount: number;
  reference?: string;
  paymentMode?: string;
  description?: string;
  runningBalance?: number;
  createdAt: string;
}

export const INITIAL_WEB_SUPPLIERS: { id: string; name: string }[] = [];
export const INITIAL_WEB_LEDGER_ENTRIES: WebSupplierLedgerEntry[] = [];
