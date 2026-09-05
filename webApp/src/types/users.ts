export interface WebUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'Admin' | 'User';
  status: 'Active' | 'Disabled';
  createdAt: string;
}

export const INITIAL_WEB_USERS: WebUser[] = [];
