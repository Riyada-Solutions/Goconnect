import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Colors } from "@/theme/colors";
import { useColors } from "@/hooks/useColors";

interface Props {
  /** Content to render when the user is authenticated. */
  children: React.ReactNode;
}

/**
 * Wraps a screen or section that requires authentication.
 * When the current user is a guest, renders a login prompt instead of children.
 */
export function GuestWall({ children }: Props) {
  const { user, t } = useApp();
  const colors = useColors();
  const router = useRouter();

  const isGuest = !user || user.role === "guest";

  if (!isGuest) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: `${Colors.primary}18`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Feather name="lock" size={32} color={Colors.primary} />
      </View>

      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 18,
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {t("loginRequired")}
      </Text>

      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 14,
          color: colors.mutedForeground,
          textAlign: "center",
          marginBottom: 28,
          lineHeight: 20,
        }}
      >
        {t("loginRequiredDescription")}
      </Text>

      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        style={{
          backgroundColor: Colors.primary,
          paddingHorizontal: 32,
          paddingVertical: 13,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Feather name="log-in" size={16} color="#fff" />
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            color: "#fff",
          }}
        >
          {t("signIn")}
        </Text>
      </Pressable>
    </View>
  );
}
