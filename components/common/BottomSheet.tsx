import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Optional title rendered in the sheet header. */
  title?: string;
  /** Optional one-line subtitle under the title. */
  subtitle?: string;
  /** Arbitrary content (the "defacto" body). */
  children: React.ReactNode;
  /** Fraction of the screen height the sheet is allowed to grow to. */
  maxHeightRatio?: number;
}

/**
 * Reusable bottom sheet: slides up from the bottom with a fading backdrop,
 * supports drag-to-dismiss, and renders any children. Hidden (unmounted)
 * while `visible` is false.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeightRatio = 0.9,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);

  // Mount as soon as we are asked to show.
  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  const animateOut = useCallback(() => {
    backdrop.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(height, { duration: 250 }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [backdrop, translateY, height]);

  // Animate in once mounted, animate out when hidden externally.
  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      backdrop.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.6 });
    } else {
      animateOut();
    }
  }, [mounted, visible, backdrop, translateY, animateOut]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  const dragGesture = Gesture.Pan()
    .onChange((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.6 });
      }
    });

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <AnimatedPressable
          style={[styles.backdrop, backdropStyle]}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: colors.surface,
              maxHeight: height * maxHeightRatio,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <GestureDetector gesture={dragGesture}>
            <View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              {(title || subtitle) && (
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    {title ? (
                      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    ) : null}
                    {subtitle ? (
                      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={onClose}
                    hitSlop={10}
                    style={[styles.closeBtn, { backgroundColor: colors.borderLight }]}
                  >
                    <Feather name="x" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              )}
            </View>
          </GestureDetector>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  handleArea: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
