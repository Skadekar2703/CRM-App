export interface WebSupplier {
  id: string;
  partyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  paymentTerms: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export const INITIAL_WEB_SUPPLIERS: WebSupplier[] = [];
