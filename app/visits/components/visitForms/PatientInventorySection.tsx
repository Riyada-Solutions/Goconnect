import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import type { InventoryItem } from "@/data/models/visit";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { InventoryHistorySheet } from "./InventoryHistorySheet";

interface Props {
  items: InventoryItem[];
  expanded: boolean;
  onToggle: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onUseMultiple: () => void;
  isReadOnly: boolean;
  colors: any;
}

export function PatientInventorySection({ items, expanded, onToggle, onSelectItem, onUseMultiple, isReadOnly, colors }: Props) {
  const hasAvailable = items.some((it) => it.available > 0);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  return (
    <Animated.View entering={FadeInDown.delay(230).springify()} style={s.section}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CollapsibleHeader
          title="Patient Inventory"
          icon="package"
          iconColor="#8B5CF6"
          expanded={expanded}
          onToggle={onToggle}
          colors={colors}
        />
        <CollapsibleBody open={expanded} style={{ padding: 12, gap: 8 }}>
          {items.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
              No inventory items assigned.
            </Text>
          ) : (
            <>
              {!isReadOnly && hasAvailable && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUseMultiple();
                  }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 9, marginBottom: 4 }}
                >
                  <Feather name="layers" size={14} color="#fff" />
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Use Multiple Items</Text>
                </Pressable>
              )}

              {items.map((item) => {
                const isLowStock = (item.lowStockQty ?? 0) > 0 && item.available <= (item.lowStockQty ?? 0) && item.available > 0;
                const hasHistory = (item.usageHistory?.length ?? 0) > 0;

                return (
                  <View key={item.id} style={[s.invRow, { backgroundColor: colors.background, borderColor: isLowStock ? "#F59E0B" : colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.invName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}># {item.itemNumber}</Text>
                      {isLowStock && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                          <Feather name="alert-triangle" size={10} color="#F59E0B" />
                          <Text style={{ fontSize: 10, color: "#F59E0B", fontFamily: "Inter_500Medium" }}>Low stock</Text>
                        </View>
                      )}
                      {hasHistory && (
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setHistoryItem(item);
                          }}
                          style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 }}
                        >
                          <Feather name="clock" size={10} color={Colors.primary} />
                          <Text style={{ fontSize: 10, color: Colors.primary, fontFamily: "Inter_500Medium" }}>
                            History ({item.usageHistory!.length})
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <View style={{ alignItems: "center", marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: item.available > 0 ? Colors.primary : "#EF4444" }}>{item.available}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>available</Text>
                      {(item.usageCount ?? 0) > 0 && (
                        <Text style={{ fontSize: 10, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}>used {item.usageCount}×</Text>
                      )}
                    </View>
                    {!isReadOnly && (
                      <Pressable
                        disabled={item.available === 0}
                        style={[s.useBtn, { backgroundColor: item.available === 0 ? colors.border : Colors.primary }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onSelectItem(item);
                        }}
                      >
                        <Text style={{ color: item.available === 0 ? colors.textTertiary : "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Use</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </CollapsibleBody>
      </Card>

      <InventoryHistorySheet
        visible={historyItem !== null}
        item={historyItem}
        onClose={() => setHistoryItem(null)}
        colors={colors}
      />
    </Animated.View>
  );
}
