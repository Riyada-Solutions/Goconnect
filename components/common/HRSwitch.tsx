import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/theme/colors";

const TRACK_W = 46;
const TRACK_H = 26;
const THUMB_D = 20;
const THUMB_MARGIN = 3;

const THUMB_OFF = THUMB_MARGIN;
const THUMB_ON = TRACK_W - THUMB_D - THUMB_MARGIN;

const DURATION = 220;
const EASING = Easing.out(Easing.cubic);

interface HRSwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  trackColorOff?: string;
  trackColorOn?: string;
}

export function HRSwitch({
  value,
  onValueChange,
  disabled = false,
  trackColorOff = "#E5E7EB",
  trackColorOn = Colors.primary,
}: HRSwitchProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [trackColorOff, trackColorOn],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: THUMB_OFF + progress.value * (THUMB_ON - THUMB_OFF),
      },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.45 : 1 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: "center",
    position: "relative",
  },
  thumb: {
    position: "absolute",
    width: THUMB_D,
    height: THUMB_D,
    borderRadius: THUMB_D / 2,
    backgroundColor: "#FFFFFF",
    // subtle shadow so thumb pops off track
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
});
