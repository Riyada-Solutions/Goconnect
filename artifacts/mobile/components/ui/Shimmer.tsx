import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface Props {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
  baseColor?: string;
  highlightColor?: string;
}

export function Shimmer({
  width = "100%",
  height = 16,
  radius = 6,
  style,
  baseColor = "#E5E7EB",
  highlightColor = "#F3F4F6",
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0.45, 1]),
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: baseColor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          { flex: 1, backgroundColor: highlightColor },
          animatedStyle,
        ]}
      />
    </View>
  );
}
