import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

export type SelectOption = string | { value: string; label: string };

interface Props {
  label?: string;
  value: string | null;
  options: readonly SelectOption[];
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function toPair(o: SelectOption): { value: string; label: string } {
  return typeof o === "string" ? { value: o, label: o } : o;
}

export function SelectField({ label, value, options, placeholder, onChange, disabled }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const pairs = options.map(toPair);
  const selectedLabel = value ? pairs.find((p) => p.value === value)?.label ?? value : null;

  return (
    <View>
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
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 10,
          backgroundColor: colors.surface,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: value ? colors.text : colors.textTertiary,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
          }}
        >
          {selectedLabel ?? placeholder ?? "Select..."}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface, borderRadius: 14, overflow: "hidden", maxHeight: "70%" }}
          >
            <View
              style={{
                padding: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.text }}>
                {label ?? placeholder ?? "Select"}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={pairs}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: selected ? `${Colors.primary}12` : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? Colors.primary : colors.text,
                        fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
                        fontSize: 14,
                      }}
                    >
                      {item.label}
                    </Text>
                    {selected && <Feather name="check" size={16} color={Colors.primary} />}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: colors.borderLight, marginLeft: 16 }} />
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
