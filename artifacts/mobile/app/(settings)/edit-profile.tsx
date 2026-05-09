import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

export default function EditProfileScreen() {
  const { user, updateProfile, t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const handleSave = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProfile({ name, email });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("editProfile")}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Update your information</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveHeaderBtn, { backgroundColor: Colors.primary, opacity: saving ? 0.7 : 1 }]}
        >
          <Text style={styles.saveHeaderText}>{saving ? "..." : t("save")}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar section */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={40} color={Colors.primary} />
          </View>
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={[styles.changePhotoBtn, { backgroundColor: Colors.pastel.teal }]}
          >
            <Feather name="camera" size={14} color={Colors.primary} />
            <Text style={[styles.changePhotoText, { color: Colors.primary }]}>Change Photo</Text>
          </Pressable>
        </Animated.View>

        {/* Fields card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PERSONAL INFORMATION</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Name */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t("fullName")}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="user" size={16} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t("email")}</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="mail" size={16} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            {/* Role (read-only) */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t("role")}</Text>
              <View style={[styles.inputRow, { borderColor: colors.borderLight, backgroundColor: colors.borderLight, opacity: 0.8 }]}>
                <Feather name="shield" size={16} color={colors.textTertiary} />
                <Text style={[styles.input, { color: colors.textSecondary }]}>{user?.role}</Text>
              </View>
              <Text style={[styles.hint, { color: colors.textTertiary }]}>Role cannot be changed</Text>
            </View>
          </View>
        </Animated.View>

        {/* Save button */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: Colors.primary, opacity: saving ? 0.7 : pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : t("save")}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 20, paddingBottom: 8, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  saveHeaderBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, marginTop: 4,
  },
  saveHeaderText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  avatarSection: { alignItems: "center", gap: 12, paddingVertical: 8 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.pastel.teal,
    alignItems: "center", justifyContent: "center",
  },
  changePhotoBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, gap: 6,
  },
  changePhotoText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  card: {
    borderRadius: 16, paddingHorizontal: 16,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  fieldWrap: { paddingVertical: 14, gap: 8 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 12, gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, gap: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
