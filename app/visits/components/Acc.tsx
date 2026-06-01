import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";
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
  canUpdate?: boolean;
  isReadOnly?: boolean;
  children: React.ReactNode;
  /** Number of filled fields in this section. When both `filled` and `total`
   *  are provided, a "filled/total" pill renders next to the chevron. */
  filled?: number;
  /** Total number of fields in this section. */
  total?: number;
}

/**
 * Accordion section used in the Flow Sheet. Body animates in/out with
 * Reanimated; the chevron rotates smoothly; the outer wrapper uses a layout
 * transition so neighbouring sections slide into place rather than snapping.
 */
export function Acc({ title, color, done, isOpen, onToggle, colors, isReadOnly, children, filled, total }: Props) {
  void done;
  const chevronRot = useSharedValue(isOpen ? 1 : 0);
  React.useEffect(() => {
    chevronRot.value = withTiming(isOpen ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [isOpen, chevronRot]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRot.value * 180}deg` }],
  }));

  const showCounter = typeof filled === "number" && typeof total === "number" && total > 0;
  const isFull = showCounter && (filled as number) >= (total as number);

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
          <Text style={[ms.accHeaderText, { color }]}>{title}</Text>
        </Animated.View>
        {showCounter && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 }}>
            {!isFull && (
            <View
              style={{
                backgroundColor: isFull ? "#10B98133" : `${color}1F`,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: isFull ? "#059669" : color,
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                }}
              >
                {filled}/{total}
              </Text>
            </View>
            )}
            {isFull && <Feather name="check-circle" size={16} color="#10B981" />}
          </View>
        )}
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
