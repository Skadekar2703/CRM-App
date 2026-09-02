export interface ItemProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stockQuantity: number;
}

export interface CustomerModel {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  area?: string;
}

export interface CartItem {
  product: ItemProduct;
  quantity: number;
}

export interface SaleLineItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleTransaction {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  items: SaleLineItem[];
}

export interface SalesSummaryStats {
  todaySalesFormatted: string;
  todayCount: number;
  thisWeekSalesFormatted: string;
  thisWeekChange: string;
  thisMonthSalesFormatted: string;
  thisMonthChange: string;
}

export const INITIAL_PRODUCTS: ItemProduct[] = [];
export const INITIAL_CUSTOMERS: CustomerModel[] = [];
export const INITIAL_SALES: SaleTransaction[] = [];

export const formatCurrency = (val: number): string => {
  return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
};
