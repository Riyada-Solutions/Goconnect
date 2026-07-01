import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";

export const PASSWORD_RULES = {
  minLength: (p: string) => p.length >= 8,
  lowercase: (p: string) => /[a-z]/.test(p),
  uppercase: (p: string) => /[A-Z]/.test(p),
  number: (p: string) => /[0-9]/.test(p),
  special: (p: string) => /[!@#$%^&*]/.test(p),
};

export function isPasswordValid(password: string): boolean {
  return Object.values(PASSWORD_RULES).every((rule) => rule(password));
}

interface Props {
  password: string;
}

export function PasswordRequirements({ password }: Props) {
  const { t } = useApp();

  if (password.length === 0) return null;

  const rules: { key: keyof typeof PASSWORD_RULES; label: string }[] = [
    { key: "minLength", label: t("reqMinLength") },
    { key: "uppercase", label: t("reqUppercase") },
    { key: "lowercase", label: t("reqLowercase") },
    { key: "number", label: t("reqNumber") },
    { key: "special", label: t("reqSpecial") },
  ];

  const left = rules.filter((_, i) => i % 2 === 0);
  const right = rules.filter((_, i) => i % 2 !== 0);

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        {left.map(({ key, label }) => (
          <RequirementRow key={key} met={PASSWORD_RULES[key](password)} label={label} />
        ))}
      </View>
      <View style={styles.column}>
        {right.map(({ key, label }) => (
          <RequirementRow key={key} met={PASSWORD_RULES[key](password)} label={label} />
        ))}
      </View>
    </View>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  const color = met ? "#22C55E" : "#9CA3AF";
  return (
    <View style={styles.row}>
      <Feather name="check-circle" size={14} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  column: {
    flex: 1,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
});
