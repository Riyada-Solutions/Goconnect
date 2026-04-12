import { LoginCredentials, User } from "../entities";
import { IAuthRepository } from "../repository";
import { tokenStorage } from "./tokenStorage";

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await new Promise((r) => setTimeout(r, 1200));

    if (credentials.username === "super-admin" && credentials.password === "Admin_123456") {
      const user: User = {
        id: 1,
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@careconnect.sa",
        role: "Super Admin",
        token: "mock-token-xyz",
      };
      const token = "mock-token-xyz";
      await tokenStorage.saveAuth(user, token);
      return { user, token };
    }

    throw new Error("Invalid credentials");
  }

  async logout(): Promise<void> {
    await tokenStorage.clearAuth();
  }

  async getStoredUser(): Promise<{ user: User; token: string } | null> {
    return tokenStorage.getAuth();
  }

  async register(_data: { registerCode: string; phone: string; name: string; email: string; branch: string }): Promise<void> {
    await new Promise((r) => setTimeout(r, 800));
  }

  async sendOtp(_email: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 800));
  }

  async verifyOtp(_code: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 800));
    return true;
  }

  async resetPassword(_newPassword: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 900));
  }
}

export const authRepository = new AuthRepository();
