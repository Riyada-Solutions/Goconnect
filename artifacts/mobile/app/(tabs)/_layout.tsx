import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";

export default function TabLayout() {
  const { isDark } = useApp();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const dark = isDark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: dark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : dark ? Colors.dark.surface : Colors.light.surface,
          borderTopWidth: 1,
          borderTopColor: dark ? Colors.dark.border : Colors.light.border,
          elevation: 0,
          height: isWeb ? 64 : undefined,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={dark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: dark
                    ? Colors.dark.surface
                    : Colors.light.surface,
                  borderTopWidth: 1,
                  borderTopColor: dark ? Colors.dark.border : Colors.light.border,
                },
              ]}
            />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scheduler"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: "Visits",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="stethoscope"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
