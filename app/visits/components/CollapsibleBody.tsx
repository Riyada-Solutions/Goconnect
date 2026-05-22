import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeInUp, FadeOutUp, LinearTransition } from "react-native-reanimated";

interface Props {
  open: boolean;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: "auto" | "none" | "box-only" | "box-none";
  children: React.ReactNode;
}

/**
 * Smooth open/close wrapper for the body of any CollapsibleHeader-driven
 * card in the Visit detail screen. Mounts the children only while `open`,
 * but fades + slides instead of snapping. Pair with a Reanimated `layout`
 * transition on the parent if surrounding sections should slide too.
 */
export function CollapsibleBody({ open, style, pointerEvents, children }: Props) {
  if (!open) return null;
  return (
    <Animated.View
      layout={LinearTransition.duration(220).easing(Easing.out(Easing.cubic))}
      entering={FadeInUp.duration(220).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.cubic))}
      style={style}
      pointerEvents={pointerEvents}
    >
      {children}
    </Animated.View>
  );
}
