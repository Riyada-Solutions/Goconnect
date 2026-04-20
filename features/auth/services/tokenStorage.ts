import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../entities";

const KEYS = {
  USER: "@careconnect/user",
  TOKEN: "@careconnect/token",
};

export const tokenStorage = {
  async saveAuth(user: User, token: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(KEYS.USER, JSON.stringify(user)),
      AsyncStorage.setItem(KEYS.TOKEN, token),
    ]);
  },

  async getAuth(): Promise<{ user: User; token: string } | null> {
    const [storedUser, storedToken] = await Promise.all([
      AsyncStorage.getItem(KEYS.USER),
      AsyncStorage.getItem(KEYS.TOKEN),
    ]);
    if (storedUser && storedToken) {
      return { user: JSON.parse(storedUser), token: storedToken };
    }
    return null;
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.USER),
      AsyncStorage.removeItem(KEYS.TOKEN),
    ]);
  },
};
