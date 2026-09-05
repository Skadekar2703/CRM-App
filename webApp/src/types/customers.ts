export interface WebCustomer {
  id: string;
  customerId: string;
  customerCode: string;
  name: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  idCncNo?: string;
  photoUrl?: string | null;
  cibilStatus: 'Good' | 'Medium' | 'Low' | 'Bad';
  cibilScore?: number;
  category: string;
  categoryId?: string | null;
  creditLimit: number;
  openingBalance: number;
  taxNo?: string;
  udharWapisiDin?: number;
  address: string;
  area: string;
  areaId?: string | null;
  remark: string;
  guarantorName: string;
  guarantorMobile: string;
  baki: number;
  jama: number;
  outstanding: number;
  lastTxnDate: string;
  status: 'Active' | 'Inactive';
  creditBlocked: boolean;
}

export const CIBIL_OPTIONS: Array<'Good' | 'Medium' | 'Low' | 'Bad'> = ['Good', 'Medium', 'Low', 'Bad'];
export const CATEGORY_OPTIONS = ['Retailer', 'Customer', 'Wholesaler'];

