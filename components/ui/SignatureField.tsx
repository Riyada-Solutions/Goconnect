import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { SignatureConfirmSheet } from "@/app/visits/components/visitForms/refusal/SignatureConfirmSheet";

export interface SignatureValue {
  signed: boolean;
  dataUrl?: string;
  signedAt?: string;
}

interface Props {
  label: string;
  value: SignatureValue;
  onChange: (v: SignatureValue) => void;
  /** Short subtitle shown under the main label in the sheet header. */
  subtitle?: string;
  /** Optional consent / verification statement shown at the top of the sheet. */
  statement?: string;
  /** Accent color for the button (e.g. "#2daaae" for Patient, "#8B5CF6" for Nurse). */
  accentColor: string;
  /** Icon used on the unsigned button. */
  iconIdle?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  clearLabel?: string;
  signHereLabel?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  signedLabel?: string;
}

/**
 * Full signature capture field — button + bottom-sheet in one.
 * Shows a tile with a signed / pending state; tapping opens the signature sheet
 * where the user draws their signature with their finger. On confirm, the signed
 * flag and base64 PNG data URL are emitted via `onChange`.
 */
export function SignatureField({
  label,
  value,
  onChange,
  subtitle,
  statement,
  accentColor,
  iconIdle = "edit-3",
  disabled,
  clearLabel = "Clear",
  signHereLabel = "Sign here",
  confirmLabel = "Confirm Signature",
  pendingLabel = "PENDING",
  signedLabel = "SIGNED",
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const signedColor = "#22C55E";
  const showSigned = value.signed;

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(true);
        }}
        disabled={disabled}
        style={{
          padding: 12,
          borderWidth: 1.5,
          borderColor: showSigned ? signedColor : accentColor,
          borderRadius: 12,
          borderStyle: showSigned ? "solid" : "dashed",
          backgroundColor: showSigned ? `${signedColor}18` : `${accentColor}15`,
          alignItems: "center",
          gap: 6,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: showSigned ? signedColor : accentColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={showSigned ? "check" : iconIdle} size={16} color="#fff" />
        </View>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 13,
            color: showSigned ? signedColor : colors.text,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
        <View
          style={{
            backgroundColor: showSigned ? signedColor : colors.border,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              color: showSigned ? "#fff" : colors.textSecondary,
              fontFamily: "Inter_700Bold",
              fontSize: 10,
            }}
          >
            {showSigned ? signedLabel : pendingLabel}
          </Text>
        </View>
      </Pressable>

      <SignatureConfirmSheet
        visible={open}
        title={label}
        subtitle={subtitle}
        statement={statement}
        clearLabel={clearLabel}
        signHereLabel={signHereLabel}
        confirmLabel={confirmLabel}
        onConfirm={(dataUrl) => {
          onChange({ signed: true, dataUrl, signedAt: new Date().toISOString() });
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        colors={colors}
      />
    </View>
  );
}
