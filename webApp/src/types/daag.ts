export interface WebStockMovement {
  id: string;
  date: string;
  direction: 'IN' | 'OUT';
  item: string;
  quantity: string;
  amount: number;
  supplier: string;
  transport: string;
  status: 'Complete' | 'Pending' | 'In Transit' | 'Cancelled';
}

export const INITIAL_WEB_DAAG_MOVEMENTS: WebStockMovement[] = [];
