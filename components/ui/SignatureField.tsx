import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

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
 * Signature capture field with three states:
 *  • Unsigned — dashed tile + "Sign here" prompt. Tap to open the pad.
 *  • Signed   — shows the captured PNG as a thumbnail with an edit icon
 *               (tap the tile to re-sign) and a clear icon (resets to unsigned
 *               so the next save submits no signature).
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
  const showSigned = value.signed && !!value.dataUrl;

  const openSheet = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {showSigned ? (
        <View
          style={{
            borderWidth: 1.5,
            borderColor: signedColor,
            borderRadius: 12,
            backgroundColor: `${signedColor}10`,
            overflow: "hidden",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {/* Header strip with label + status pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: `${signedColor}1F`,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: "Inter_700Bold",
                fontSize: 12,
                color: signedColor,
              }}
            >
              {label.replace(/\n/g, " ")}
            </Text>
            <View
              style={{
                backgroundColor: signedColor,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Inter_700Bold",
                  fontSize: 9,
                }}
              >
                {signedLabel}
              </Text>
            </View>
          </View>

          {/* Signature image preview — tap to re-sign */}
          <Pressable onPress={openSheet} disabled={disabled}>
            <Image
              source={{ uri: value.dataUrl }}
              resizeMode="contain"
              style={{ width: "100%", height: 80, backgroundColor: "#fff" }}
            />
          </Pressable>

          {/* Action row: Edit only (tap preview also re-opens the pad). */}
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: `${signedColor}33`,
            }}
          >
            <Pressable
              onPress={openSheet}
              disabled={disabled}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingVertical: 8,
              }}
            >
              <Feather name="edit-2" size={12} color={accentColor} />
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: accentColor }}>
                Edit
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={openSheet}
          disabled={disabled}
          style={{
            padding: 12,
            borderWidth: 1.5,
            borderColor: accentColor,
            borderRadius: 12,
            borderStyle: "dashed",
            backgroundColor: `${accentColor}15`,
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
              backgroundColor: accentColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={iconIdle} size={16} color="#fff" />
          </View>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 13,
              color: colors.text,
              textAlign: "center",
            }}
          >
            {label}
          </Text>
          <View
            style={{
              backgroundColor: colors.border,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>
              {pendingLabel}
            </Text>
          </View>
        </Pressable>
      )}

      <SignatureConfirmSheet
        visible={open}
        title={label}
        subtitle={subtitle}
        statement={statement}
        initialSignature={value.signed && value.dataUrl ? value.dataUrl : undefined}
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
