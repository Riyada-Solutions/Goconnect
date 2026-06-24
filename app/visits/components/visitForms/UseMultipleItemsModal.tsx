import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/theme/colors";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import type { InventoryItem } from "@/data/models/visit";

interface RowState {
  item: InventoryItem;
  qty: string;
  notes: string;
}

interface Props {
  visible: boolean;
  items: InventoryItem[];
  onClose: () => void;
  onConfirm: (rows: Array<{ patientInventoryId: number; quantity: number; notes: string | null }>) => void;
  isLoading?: boolean;
  colors: any;
}

export function UseMultipleItemsModal({ visible, items, onClose, onConfirm, isLoading, colors }: Props) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [search, setSearch] = useState("");
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const availableItems = useMemo(
    () => items.filter((it) => it.available > 0),
    [items],
  );

  const selectedIds = useMemo(() => new Set(rows.map((r) => r.item.id)), [rows]);

  const filteredSearch = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableItems.filter((it) => !selectedIds.has(it.id));
    return availableItems.filter(
      (it) =>
        !selectedIds.has(it.id) &&
        (it.name.toLowerCase().includes(q) || it.itemNumber.toLowerCase().includes(q)),
    );
  }, [availableItems, selectedIds, search]);

  const addItem = useCallback((item: InventoryItem) => {
    setRows((prev) => [...prev, { item, qty: "1", notes: "" }]);
    setSearch("");
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.item.id !== id));
  }, []);

  const updateRow = useCallback((id: number, field: "qty" | "notes", value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.item.id === id ? { ...r, [field]: value } : r)),
    );
  }, []);

  const handleClose = () => {
    setRows([]);
    setSearch("");
    onClose();
  };

  const handleConfirm = () => {
    if (rows.length === 0) {
      showDialog({ variant: "error", title: "No Items", message: "Add at least one item." });
      return;
    }
    for (const r of rows) {
      const n = parseInt(r.qty, 10);
      if (!n || n <= 0) {
        showDialog({ variant: "error", title: "Invalid Quantity", message: `Enter a valid quantity for "${r.item.name}".` });
        return;
      }
      if (n > r.item.available) {
        showDialog({ variant: "error", title: "Exceeded", message: `Quantity for "${r.item.name}" exceeds available stock (${r.item.available}).` });
        return;
      }
    }
    onConfirm(
      rows.map((r) => ({
        patientInventoryId: r.item.id,
        quantity: parseInt(r.qty, 10),
        notes: r.notes || null,
      })),
    );
    setRows([]);
    setSearch("");
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%", overflow: "hidden" }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.primary, padding: 16 }}>
              <MaterialCommunityIcons name="package-variant-closed" size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>Use Multiple Items</Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 11 }}>
                  Enter quantity and notes for each item
                </Text>
              </View>
              <Pressable onPress={handleClose}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Search to add items */}
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Inter_600SemiBold", marginBottom: 6 }}>
                  ADD ITEMS
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background, paddingHorizontal: 10, gap: 8 }}>
                  <Feather name="search" size={15} color={colors.textTertiary} />
                  <TextInput
                    style={{ flex: 1, height: 40, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 13 }}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by name or item no."
                    placeholderTextColor={colors.textTertiary}
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")}>
                      <Feather name="x-circle" size={15} color={colors.textTertiary} />
                    </Pressable>
                  )}
                </View>

                {search.length > 0 && (
                  <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginTop: 4, backgroundColor: colors.surface, overflow: "hidden" }}>
                    {filteredSearch.length === 0 ? (
                      <Text style={{ padding: 12, color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                        No items found.
                      </Text>
                    ) : (
                      filteredSearch.map((it) => (
                        <Pressable
                          key={it.id}
                          onPress={() => addItem(it)}
                          style={{ flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{it.name}</Text>
                            <Text style={{ color: colors.textTertiary, fontFamily: "Inter_400Regular", fontSize: 11 }}>#{it.itemNumber}</Text>
                          </View>
                          <View style={{ backgroundColor: `${Colors.primary}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: Colors.primary, fontFamily: "Inter_700Bold", fontSize: 12 }}>{it.available}</Text>
                          </View>
                          <Feather name="plus-circle" size={18} color={Colors.primary} />
                        </Pressable>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* Selected rows */}
              {rows.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
                  <MaterialCommunityIcons name="package-variant" size={40} color={colors.border} />
                  <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>
                    No items added yet.{"\n"}Search above to add inventory items.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Inter_600SemiBold" }}>
                    SELECTED ITEMS ({rows.length})
                  </Text>
                  {rows.map((row) => (
                    <View
                      key={row.item.id}
                      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.background, padding: 12, gap: 10 }}
                    >
                      {/* Item header */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                            {row.item.name}
                          </Text>
                          <Text style={{ color: colors.textTertiary, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                            #{row.item.itemNumber}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: row.item.available > 5 ? `${Colors.primary}20` : "#FEF3C720", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" }}>
                          <Text style={{ color: row.item.available > 5 ? Colors.primary : "#D97706", fontFamily: "Inter_700Bold", fontSize: 14 }}>
                            {row.item.available}
                          </Text>
                          <Text style={{ color: colors.textTertiary, fontFamily: "Inter_400Regular", fontSize: 9 }}>avail</Text>
                        </View>
                        <Pressable
                          onPress={() => removeRow(row.item.id)}
                          style={{ padding: 4 }}
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </Pressable>
                      </View>

                      {/* Qty row */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_500Medium", marginBottom: 4 }}>
                            Qty to Use <Text style={{ color: "#EF4444" }}>*</Text>
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, paddingHorizontal: 10, gap: 6 }}>
                            <TextInput
                              style={{ flex: 1, height: 36, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                              value={row.qty}
                              onChangeText={(v) => updateRow(row.item.id, "qty", v)}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.textTertiary}
                            />
                            <Text style={{ color: colors.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                              Max: {row.item.available}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_500Medium", marginBottom: 4 }}>
                            Notes
                          </Text>
                          <TextInput
                            style={{ height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, paddingHorizontal: 10, color: colors.text, fontFamily: "Inter_400Regular", fontSize: 13 }}
                            value={row.notes}
                            onChangeText={(v) => updateRow(row.item.id, "notes", v)}
                            placeholder="Optional"
                            placeholderTextColor={colors.textTertiary}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{ flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Pressable
                onPress={handleClose}
                style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
              >
                <Feather name="x" size={15} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={isLoading || rows.length === 0}
                style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: rows.length === 0 ? colors.border : Colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                  {isLoading ? "Submitting…" : `Confirm Usage (${rows.length})`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
      <FeedbackDialog {...dialogProps} />
    </>
  );
}
