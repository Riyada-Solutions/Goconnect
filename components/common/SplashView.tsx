import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface SplashViewProps {
  onFinish: () => void;
}

export function SplashView({ onFinish }: SplashViewProps) {
  const logoScale = useSharedValue(0.3);
  const logoPulse = useSharedValue(1);
  const barWidth = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const finished = useRef(false);

  useEffect(() => {
    // Logo bounces in
    logoScale.value = withSpring(1, { damping: 10, stiffness: 80 });

    // Logo pulses gently
    setTimeout(() => {
      logoPulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0,  { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }, 400);

    // Progress bar fills
    setTimeout(() => {
      barWidth.value = withTiming(width - 80, {
        duration: 1800,
        easing: Easing.out(Easing.quad),
      });
    }, 300);

    // After 2.4s — start fade out
    const fadeTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 });
    }, 2400);

    // After 2.85s — call onFinish
    const finishTimer = setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        onFinish();
      }
    }, 2850);

    // Safety net — force dismiss after 4s no matter what
    const safetyTimer = setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        onFinish();
      }
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value * logoPulse.value }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value,
  }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 9999 }, containerStyle]}>
      <LinearGradient
        colors={["#14D0E8", "#0FB8D0", "#0A8FA6", "#065F74"]}
        style={styles.container}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        {/* Decorative blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />
        <View style={styles.blobCenter} />

        {/* Logo */}
        <View style={styles.center}>
          <Animated.View style={[styles.logoWrapper, logoStyle]}>
            <View style={styles.logoCircle}>
              <View style={styles.heartbeat}>
                {[0, 0, 1, 2, 1, 0, -1, -2, -1, 0, 0].map((v, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heartbeatBar,
                      {
                        height: 8 + Math.abs(v) * 10,
                        opacity: v === 0 ? 0.5 : 1,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.glowRing} />
          </Animated.View>

          {/* App name */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text style={styles.appName}>GoConnect</Text>
            <Text style={styles.appSub}>KSA Healthcare Platform</Text>
          </Animated.View>
        </View>

        {/* Progress bar */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, barStyle]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(500)}>
          <Text style={styles.tagline}>Secure healthcare data management</Text>
        </Animated.View>

        <View style={{ height: Platform.OS === "web" ? 60 : 40 }} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  blobTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  blobCenter: {
    position: "absolute",
    top: "35%",
    right: -120,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  center: {
    alignItems: "center",
    gap: 28,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heartbeat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 36,
  },
  heartbeatBar: {
    width: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  appName: {
    fontSize: 36,
    color: "#fff",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  appSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  progressTrack: {
    width: width - 80,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
});
