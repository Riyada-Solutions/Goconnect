import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";

import { Colors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";
import { searchEmployees, type EmployeeOption, type EmployeeType } from "@/data/employees_repository";

export interface StaffValue {
  id: string | number | null;
  name: string;
}

interface Props {
  label?: string;
  value: StaffValue;
  employeeType: EmployeeType;
  onChange: (v: StaffValue) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

/** Search-as-you-type picker for physicians/nurses/social workers, backed
 *  by `GET /employees/autocomplete?q=&type=`. Stores both the display name
 *  and numeric id the save payload needs (`attending_physician` /
 *  `attending_physician_id` and siblings). */
export function StaffPickerField({ label, value, employeeType, onChange, placeholder, disabled, invalid }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const items = await searchEmployees(employeeType, q);
        if (requestId.current === id) setResults(items);
      } catch (e: any) {
        if (requestId.current === id) setError(e?.message ?? "Search failed");
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open, employeeType]);

  const select = (item: EmployeeOption) => {
    Haptics.selectionAsync();
    onChange({ id: item.id, name: item.username });
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {label ? (
        <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.text, marginBottom: 4 }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        disabled={disabled}
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: invalid ? "#EF4444" : colors.border,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 10,
          backgroundColor: colors.surface,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          style={{ flex: 1, color: value.name ? colors.text : colors.textTertiary, fontFamily: "Inter_400Regular", fontSize: 14 }}
          numberOfLines={1}
        >
          {value.name || placeholder || "Select..."}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface, borderRadius: 14, overflow: "hidden", maxHeight: "70%" }}
          >
            <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.text }}>
                  {label ?? placeholder ?? "Select"}
                </Text>
                <Pressable onPress={close}>
                  <Feather name="x" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Type at least 2 characters to search"
                placeholderTextColor={colors.textTertiary}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                }}
              />
            </View>

            {loading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : error ? (
              <Text style={{ padding: 16, color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular" }}>{error}</Text>
            ) : results.length === 0 ? (
              <Text style={{ padding: 16, color: colors.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                {query.trim().length < MIN_QUERY_LENGTH ? "Type at least 2 characters to search" : "No matches found"}
              </Text>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable onPress={() => select(item)} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ color: colors.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>{item.text}</Text>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: colors.borderLight, marginLeft: 16 }} />
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
