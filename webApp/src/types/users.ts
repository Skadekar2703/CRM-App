export interface WebUser {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'User';
  createdAt: string;
}

export const INITIAL_WEB_USERS: WebUser[] = [];
