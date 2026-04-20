import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { visitDetailStyles as s } from "../visit-detail.styles";

export interface CollapsibleBadge {
  text: string;
  bg: string;
  fg: string;
}

interface Props {
  title: string;
  icon: string;
  iconColor: string;
  fontSize?: number;
  badges?: CollapsibleBadge[];
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}

export function CollapsibleHeader({
  title,
  icon,
  iconColor,
  fontSize,
  badges,
  expanded,
  onToggle,
  colors,
}: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={[
        s.collapsibleHeader,
        { borderBottomColor: expanded ? colors.borderLight : "transparent" },
      ]}
    >
      <Feather name={icon as any} size={16} color={iconColor} />
      <Text style={[s.collapsibleTitle, { color: colors.text, fontSize ,maxWidth: "80%",flex: 1}]}>{title}</Text>
      {badges?.map((b, i) => (
        <View key={i} style={[s.badge, { backgroundColor: b.bg }]}>
          <Text style={[s.badgeText, { color: b.fg }]}>{b.text}</Text>
        </View>
      ))}
      <Feather
        name={expanded ? "chevron-up" : "chevron-down"}
        size={18}
        color={colors.textTertiary}
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );
}
