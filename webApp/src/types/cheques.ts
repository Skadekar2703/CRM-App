export interface Cheque {
  id: string;
  chequeNo: string;
  partyName: string;
  bankName: string;
  amount: number;
  direction: 'Inward' | 'Outward';
  issueDate: string;
  dueDate: string;
  status: 'Pending' | 'Cleared' | 'Bounced';
  notes: string;
  createdDate: string;
}

export const INITIAL_CHEQUES: Cheque[] = [];
