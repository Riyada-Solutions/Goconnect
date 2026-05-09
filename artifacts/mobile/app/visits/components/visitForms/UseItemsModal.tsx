import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Colors } from "@/theme/colors";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import type { InventoryItem } from "@/data/models/visit";

import { visitDetailStyles as s } from "../../visit-detail.styles";

interface Props {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUse: (qty: number, notes: string) => void;
  colors: any;
}

export function UseItemsModal({ visible, item, onClose, onUse, colors }: Props) {
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const { dialogProps: modalDialogProps, show: showDialog } = useFeedbackDialog();

  if (!item) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[s.modalHeader, { backgroundColor: Colors.primary }]}>
              <MaterialCommunityIcons name="package-variant" size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={s.modalHeaderTitle}>Use Items from Patient Inventory</Text>
                <Text style={s.modalHeaderSub}>
                  Adjust usage and inventory will be updated automatically
                </Text>
              </View>
              <Pressable onPress={onClose}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={{ padding: 16 }} contentContainerStyle={{ gap: 16 }}>
              <View style={s.modalItemRow}>
                <View style={[s.modalItemBox, { borderColor: colors.border }]}>
                  <Text style={[s.modalItemLabel, { color: colors.textSecondary }]}>ITEM</Text>
                  <Text style={[s.modalItemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[s.modalItemCode, { color: colors.textTertiary }]}>
                    # {item.itemNumber}
                  </Text>
                </View>
                <View style={[s.modalItemBox, { borderColor: Colors.primary }]}>
                  <Text style={[s.modalItemLabel, { color: Colors.primary }]}>
                    AVAILABLE QUANTITY
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[s.qtyBadge, { backgroundColor: `${Colors.primary}20` }]}>
                      <Text style={{ color: Colors.primary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                        {item.available}
                      </Text>
                    </View>
                    <Text style={[s.qtyAvailText, { color: colors.text }]}>items available</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Feather name="info" size={12} color={Colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                      Current available stock for this patient
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[s.modalUsageBox, { backgroundColor: colors.background }]}>
                <Text style={[s.modalUsageTitle, { color: colors.text }]}>Usage Details</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                  Enter used quantity for this visit
                </Text>

                <Text style={[s.formLabel, { color: colors.text, marginTop: 14 }]}>
                  Total Used Quantity For Visit <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <View
                  style={[
                    s.qtyInputRow,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  <MaterialCommunityIcons name="package-variant" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={[s.qtyInput, { color: colors.text }]}
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                    items
                  </Text>
                </View>

                <View style={s.qtyInfo}>
                  <Feather name="refresh-cw" size={12} color="#F59E0B" />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular", flex: 1 }}>
                    Adjusting this value will automatically add/deduct items from the patient
                    inventory. Current available: {item.available} items.
                  </Text>
                </View>
              </View>

              <View>
                <Text style={[s.formLabel, { color: colors.text }]}>Notes</Text>
                <TextInput
                  style={[
                    s.formInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      minHeight: 60,
                      textAlignVertical: "top",
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional notes about this usage"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={s.modalFooter}>
              <Pressable
                style={[s.modalCancelBtn, { backgroundColor: "#EF4444" }]}
                onPress={onClose}
              >
                <Feather name="x" size={14} color="#fff" />
                <Text style={s.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.modalUseBtn, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  const n = parseInt(qty, 10);
                  if (!n || n <= 0) {
                    showDialog({ variant: "error", title: "Invalid", message: "Enter a valid quantity." });
                    return;
                  }
                  if (n > item.available) {
                    showDialog({ variant: "error", title: "Exceeded", message: "Quantity exceeds available stock." });
                    return;
                  }
                  onUse(n, notes);
                  setQty("1");
                  setNotes("");
                }}
              >
                <Feather name="check" size={14} color="#fff" />
                <Text style={s.modalBtnText}>Use Items</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <FeedbackDialog {...modalDialogProps} />
    </>
  );
}
