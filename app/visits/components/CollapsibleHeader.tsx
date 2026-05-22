import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

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
  const rot = useSharedValue(expanded ? 1 : 0);
  React.useEffect(() => {
    rot.value = withTiming(expanded ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [expanded, rot]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 180}deg` }],
  }));

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
      <Animated.View style={[{ marginLeft: "auto" }, chevronStyle]}>
        <Feather name="chevron-down" size={18} color={colors.textTertiary} />
      </Animated.View>
    </Pressable>
  );
}
