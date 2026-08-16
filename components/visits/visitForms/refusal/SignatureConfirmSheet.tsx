import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignaturePad, type SignaturePadHandle } from "@/components/ui/SignaturePad";
import { Colors } from "@/theme/colors";

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  statement?: string;
  /** Saved PNG data URI (or raw base64) to show when reopening after a previous sign. */
  initialSignature?: string;
  onConfirm: (signatureData?: string) => void;
  onClose: () => void;
  colors: any;
  clearLabel?: string;
  signHereLabel?: string;
  confirmLabel?: string;
  /** Read-only mode: shows the existing signature, disables drawing/clearing,
   *  and hides the Confirm button. Used to preview an already-signed signature
   *  without allowing edits. */
  useOnly?: boolean;
}

export function SignatureConfirmSheet({
  visible,
  title,
  subtitle,
  statement,
  initialSignature,
  onConfirm,
  onClose,
  colors,
  clearLabel = "Clear",
  signHereLabel = "Sign here",
  confirmLabel = "Confirm Signature",
  useOnly = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const padRef = useRef<SignaturePadHandle>(null);
  const [signatureData, setSignatureData] = useState("");
  const [hasContent, setHasContent] = useState(false);
  const [padKey, setPadKey] = useState(0);
  // When an existing signature is provided, start by previewing it as an image.
  // The Clear button drops the preview and reveals the SignaturePad so the
  // user can draw a replacement.
  const [showImage, setShowImage] = useState<boolean>(!!initialSignature);

  useEffect(() => {
    if (visible) {
      if (initialSignature) {
        setSignatureData(initialSignature);
        setHasContent(true);
        setShowImage(true);
      } else {
        setSignatureData("");
        setHasContent(false);
        setShowImage(false);
      }
      setPadKey((k) => k + 1);
    } else {
      setSignatureData("");
      setHasContent(false);
      setShowImage(false);
    }
  }, [visible, initialSignature]);

  const handleClear = () => {
    Haptics.selectionAsync();
    if (showImage) {
      // Drop the existing preview and reveal the empty pad for re-signing.
      setShowImage(false);
      setSignatureData("");
      setHasContent(false);
      setPadKey((k) => k + 1);
      return;
    }
    padRef.current?.clear();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: `${Colors.primary}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="edit-3" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
            {statement ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 18,
                  }}
                >
                  {statement}
                </Text>
              </View>
            ) : null}

            {showImage && initialSignature ? (
              <View
                style={{
                  height: 200,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  backgroundColor: "#fff",
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri: initialSignature }}
                  resizeMode="contain"
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
            ) : useOnly ? (
              <View
                style={{
                  height: 200,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                  No signature available
                </Text>
              </View>
            ) : (
              <SignaturePad
                ref={padRef}
                key={padKey}
                colors={colors}
                initialDataUrl={undefined}
                placeholderLabel={signHereLabel}
                useOnly={false}
                onChange={(d, has) => {
                  setSignatureData(d);
                  setHasContent(has);
                }}
              />
            )}

            {!useOnly && (showImage || hasContent) && (
              <Pressable
                onPress={handleClear}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  alignSelf: "flex-end",
                  marginTop: -6,
                }}
              >
                <Feather name="refresh-ccw" size={12} color={colors.textSecondary} />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary }}>
                  {clearLabel}
                </Text>
              </Pressable>
            )}

            {(() => {
              // Confirm rules:
              //   • useOnly   → always enabled regardless of image; click only
              //                 updates form data (no upload, no draw required)
              //   • showImage → previewing the existing signature; submits initialSignature
              //   • otherwise → user is drawing on the pad; needs hasContent
              const enabled = useOnly
                ? true
                : showImage
                  ? !!initialSignature
                  : hasContent;
              const payload = showImage || useOnly ? (initialSignature ?? "") : signatureData;
              return (
                <Pressable
                  onPress={() => {
                    if (!enabled) return;
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onConfirm(payload);
                  }}
                  style={{
                    backgroundColor: enabled ? "#22C55E" : colors.border,
                    borderRadius: 13,
                    paddingVertical: 14,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <Feather name="check-circle" size={16} color={enabled ? "#fff" : colors.textSecondary} />
                  <Text
                    style={{
                      color: enabled ? "#fff" : colors.textSecondary,
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {confirmLabel}
                  </Text>
                </Pressable>
              );
            })()}
          </View>
        </View>
      </View>
    </Modal>
  );
}
