export interface UdhaariCustomer {
  uid: string;
  name: string;
  mobile: string;
  area: string;
  category: string;
  cibilStatus: 'Good' | 'Average' | 'Bad';
  baki: number;
  jama: number;
  outstanding: number;
  balance: number;
  balanceType: 'Baki' | 'Jama';
  creditLimit: number;
  creditBlocked?: boolean;
  lastTxnDate: string;
  status: 'Active' | 'Inactive';
  photoUrl?: string | null;
}

export interface UdhaariTransaction {
  id: string;
  customerUid: string;
  customerName?: string;
  type: 'Baki' | 'Jama';
  amount: number;
  date: string;
  notes: string;
}

export const INITIAL_UDHAARI_CUSTOMERS: UdhaariCustomer[] = [];
