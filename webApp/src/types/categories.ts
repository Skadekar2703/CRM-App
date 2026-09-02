export interface Category {
  id: string;
  name: string;
  type: 'Item Category' | 'Customer Category';
  status: 'Active' | 'Inactive' | 'Archived';
  createdDate: string;
  usageCount: number;
  subText?: string;
}

export const INITIAL_CATEGORIES: Category[] = [];
