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
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function VisitDetailTopBar({ topPad, colors, title = "Visit Details", onRefresh, isRefreshing }: Props) {
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
      <View style={s.topActions}>
        {onRefresh && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onRefresh();
            }}
            style={s.iconBtn}
            disabled={isRefreshing}
          >
            <Feather
              name="rotate-cw"
              size={22}
              color={isRefreshing ? colors.textTertiary : colors.text}
              style={isRefreshing ? { opacity: 0.6 } : {}}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
