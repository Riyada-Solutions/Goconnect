import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import { DateTimeConverter } from "@/utils/datetime";
import type { InventoryItem } from "@/data/models/visit";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

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
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

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
                const historyOpen = expandedHistoryId === item.id;

                return (
                  <View key={item.id} style={{ borderWidth: 1, borderColor: isLowStock ? "#F59E0B" : colors.border, borderRadius: 10, overflow: "hidden" }}>
                    {/* Item row */}
                    <View style={[s.invRow, { backgroundColor: colors.background, borderWidth: 0, borderRadius: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.invName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}># {item.itemNumber}</Text>
                        {isLowStock && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                            <Feather name="alert-triangle" size={10} color="#F59E0B" />
                            <Text style={{ fontSize: 10, color: "#F59E0B", fontFamily: "Inter_500Medium" }}>Low stock</Text>
                          </View>
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

                    {/* History toggle */}
                    {hasHistory && (
                      <>
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setExpandedHistoryId(historyOpen ? null : item.id);
                          }}
                          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}
                        >
                          <Feather name="clock" size={11} color={colors.textTertiary} />
                          <Text style={{ flex: 1, fontSize: 11, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
                            Usage history ({item.usageHistory!.length})
                          </Text>
                          <Feather name={historyOpen ? "chevron-up" : "chevron-down"} size={12} color={colors.textTertiary} />
                        </Pressable>

                        {historyOpen && (
                          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                            {item.usageHistory!.map((h, i) => (
                              <View
                                key={h.id}
                                style={{ paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border + "60", backgroundColor: colors.background }}
                              >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: `${Colors.primary}18`, alignItems: "center", justifyContent: "center" }}>
                                      <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.primary }}>{h.quantityUsed}</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.text }}>{h.user.name}</Text>
                                  </View>
                                  <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
                                    {h.createdAt ? DateTimeConverter.dateTime(h.createdAt) : ""}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: "row", gap: 12 }}>
                                  <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
                                    Total: {h.oldTotal} → {h.newTotal}
                                  </Text>
                                  {h.notes ? (
                                    <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.textTertiary, flex: 1 }} numberOfLines={1}>{h.notes}</Text>
                                  ) : null}
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </CollapsibleBody>
      </Card>
    </Animated.View>
  );
}
