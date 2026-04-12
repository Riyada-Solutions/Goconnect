import { LoginCredentials, User } from "./entities";

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  getStoredUser(): Promise<{ user: User; token: string } | null>;
  register(data: { registerCode: string; phone: string; name: string; email: string; branch: string }): Promise<void>;
  sendOtp(email: string): Promise<void>;
  verifyOtp(code: string): Promise<boolean>;
  resetPassword(newPassword: string): Promise<void>;
}
