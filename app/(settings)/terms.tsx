import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using CareConnect KSA, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.",
  },
  {
    title: "2. Use of Service",
    content:
      "CareConnect KSA is designed for authorized healthcare professionals only. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
  },
  {
    title: "3. Patient Data",
    content:
      "All patient data must be handled in accordance with applicable healthcare privacy laws and regulations, including Saudi healthcare data protection requirements. You must not share patient information with unauthorized parties.",
  },
  {
    title: "4. Medical Disclaimer",
    content:
      "CareConnect KSA is a healthcare management tool and does not provide medical advice. Clinical decisions remain the responsibility of qualified healthcare professionals.",
  },
  {
    title: "5. Data Security",
    content:
      "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. You use this service at your own risk.",
  },
  {
    title: "6. Modifications",
    content:
      "We reserve the right to modify these terms at any time. We will provide notice of significant changes via the application. Continued use after changes constitutes acceptance of the updated terms.",
  },
  {
    title: "7. Termination",
    content:
      "We may terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.",
  },
];

export default function TermsScreen() {
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
        <Text style={[styles.title, { color: colors.text }]}>
          {t("termsTitle")}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: botPad,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
          Last updated: January 1, 2025
        </Text>

        {TERMS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}
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
  lastUpdated: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
