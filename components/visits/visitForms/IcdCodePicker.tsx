import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";

import type { IcdCode } from "@/data/visit_repository";
import { useIcdCodeLabels, useIcdCodeSearch } from "@/hooks/useIcdCodes";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";

interface Props {
  label: string;
  value: string[];
  onChange: (codes: string[]) => void;
  colors: any;
  disabled?: boolean;
}

/**
 * Multi-select ICD code field backed by `GET /icd-codes`. Selected codes show
 * as removable chips labelled via `codes[]` lookup; "Add" opens a searchable
 * sheet (debounced typeahead).
 */
export function IcdCodePicker({ label, value, onChange, colors, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Descriptions of codes picked this session, so chips are labelled
  // immediately without waiting for the `codes[]` lookup.
  const picked = useRef<Record<string, string>>({});

  const labels = useIcdCodeLabels(value);
  const results = useIcdCodeSearch(search, open);

  const descriptionOf = useMemo(() => {
    const map: Record<string, string> = { ...picked.current };
    labels.data?.items.forEach((i) => { map[i.code] = i.description; });
    return map;
  }, [labels.data, value]);

  const toggle = (item: IcdCode) => {
    Haptics.selectionAsync();
    if (value.includes(item.code)) {
      onChange(value.filter((c) => c !== item.code));
    } else {
      picked.current[item.code] = item.description;
      onChange([...value, item.code]);
    }
  };

  const remove = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value.filter((c) => c !== code));
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[s.formLabel, { color: colors.text, marginBottom: 0 }]}>{label}</Text>
        {!disabled && (
          <Pressable onPress={() => setOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }} hitSlop={8}>
            <Feather name="plus-circle" size={16} color={Colors.primary} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary }}>Add</Text>
          </Pressable>
        )}
      </View>

      {value.length === 0 ? (
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>No diagnosis selected</Text>
      ) : (
        <View style={{ gap: 6 }}>
          {value.map((code) => (
            <View
              key={code}
              style={{
                flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 10,
                borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.primary }}>{code}</Text>
              <Text style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text }} numberOfLines={2}>
                {descriptionOf[code] ?? (labels.isLoading ? "…" : "")}
              </Text>
              {!disabled && (
                <Pressable onPress={() => remove(code)} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary }}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by code or description"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {results.isFetching && <ActivityIndicator size="small" color={Colors.primary} />}
          <FlatList
            data={search.trim() ? results.data?.items ?? [] : []}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 24, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
                {!search.trim()
                  ? "Type a code (e.g. N18) or a description"
                  : results.isError
                    ? "Couldn't load ICD codes. Check your connection."
                    : results.isFetching ? "" : "No matching codes"}
              </Text>
            }
            renderItem={({ item }) => {
              const selected = value.includes(item.code);
              return (
                <Pressable
                  onPress={() => toggle(item)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
                >
                  <Feather name={selected ? "check-square" : "square"} size={18} color={selected ? Colors.primary : colors.textSecondary} />
                  <Text style={{ width: 64, fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text }}>{item.code}</Text>
                  <Text style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{item.description}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
