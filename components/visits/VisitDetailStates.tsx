import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";

interface StateProps {
  colors: any;
}

export function VisitDetailLoading({ colors }: StateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 12 }}>
      <ActivityIndicator color={Colors.primary} size="large" />
      <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14 }}>Loading visit…</Text>
    </View>
  );
}

export function VisitDetailError({
  colors,
  message,
  onRetry,
}: StateProps & { message: string; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24, gap: 14 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
        <Feather name="alert-triangle" size={28} color="#DC2626" />
      </View>
      <Text style={{ color: colors.text, fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" }}>Couldn't load this visit</Text>
      <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginTop: 4 }}
      >
        <Feather name="refresh-ccw" size={15} color="#fff" />
        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Retry</Text>
      </Pressable>
    </View>
  );
}

export function VisitDetailEmpty({ colors, onRetry }: StateProps & { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24, gap: 12 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${Colors.primary}20`, alignItems: "center", justifyContent: "center" }}>
        <Feather name="inbox" size={28} color={Colors.primary} />
      </View>
      <Text style={{ color: colors.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>Visit not found</Text>
      <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>
        This visit may have been removed or you may not have access.
      </Text>
      <Pressable
        onPress={onRetry}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginTop: 4 }}
      >
        <Feather name="refresh-ccw" size={15} color="#fff" />
        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Retry</Text>
      </Pressable>
    </View>
  );
}
