import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { I18nManager, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Language, translations } from "@/config/i18n";
import type { User } from "@/features/auth/entities";
import { tokenStorage } from "@/features/auth/services/tokenStorage";

export type Theme = "light" | "dark" | "system";

interface AppContextValue {
  user: User | null;
  token: string | null;
  isReady: boolean;
  language: Language;
  theme: Theme;
  isDark: boolean;
  t: (key: keyof typeof translations.en) => string;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  LANGUAGE: "@careconnect/language",
  THEME: "@careconnect/theme",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("system");
  const colorScheme = useColorScheme();
  const systemDark = colorScheme === "dark";

  useEffect(() => {
    let done = false;
    const load = async () => {
      try {
        const [authData, storedLang, storedTheme] = await Promise.all([
          tokenStorage.getAuth(),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
        ]);

        if (authData) {
          setUser(authData.user);
          setToken(authData.token);
        }
        if (storedLang) setLanguageState(storedLang as Language);
        if (storedTheme) setThemeState(storedTheme as Theme);
      } catch (_e) {}
      if (!done) { done = true; setIsReady(true); }
    };
    const safety = setTimeout(() => { if (!done) { done = true; setIsReady(true); } }, 3000);
    load();
    return () => clearTimeout(safety);
  }, []);

  const isDark =
    theme === "system" ? systemDark : theme === "dark" ? true : false;

  const t = useCallback(
    (key: keyof typeof translations.en): string => {
      const dict = translations[language] as Record<string, string>;
      return dict[key] ?? translations.en[key] ?? String(key);
    },
    [language],
  );

  const login = useCallback(async (userData: User, authToken: string) => {
    await tokenStorage.saveAuth(userData, authToken);
    setUser(userData);
    setToken(authToken);
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    setLanguageState(lang);
    const isRTL = lang === "ar";
    I18nManager.forceRTL(isRTL);
  }, []);

  const setTheme = useCallback(async (t: Theme) => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, t);
    setThemeState(t);
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      const updated = { ...user, ...data } as User;
      await tokenStorage.saveAuth(updated, token ?? updated.token);
      setUser(updated);
    },
    [user, token],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      language,
      theme,
      isDark,
      t,
      login,
      logout,
      setLanguage,
      setTheme,
      updateProfile,
    }),
    [user, token, isReady, language, theme, isDark, t, login, logout, setLanguage, setTheme, updateProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
