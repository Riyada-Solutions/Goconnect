import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { mobileFlowStyles as ms } from "../visit-detail.styles";

interface Props {
  title: string;
  color: string;
  done: boolean;
  isOpen: boolean;
  onToggle: () => void;
  colors: any;
  isReadOnly?: boolean;
  children: React.ReactNode;
}

/**
 * Accordion section used in the Flow Sheet. Body animates in/out with
 * Reanimated; the chevron rotates smoothly; the outer wrapper uses a layout
 * transition so neighbouring sections slide into place rather than snapping.
 */
export function Acc({ title, color, done, isOpen, onToggle, colors, isReadOnly, children }: Props) {
  const chevronRot = useSharedValue(isOpen ? 1 : 0);
  React.useEffect(() => {
    chevronRot.value = withTiming(isOpen ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [isOpen, chevronRot]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRot.value * 180}deg` }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(220).easing(Easing.out(Easing.cubic))}
      style={[ms.borderedSection, { borderLeftColor: color, backgroundColor: colors.card }]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[ms.accHeader, { backgroundColor: `${color}18` }]}
      >
        <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          {done && (
            <Animated.View style={ms.checkCircle}>
              <Feather name="check" size={12} color="#fff" />
            </Animated.View>
          )}
          <Text style={[ms.accHeaderText, { color }]}>{title}</Text>
        </Animated.View>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={18} color={color} />
        </Animated.View>
      </Pressable>
      {isOpen && (
        <Animated.View
          entering={FadeInUp.duration(220).easing(Easing.out(Easing.cubic))}
          exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.cubic))}
          style={ms.sectionBody}
          pointerEvents={isReadOnly ? "none" : "auto"}
        >
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}
