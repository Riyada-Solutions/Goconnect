import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { DateTimeConverter } from "@/utils/datetime";

export interface AttestValue {
  signedAt?: string | null;
  signedBy?: string | number | null;
}

interface Props {
  label: string;
  value: AttestValue;
  onChange: (v: AttestValue) => void;
  /** Current employee id — stamped into `signedBy` when the user taps to attest. */
  currentUserId: string | number;
  /** Current employee name — shown once signed. */
  currentUserName?: string;
  colors: any;
  disabled?: boolean;
  tapLabel?: string;
  signedLabel?: string;
  /** Optional context line shown under the label (e.g. "on behalf of <patient name>"). */
  subtitle?: string;
}

/**
 * Lightweight "attestation" control for fields that only need `signed_at` +
 * `signed_by` (the current employee's id) — no drawn signature image. Used
 * for witness/nurse/physician/social-worker sign-offs across the Class C
 * forms. Tapping toggles signed/unsigned.
 */
export function AttestField({
  label,
  value,
  onChange,
  currentUserId,
  currentUserName,
  colors,
  disabled,
  tapLabel = "Tap to confirm",
  signedLabel = "Signed",
  subtitle,
}: Props) {
  const signed = !!value.signedAt;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (signed) {
      onChange({ signedAt: null, signedBy: null });
    } else {
      onChange({ signedAt: new Date().toISOString(), signedBy: currentUserId });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: signed ? "solid" : "dashed",
        borderColor: signed ? "#22C55E" : colors.border,
        backgroundColor: signed ? "#F0FDF4" : colors.surface,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>{label}</Text>
        {subtitle ? (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary, marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
        {signed ? (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#059669", marginTop: 2 }}>
            {signedLabel}
            {currentUserName ? ` by ${currentUserName}` : ""} •{" "}
            {DateTimeConverter.dateTime(value.signedAt)}
          </Text>
        ) : (
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            {tapLabel}
          </Text>
        )}
      </View>
      <Feather name={signed ? "check-circle" : "circle"} size={20} color={signed ? "#22C55E" : colors.textTertiary} />
    </Pressable>
  );
}
