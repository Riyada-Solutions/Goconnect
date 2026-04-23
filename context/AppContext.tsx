import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { I18nManager, useColorScheme } from "react-native";

import { Language, translations } from "@/config/i18n";
import {
  ACCESS_TOKEN_KEY,
  getMe,
  logout as logoutApi,
  updateMe,
} from "@/data/auth_repository";
import type { User } from "@/data/models/auth";

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
  LANGUAGE: "@goconnect/language",
  THEME: "@goconnect/theme",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
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
        const [storedToken, storedLang, storedTheme] = await Promise.all([
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
        ]);
        if (storedLang) setLanguageState(storedLang as Language);
        if (storedTheme) setThemeState(storedTheme as Theme);

        if (storedToken) {
          setToken(storedToken);
          try {
            const me = await getMe();
            setUser(me);
            queryClient.setQueryData(["me"], me);
          } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403 || status === 404) {
              await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
              setToken(null);
              setUser(null);
              queryClient.clear();
            }
          }
        }
      } catch (_e) {}
      if (!done) {
        done = true;
        setIsReady(true);
      }
    };
    const safety = setTimeout(() => {
      if (!done) {
        done = true;
        setIsReady(true);
      }
    }, 3000);
    load();
    return () => clearTimeout(safety);
  }, [queryClient]);

  const isDark =
    theme === "system" ? systemDark : theme === "dark" ? true : false;

  const t = useCallback(
    (key: keyof typeof translations.en): string => {
      const dict = translations[language] as Record<string, string>;
      return dict[key] ?? translations.en[key] ?? String(key);
    },
    [language],
  );

  const login = useCallback(
    async (userData: User, authToken: string) => {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, authToken);
      setUser(userData);
      setToken(authToken);
      queryClient.setQueryData(["me"], userData);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const setLanguage = useCallback(async (lang: Language) => {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    setLanguageState(lang);
    const isRTL = lang === "ar";
    I18nManager.forceRTL(isRTL);
  }, []);

  const setTheme = useCallback(async (next: Theme) => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, next);
    setThemeState(next);
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      if (!user) return;
      const updated = await updateMe({
        name: data.name ?? user.name,
        phone: data.phone ?? user.phone ?? "",
      });
      setUser(updated);
      queryClient.setQueryData(["me"], updated);
    },
    [user, queryClient],
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
