import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

LogBox.ignoreLogs([
  "ms timeout exceeded",
  "timeout exceeded",
  "fontfaceobserver",
  "6000ms timeout",
]);

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SplashView } from "@/components/common/SplashView";
import { AppProvider } from "@/context/AppContext";

// ─── Suppress fontfaceobserver "timeout exceeded" errors on web ───────────────
if (Platform.OS === "web" && typeof window !== "undefined") {
  const isFontTimeout = (v: unknown): boolean => {
    if (!v) return false;
    const msg = String((v as any)?.message ?? v ?? "");
    return msg.includes("ms timeout exceeded") || msg.includes("timeout exceeded");
  };

  window.addEventListener("unhandledrejection", (e) => {
    if (isFontTimeout((e as any)?.reason)) e.preventDefault();
  }, true);

  window.addEventListener("error", (e) => {
    if (isFontTimeout(e.error) || isFontTimeout(e.message)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  const _origOnError = window.onerror;
  window.onerror = (msg, src, line, col, err) => {
    if (isFontTimeout(err) || isFontTimeout(msg) ||
        (typeof src === "string" && src.includes("fontfaceobserver"))) {
      return true;
    }
    return _origOnError ? _origOnError.call(window, msg, src, line, col, err) : false;
  };

  if (typeof globalThis !== "undefined" && (globalThis as any).ErrorUtils) {
    const EU = (globalThis as any).ErrorUtils;
    const origHandler = EU.getGlobalHandler();
    EU.setGlobalHandler((error: any, isFatal: boolean) => {
      if (isFontTimeout(error)) return;
      if (origHandler) origHandler(error, isFatal);
    });
  }
}
// ─────────────────────────────────────────────────────────────────────────────

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

// Asset references — Metro gives a URL string on web, an asset number on native
const FONT_ASSETS = {
  Inter_400Regular:  require("../assets/fonts/Inter_400Regular.ttf"),
  Inter_500Medium:   require("../assets/fonts/Inter_500Medium.ttf"),
  Inter_600SemiBold: require("../assets/fonts/Inter_600SemiBold.ttf"),
  Inter_700Bold:     require("../assets/fonts/Inter_700Bold.ttf"),
};

/**
 * Web: inject @font-face CSS directly — zero fontfaceobserver involvement.
 * On web, Metro resolves require() to a URL-like string for binary assets.
 */
function loadFontsWeb(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("care-fonts")) return; // already injected

  const rules = Object.entries(FONT_ASSETS)
    .map(
      ([name, url]) =>
        `@font-face{font-family:'${name}';src:url('${url}') format('truetype');font-display:swap;}`
    )
    .join("");

  const el = document.createElement("style");
  el.id = "care-fonts";
  el.textContent = rules;
  document.head.appendChild(el);
}

/** Native: expo-font registers fonts with the native font manager. */
async function loadFontsNative(): Promise<void> {
  await Font.loadAsync(FONT_ASSETS).catch(() => {});
}

async function loadFonts(): Promise<void> {
  if (Platform.OS === "web") {
    loadFontsWeb();
  } else {
    await loadFontsNative();
  }
}

function RootLayoutNav() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"              options={{ headerShown: false }} />
        <Stack.Screen name="biometric-unlock"  options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(auth)"            options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
        <Stack.Screen
          name="(settings)"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="notifications"           options={{ headerShown: false }} />
        <Stack.Screen name="patients/[id]"            options={{ headerShown: false }} />
        <Stack.Screen name="visits/[id]"              options={{ headerShown: false }} />
        <Stack.Screen name="lab-results/[patientId]" options={{ headerShown: false }} />
      </Stack>
      {showSplash && <SplashView onFinish={() => setShowSplash(false)} />}
    </>
  );
}

export default function RootLayout() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Absolute safety net — never block the UI for more than 3 s
    const timer = setTimeout(() => {
      if (!cancelled) {
        setFontsReady(true);
        SplashScreen.hideAsync();
      }
    }, 3000);

    loadFonts().finally(() => {
      clearTimeout(timer);
      if (!cancelled) {
        setFontsReady(true);
        SplashScreen.hideAsync();
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
