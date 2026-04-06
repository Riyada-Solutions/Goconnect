import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { MOCK_PATIENTS } from "@/features/patients/services/mockPatientData";
import { useTheme } from "@/hooks/useTheme";

interface InfoRowProps {
  icon: string;
  label: string;
  value?: string;
  isDark: boolean;
  textColor: string;
  secondaryColor: string;
}

function InfoRow({
  icon,
  label,
  value,
  isDark,
  textColor,
  secondaryColor,
}: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: secondaryColor }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: textColor }]}>
          {value ?? "—"}
        </Text>
      </View>
    </View>
  );
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const patient = MOCK_PATIENTS.find((p) => String(p.id) === id);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  if (!patient) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={{ color: colors.text }}>Patient not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Top Bar */}
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
        <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
          {t("patientDetails")}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View
            style={[
              styles.heroCard,
              { backgroundColor: isDark ? Colors.dark.card : "#fff" },
            ]}
          >
            <Avatar name={patient.name} size={72} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: colors.text }]}>
                {patient.name}
              </Text>
              <Text style={[styles.heroDiagnosis, { color: colors.textSecondary }]}>
                {patient.diagnosis}
              </Text>
              <View style={styles.heroBadgeRow}>
                <StatusBadge status={patient.status} />
                {patient.bloodType && (
                  <View
                    style={[
                      styles.bloodType,
                      { backgroundColor: "#FFF1F1" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="blood-bag"
                      size={12}
                      color="#EF4444"
                    />
                    <Text style={styles.bloodTypeText}>
                      {patient.bloodType}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Personal Info */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("personalInfo")}
          </Text>
          <Card style={{ marginTop: 8 }}>
            <InfoRow
              icon="calendar"
              label={t("dob")}
              value={patient.dob}
              isDark={isDark}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <InfoRow
              icon="user"
              label={t("gender")}
              value={patient.gender}
              isDark={isDark}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />
          </Card>
        </Animated.View>

        {/* Contact Info */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("contactInfo")}
          </Text>
          <Card style={{ marginTop: 8 }}>
            <View style={styles.contactActionRow}>
              <View style={{ flex: 1 }}>
                <InfoRow
                  icon="phone"
                  label={t("phone")}
                  value={patient.phone}
                  isDark={isDark}
                  textColor={colors.text}
                  secondaryColor={colors.textSecondary}
                />
              </View>
              {patient.phone && <ActionButton type="call" value={patient.phone} />}
            </View>
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <InfoRow
              icon="mail"
              label={t("email")}
              value={patient.email}
              isDark={isDark}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.contactActionRow}>
              <View style={{ flex: 1 }}>
                <InfoRow
                  icon="map-pin"
                  label={t("address")}
                  value={patient.address}
                  isDark={isDark}
                  textColor={colors.text}
                  secondaryColor={colors.textSecondary}
                />
              </View>
              {patient.address && <ActionButton type="location" value={patient.address} />}
            </View>
          </Card>
        </Animated.View>

        {/* Medical Info */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("medicalInfo")}
          </Text>
          <Card style={{ marginTop: 8 }}>
            <InfoRow
              icon="activity"
              label={t("diagnosis")}
              value={patient.diagnosis}
              isDark={isDark}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <InfoRow
              icon="calendar"
              label={t("lastVisit")}
              value={patient.lastVisit}
              isDark={isDark}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />
          </Card>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={styles.actions}
        >
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const query = encodeURIComponent(patient.address ?? "");
              const url = Platform.select({
                ios: `maps:?q=${query}`,
                android: `geo:0,0?q=${query}`,
                default: `https://maps.google.com/?q=${query}`,
              })!;
              Linking.canOpenURL(url).then((ok) =>
                ok
                  ? Linking.openURL(url)
                  : Linking.openURL(`https://maps.google.com/?q=${query}`),
              );
            }}
          >
            <Feather name="map-pin" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Location</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const url = `tel:${(patient.phone ?? "").replace(/\s/g, "")}`;
              Linking.canOpenURL(url).then((ok) =>
                ok ? Linking.openURL(url) : Alert.alert("Call", patient.phone),
              );
            }}
          >
            <Feather name="phone-call" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Call</Text>
          </Pressable>
        </Animated.View>
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
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  heroDiagnosis: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  bloodType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bloodTypeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#DC2626",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  contactActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    marginLeft: 44,
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 24,
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
