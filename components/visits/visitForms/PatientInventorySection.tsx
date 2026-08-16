import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useInventory } from "@/hooks/useInventory";
import { Colors } from "@/theme/colors";
import type { InventoryItem } from "@/data/models/visit";

import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { InventoryHistorySheet } from "./InventoryHistorySheet";

interface Props {
  patientId: number;
  visitId: number;
  expanded: boolean;
  onToggle: () => void;
  onSelectItem: (item: InventoryItem) => void;
  isReadOnly: boolean;
  colors: any;
}

export function PatientInventorySection({ patientId, visitId, expanded, onToggle, onSelectItem, isReadOnly, colors }: Props) {
  const { user } = useApp();
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const isHomeSystem = user?.selected_system === "home";
  const title = isHomeSystem ? "Patient Inventory" : "Branch Inventory";

  // Only fetch while the section is expanded — CollapsibleBody unmounts its
  // children when closed, but gating the query too avoids a request firing
  // the instant patientId/visitId become available, before the user opens it.
  const {
    data: pagesData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInventory(expanded ? patientId : 0, expanded ? visitId : 0, debouncedSearch);

  const isSearching = isFetching && !isLoading && !isFetchingNextPage;

  const items = useMemo(() => {
    const all = pagesData?.pages.flatMap((p) => p.items) ?? [];
    const seen = new Set<number>();
    return all.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [pagesData]);

  return (
    <Animated.View entering={FadeInDown.delay(230).springify()} style={s.section}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CollapsibleHeader
          title={title}
          icon="package"
          iconColor="#8B5CF6"
          expanded={expanded}
          onToggle={onToggle}
          colors={colors}
        />
        <CollapsibleBody open={expanded} style={{ padding: 12, gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 10,
              backgroundColor: colors.background,
              marginBottom: 4,
            }}
          >
            <Feather name="search" size={14} color={colors.textTertiary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or ID"
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                paddingVertical: 8,
                color: colors.text,
                fontFamily: "Inter_400Regular",
                fontSize: 13,
              }}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Feather name="x-circle" size={14} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 20 }} />
          ) : items.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
              {debouncedSearch ? "No items match your search." : "No inventory items assigned."}
            </Text>
          ) : (
            <>
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
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            alignSelf: "flex-start",
                            gap: 5,
                            marginTop: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: Colors.primary,
                            backgroundColor: `${Colors.primary}15`,
                          }}
                        >
                          <Feather name="clock" size={13} color={Colors.primary} />
                          <Text style={{ fontSize: 13, color: Colors.primary, fontFamily: "Inter_600SemiBold" }}>
                            History {/* ({item.usageHistory!.length}) */}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <View style={{ alignItems: "center", marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: item.available > 0 ? Colors.primary : "#EF4444" }}>{item.available}</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>available</Text>
                      {(item.latestQuantityUsed ?? 0) > 0 && (
                        <Text style={{ fontSize: 10, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}>last used {item.latestQuantityUsed}</Text>
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

              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 12 }} />
              ) : hasNextPage ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    fetchNextPage();
                  }}
                  style={{
                    alignItems: "center",
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary }}>Load more</Text>
                </Pressable>
              ) : null}
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
