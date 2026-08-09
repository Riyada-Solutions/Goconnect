import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CheckOutConfirmModal({ visible, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.checkoutOverlay}>
        <View style={s.checkoutCard}>
          <View style={s.checkoutIconWrap}>
            <Text style={s.checkoutIconText}>!</Text>
          </View>
          <Text style={s.checkoutTitle}>
            Are you sure you want to check out this Visit?
          </Text>
          <View style={s.checkoutBtns}>
            <Pressable
              style={[s.checkoutConfirmBtn, { backgroundColor: Colors.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onConfirm();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.checkoutBtnText}>Check Out</Text>
              )}
            </Pressable>
            <Pressable
              style={[s.checkoutCancelBtn, { backgroundColor: "#EF4444", opacity: loading ? 0.7 : 1 }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={s.checkoutBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
