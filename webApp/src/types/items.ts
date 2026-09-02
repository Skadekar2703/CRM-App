export interface Item {
  id: string;
  name: string;
  brand: string;
  code: string;
  category: string;
  unit: string;
  lowStockAlert: number;
  salePrice: number;
  status: 'Active' | 'Low Stock' | 'Draft' | 'Inactive';
  createdDate: string;
}

export const INITIAL_ITEMS: Item[] = [];
