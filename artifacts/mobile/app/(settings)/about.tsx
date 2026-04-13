import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

export default function AboutScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t("about")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: botPad,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.hero}
        >
          <View style={styles.logoCircle}>
            <Feather name="activity" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>CareConnect KSA</Text>
          <Text style={styles.appVersion}>
            {t("version")} {t("appVersion")}
          </Text>
        </LinearGradient>

        <View style={{ width: "100%", paddingHorizontal: 16, gap: 16, paddingTop: 24 }}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("aboutApp")}
            </Text>
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {t("aboutDesc")}
            </Text>
          </Card>

          <Card>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.accentLight }]}>
                <Feather name="users" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Patient Management</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Comprehensive patient records and health tracking</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: "#EEF2FF" }]}>
                <Feather name="calendar" size={16} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Smart Scheduling</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Efficient appointment and schedule management</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: "#E8FDF5" }]}>
                <Feather name="map-pin" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Visit Tracking</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Home and clinic visit management with location tracking</Text>
              </View>
            </View>
          </Card>

          <Text style={[styles.copyright, { color: colors.textTertiary }]}>
            © 2025 CareConnect KSA. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  hero: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  appVersion: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  copyright: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
});
