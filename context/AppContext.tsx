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
import { I18nManager, Platform, useColorScheme } from "react-native";

import { Language, translations } from "@/config/i18n";
import {
  ACCESS_TOKEN_KEY,
  getMe,
  logout as logoutApi,
  registerDevice,
  updateMe,
} from "@/data/auth_repository";
import { clearFaceToken, getFaceToken } from "@/data/secure_storage";
import { clearQueue } from "@/data/offline_queue";
import { requestAndSavePushToken } from "@/utils/pushNotifications";
import {
  fetchAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from "@/data/app_settings_repository";
import { setUploadApiBase } from "@/data/upload_config";
import type { User } from "@/data/models/auth";
import {
  ALL_BACKEND_RULES,
  isActionAllowed,
  type BackendRuleKey,
  type RuleAction,
} from "@/data/models/rules";

const BACKEND_RULE_SET: ReadonlySet<string> = new Set(ALL_BACKEND_RULES);
import { getRules } from "@/data/rules_repository";
import { RULES_QUERY_KEY } from "@/hooks/useRules";

const FCM_TOKEN_KEY = "@goconnect/fcm_token";

async function syncDeviceWithProfile(): Promise<void> {
  try {
    // Request permission + get native FCM/APNs token, then register with server
    const fresh = await requestAndSavePushToken();
    const firebase_token = fresh ?? await AsyncStorage.getItem(FCM_TOKEN_KEY);
    const platform: "ios" | "android" =
      Platform.OS === "ios" ? "ios" : "android";
    await registerDevice({ firebase_token, platform });
  } catch {
    // non-fatal; the call will be retried on next app open
  }
}

export type Theme = "light" | "dark" | "system";

interface AppContextValue {
  user: User | null;
  token: string | null;
  isReady: boolean;
  language: Language;
  theme: Theme;
  isDark: boolean;
  /** Remote app settings (allow_register, allow_guest_mode, upload_media_url). */
  appSettings: AppSettings;
  /** Action keys the user is allowed to perform. */
  rules: Set<string>;
  /** True when `action` is in the rules list. Use this to gate buttons/screens. */
  can: (action: RuleAction | BackendRuleKey) => boolean;
  t: (key: keyof typeof translations.en) => string;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  /** Reload profile from `GET /me` (e.g. after avatar upload). */
  refreshUser: () => Promise<void>;
  /** Locally patch the user's selected system / branch (optimistic update). */
  updateWorkspaceSelection: (patch: Partial<User>) => void;
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
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [rules, setRules] = useState<Set<string>>(new Set());
  // Wildcard mode: backend returns an empty rules array for super-admin /
  // role-less accounts. Treat that as "all actions permitted" so admins can
  // exercise the app instead of being silently locked out.
  const [allowAll, setAllowAll] = useState(false);
  const colorScheme = useColorScheme();
  const systemDark = colorScheme === "dark";

  const syncRules = useCallback(async () => {
    try {
      const list = await getRules();
      setRules(new Set(list));
      setAllowAll(list.length === 0);
      queryClient.setQueryData(RULES_QUERY_KEY, list);
    } catch {
      // Leave the existing set in place; the next app open will retry.
    }
  }, [queryClient]);

  useEffect(() => {
    let done = false;
    const load = async () => {
      try {
        const [storedToken, storedLang, storedTheme, settings] = await Promise.all([
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          fetchAppSettings(),
        ]);
        setAppSettings(settings);
        if (settings.uploadMediaUrl) setUploadApiBase(settings.uploadMediaUrl);
        if (storedLang) setLanguageState(storedLang as Language);
        if (storedTheme) setThemeState(storedTheme as Theme);

        if (storedToken) {
          // When biometric auth is enabled and a face token is stored, skip
          // GET /me entirely. The stored access_token may be expired and the
          // 401 is noise. The biometric flow will call verifyFace() and then
          // login() which restores the session with a fresh token.
          const biometricEnabled = await AsyncStorage.getItem("@goconnect/biometric");
          const faceToken = biometricEnabled === "true" ? await getFaceToken() : null;
          const biometricPending = biometricEnabled === "true" && !!faceToken;

          if (!biometricPending) {
            setToken(storedToken);
            try {
              const me = await getMe();
              setUser(me);
              queryClient.setQueryData(["me"], me);
              void syncDeviceWithProfile();
              void syncRules();
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
      void syncDeviceWithProfile();
      void syncRules();
    },
    [queryClient, syncRules],
  );

  const logout = useCallback(async () => {
    clearQueue();
    await logoutApi();
    await clearFaceToken();
    setUser(null);
    setToken(null);
    setRules(new Set());
    setAllowAll(false);
    queryClient.clear();
  }, [queryClient]);

  const can = useCallback(
    (action: RuleAction | BackendRuleKey) => {
      if (allowAll) return true;
      // Backend keys (from `BackendRule.*`) hit the granted set directly.
      // FE semantic keys (snake_case `RuleAction`) resolve via the mapping.
      if (BACKEND_RULE_SET.has(action)) return rules.has(action);
      return isActionAllowed(action as RuleAction, rules);
    },
    [rules, allowAll],
  );

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

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
    queryClient.setQueryData(["me"], me);
  }, [queryClient]);

  const updateWorkspaceSelection = useCallback(
    (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        queryClient.setQueryData(["me"], next);
        return next;
      });
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      language,
      theme,
      isDark,
      appSettings,
      rules,
      can,
      t,
      login,
      logout,
      setLanguage,
      setTheme,
      updateProfile,
      refreshUser,
      updateWorkspaceSelection,
    }),
    [user, token, isReady, language, theme, isDark, appSettings, rules, can, t, login, logout, setLanguage, setTheme, updateProfile, refreshUser, updateWorkspaceSelection],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
