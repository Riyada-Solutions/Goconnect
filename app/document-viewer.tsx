import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Pdf from "react-native-pdf";
import { WebView } from "react-native-webview";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ErrorState } from "@/components/common/ErrorState";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

type Params = { url: string; kind: "pdf" | "web"; title?: string };

/**
 * Full-screen viewer for lab documents: native PDF rendering for PDFs,
 * a plain WebView for anything else. No auth header is sent — these URLs
 * are often hosted by third parties (e.g. the lab company).
 */
function DocumentViewerScreen() {
  const { url, kind, title } = useLocalSearchParams<Params>();
  const { colors } = useTheme();
  const { topPad } = useScreenPadding();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setError(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
          {title ?? ""}
        </Text>
      </View>

      {error || !url ? (
        <ErrorState onRetry={url ? retry : undefined} />
      ) : kind === "pdf" ? (
        <Pdf
          key={reloadKey}
          source={{ uri: url, cache: true }}
          style={[s.fill, { backgroundColor: colors.background }]}
          trustAllCerts={false}
          enablePaging={false}
          onLoadComplete={() => setLoading(false)}
          onError={() => setError(true)}
        />
      ) : (
        <WebView
          key={reloadKey}
          source={{ uri: url }}
          style={[s.fill, { backgroundColor: colors.background }]}
          onLoadEnd={() => setLoading(false)}
          onError={() => setError(true)}
          onHttpError={() => setError(true)}
        />
      )}

      {loading && !error && url ? (
        <View style={s.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

export default function DocumentViewer() {
  return (
    <ErrorBoundary>
      <DocumentViewerScreen />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  fill: { flex: 1 },
  loader: { ...StyleSheet.absoluteFill, top: 80, alignItems: "center", justifyContent: "center" },
});
