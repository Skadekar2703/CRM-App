export interface WebEmployee {
  uid: string;
  name: string;
  mobile: string;
  email: string;
  role: string;
  salary: number;
  ctcYtd: number;
  udhaarBalance: number;
  joinedDate: string;
  status: 'Active' | 'Inactive';
}

export const INITIAL_WEB_EMPLOYEES: WebEmployee[] = [];
