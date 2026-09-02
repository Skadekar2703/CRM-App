export interface WebReminder {
  id: string;
  customerId?: string;
  customerName: string;
  mobile: string;
  scheduledAt: string;
  type: string;       // Call, WhatsApp, Visit, Payment Follow-up, Meeting, Other
  priority: string;   // Low, Normal, High, Urgent
  status: string;     // Pending, Done, Snoozed, Cancelled
  notes: string;
  snoozedUntil?: string;
  createdAt: string;
  isOverdue?: boolean;
}

export const INITIAL_WEB_REMINDERS: WebReminder[] = [];
