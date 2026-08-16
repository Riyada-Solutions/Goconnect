import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../visit-detail.styles";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

export function RadioOption({ label, selected, onPress, colors }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={s.radioRow}
    >
      <View
        style={[
          s.radioOuter,
          { borderColor: selected ? Colors.primary : colors.border },
        ]}
      >
        {selected && <View style={s.radioInner} />}
      </View>
      <Text style={[s.radioLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}
