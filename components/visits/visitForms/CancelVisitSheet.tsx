import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { KeyboardAwareScrollViewCompat } from "@/components/common/KeyboardAwareScrollViewCompat";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called with the trimmed reason; the backend requires one. */
  onConfirm: (reason: string) => void;
  loading?: boolean;
  colors: any;
  t: (key: any) => string;
}

/** Asks for the reason sent to `POST /visits/{id}/cancel` (`{ reason }`). */
export function CancelVisitSheet({ visible, onClose, onConfirm, loading, colors, t }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setReason("");
      setError(null);
    }
  }, [visible]);

  const confirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError(t("cancelReasonRequired"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(trimmed);
  };

  const close = () => {
    if (!loading) onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t("cancelVisit")}
      subtitle={t("cancelVisitConfirm")}
      maxHeightRatio={0.7}
    >
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[s.formLabel, { color: colors.text }]}>
          {t("cancelReason")}
          <Text style={{ color: "#EF4444" }}> *</Text>
        </Text>
        <TextInput
          style={[
            s.formInput,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: error ? "#EF4444" : colors.border,
              minHeight: 100,
              textAlignVertical: "top",
            },
          ]}
          value={reason}
          onChangeText={(v) => {
            setReason(v);
            if (error) setError(null);
          }}
          placeholder={t("cancelVisitReasonPlaceholder")}
          placeholderTextColor={colors.textTertiary}
          multiline
          editable={!loading}
        />
        {error ? (
          <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: "#EF4444", marginTop: -4 }}>
            {error}
          </Text>
        ) : null}
        <Pressable
          style={[s.saveFlowBtn, { backgroundColor: "#EF4444", opacity: loading ? 0.6 : 1 }]}
          onPress={confirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="x-circle" size={15} color="#fff" />
          )}
          <Text style={s.mainBtnText}>{t("yesCancel")}</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </BottomSheet>
  );
}
