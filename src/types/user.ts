export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResult {
  success: boolean;
  requiresPasswordChange?: boolean;
  userId?: number;
}
