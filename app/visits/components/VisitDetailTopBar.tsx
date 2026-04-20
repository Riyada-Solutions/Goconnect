import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { visitDetailStyles as s } from "../visit-detail.styles";

interface Props {
  topPad: number;
  colors: any;
  title?: string;
}

export function VisitDetailTopBar({ topPad, colors, title = "Visit Details" }: Props) {
  return (
    <View
      style={[
        s.topBar,
        { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          router.back();
        }}
        style={s.iconBtn}
      >
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <Text style={[s.topTitle, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.topActions} />
    </View>
  );
}
