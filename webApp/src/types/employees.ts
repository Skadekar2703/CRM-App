export interface WebEmployee {
  id?: string;
  uid: string;
  name: string;
  mobile: string;
  email?: string;
  role: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  idNumber?: string;
  emergencyContact?: string;
  joinedOn: string;
  leftOn?: string;
  photoUrl?: string;
  remark?: string;
  activeDays: number;
  salary: number;
  salaryType?: 'Monthly' | 'Per Day';
  ctcYtd: number;
  udhaarBalance: number;
  status: 'Active' | 'Inactive';
}

export interface WebEmployeeTransaction {
  id: string;
  employeeId: string;
  employeeUid?: string;
  type: 'Gift' | 'Bonus' | 'Extra Payment' | 'Employee Udhaar' | 'Labour Expense' | 'Udhaar Repayment';
  amount: number;
  date: string;
  note?: string;
  createdAt?: string;
}

export const INITIAL_WEB_EMPLOYEES: WebEmployee[] = [];
