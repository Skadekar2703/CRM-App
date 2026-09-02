export interface WebNote {
  id: string;
  title: string;
  content: string;
  isUrgent: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const INITIAL_WEB_NOTES: WebNote[] = [];
