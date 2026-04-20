import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import type { InventoryItem } from "@/types/visit";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";

interface Props {
  items: InventoryItem[];
  expanded: boolean;
  onToggle: () => void;
  onSelectItem: (item: InventoryItem) => void;
  isReadOnly: boolean;
  colors: any;
}

export function PatientInventorySection({ items, expanded, onToggle, onSelectItem, isReadOnly, colors }: Props) {
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
        {expanded && (
          <View style={{ padding: 12, gap: 8 }} pointerEvents={isReadOnly ? "none" : "auto"}>
            {items.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
                No inventory items assigned.
              </Text>
            ) : (
              items.map((item) => (
                <View key={item.id} style={[s.invRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.invName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}># {item.itemNumber}</Text>
                  </View>
                  <View style={{ alignItems: "center", marginRight: 10 }}>
                    <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.primary }}>{item.available}</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>available</Text>
                  </View>
                  <Pressable
                    style={[s.useBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSelectItem(item);
                    }}
                  >
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Use</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}
