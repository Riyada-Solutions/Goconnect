import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CheckOutConfirmModal({ visible, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.checkoutOverlay}>
        <View style={s.checkoutCard}>
          <View style={s.checkoutIconWrap}>
            <Text style={s.checkoutIconText}>!</Text>
          </View>
          <Text style={s.checkoutTitle}>
            Are you sure you want to check out this appointment?
          </Text>
          <View style={s.checkoutBtns}>
            <Pressable
              style={[s.checkoutConfirmBtn, { backgroundColor: Colors.primary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onConfirm();
              }}
            >
              <Text style={s.checkoutBtnText}>Check Out</Text>
            </Pressable>
            <Pressable
              style={[s.checkoutCancelBtn, { backgroundColor: "#EF4444" }]}
              onPress={onCancel}
            >
              <Text style={s.checkoutBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
