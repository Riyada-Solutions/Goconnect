import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { visitDetailStyles as s } from "../../visit-detail.styles";

export function ReadOnlyBanner() {
  return (
    <Animated.View entering={FadeInDown.delay(75).springify()} style={[s.section]}>
      <View style={s.readOnlyBanner}>
        <Feather name="lock" size={14} color="#fff" />
        <Text style={s.readOnlyBannerText}>Procedure ended — all forms are read-only</Text>
      </View>
    </Animated.View>
  );
}
