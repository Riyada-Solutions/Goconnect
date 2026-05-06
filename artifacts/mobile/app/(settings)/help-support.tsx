import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { useApp } from "@/context/AppContext";
import { useSubmitSupportMessage } from "@/hooks/useSupport";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

interface ContactCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  textColor: string;
  cardBg: string;
  borderColor: string;
}

function ContactCard({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
  textColor,
  cardBg,
  borderColor,
}: ContactCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactCard,
        { backgroundColor: cardBg, borderColor },
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={[styles.contactIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.contactSub, { color: Colors.primary }]}>
          {subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
    </Pressable>
  );
}

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const { colors, isDark } = useTheme();
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = useSubmitSupportMessage();

  const handleSend = () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      showDialog({
        variant: "error",
        title: t("helpMissingFields"),
        message: t("helpFillAllFields"),
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitMutation.mutate(
      { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
          setSubject("");
          setMessage("");
          showDialog({
            variant: "success",
            title: t("helpMessageSent"),
            message: t("helpMessageSentDescription"),
          });
        },
        onError: (err) => {
          showDialog({
            variant: "error",
            title: t("error"),
            message: err instanceof Error ? err.message : t("error"),
          });
        },
      },
    );
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);
  const inputBg = isDark ? colors.surface : "#F5F6FA";
  const isSubmitting = submitMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />

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
          {t("helpSupport")}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: botPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("helpContactUs")}
        </Text>

        <ContactCard
          icon="message-circle"
          iconColor="#25d366"
          iconBg="#ecfdf5"
          title={t("helpWhatsapp")}
          subtitle={t("helpWhatsappSub")}
          onPress={() => Linking.openURL("https://wa.me/966501234567")}
          textColor={colors.text}
          cardBg={colors.surface}
          borderColor={colors.border}
        />
        <ContactCard
          icon="facebook"
          iconColor="#1877f2"
          iconBg="#eff6ff"
          title={t("helpFacebook")}
          subtitle={t("helpFacebookSub")}
          onPress={() => Linking.openURL("https://facebook.com/goconnect")}
          textColor={colors.text}
          cardBg={colors.surface}
          borderColor={colors.border}
        />
        <ContactCard
          icon="mail"
          iconColor={Colors.primary}
          iconBg={Colors.accentLight}
          title={t("helpEmail")}
          subtitle="support@goconnect.com"
          onPress={() => Linking.openURL("mailto:support@goconnect.com")}
          textColor={colors.text}
          cardBg={colors.surface}
          borderColor={colors.border}
        />

        <Text
          style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}
        >
          {t("helpSendMessage")}
        </Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {t("helpYourName")}
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: inputBg, borderColor: colors.border },
              ]}
            >
              <Feather name="user" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("helpNamePlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {t("helpYourEmail")}
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: inputBg, borderColor: colors.border },
              ]}
            >
              <Feather name="mail" size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("helpEmailPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {t("helpSubject")}
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: inputBg, borderColor: colors.border },
              ]}
            >
              <Feather
                name="message-square"
                size={16}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("helpSubjectPlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={subject}
                onChangeText={setSubject}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {t("helpMessage")}
            </Text>
            <View
              style={[
                styles.textareaRow,
                { backgroundColor: inputBg, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.textarea, { color: colors.text }]}
                placeholder={t("helpMessagePlaceholder")}
                placeholderTextColor={colors.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSend}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: Colors.primary },
              (pressed || isSubmitting) && { opacity: 0.75 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={16} color="#fff" />
            )}
            <Text style={styles.sendBtnText}>
              {isSubmitting ? t("helpSending") : t("helpSend")}
            </Text>
          </Pressable>
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
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 10,
    gap: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  contactSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  formCard: {
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  textareaRow: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    minHeight: 100,
  },
  textarea: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    marginTop: 4,
  },
  sendBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
});
