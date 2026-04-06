export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  registerCode: string;
  phone: string;
  name: string;
  email: string;
  branch: string;
}
