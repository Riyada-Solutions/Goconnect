import React from "react";
import { ScrollView, View, ViewStyle } from "react-native";

interface Props {
  count?: number;
  gap?: number;
  padding?: number;
  renderItem: (index: number) => React.ReactNode;
  style?: ViewStyle;
}

export function ListSkeleton({
  count = 6,
  gap = 10,
  padding = 16,
  renderItem,
  style,
}: Props) {
  return (
    <ScrollView
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ padding, gap }, style]}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>{renderItem(i)}</View>
      ))}
    </ScrollView>
  );
}
