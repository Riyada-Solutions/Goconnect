import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenBackground } from "@/components/common/ScreenBackground";
import { WebViewPanel } from "@/components/common/WebViewPanel";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";

export default function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const { colors } = useTheme();
  const { topPad } = useScreenPadding();

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScreenBackground />
      <View style={[s.headerBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {title ?? ""}
        </Text>
      </View>
      {url ? <WebViewPanel url={url} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
});
