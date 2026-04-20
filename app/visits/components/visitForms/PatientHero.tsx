import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Colors } from "@/theme/colors";

import { visitDetailStyles as s } from "../../visit-detail.styles";

interface Props {
  patientName: string;
  patientId?: number;
  patientDiagnosis?: string;
  patientStatus?: string;
  patientBloodType?: string;
  phone?: string;
  address?: string;
  isDark: boolean;
  colors: any;
}

export function PatientHero({
  patientName,
  patientId,
  patientDiagnosis,
  patientStatus,
  patientBloodType,
  phone,
  address,
  isDark,
  colors,
}: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(50).springify()}>
      <View style={[s.heroCard, { backgroundColor: isDark ? Colors.dark.card : "#fff" }]}>
        <Pressable
          onPress={() => {
            if (patientId) {
              Haptics.selectionAsync();
              router.push({ pathname: "/patients/[id]", params: { id: patientId } });
            }
          }}
          style={s.heroTop}
        >
          <Avatar name={patientName} size={54} />
          <View style={{ flex: 1 }}>
            <Text style={[s.heroName, { color: colors.text }]}>{patientName}</Text>
            {patientDiagnosis ? (
              <Text style={[s.heroType, { color: colors.textSecondary }]}>{patientDiagnosis}</Text>
            ) : null}
            <View style={s.heroBadges}>
              {patientStatus === "critical" && (
                <View style={s.criticalBadge}>
                  <View style={s.criticalDot} />
                  <Text style={s.criticalText}>Critical</Text>
                </View>
              )}
              {patientBloodType && (
                <View style={s.bloodBadge}>
                  <Feather name="database" size={11} color="#6B7280" />
                  <Text style={[s.bloodText, { color: colors.textSecondary }]}>{patientBloodType}</Text>
                </View>
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </Pressable>
        {(phone || address) && (
          <View style={[s.heroActions, { borderTopColor: colors.borderLight }]}>
            {phone && <ActionButton type="call" value={phone} />}
            {address && <ActionButton type="location" value={address} />}
          </View>
        )}
      </View>
    </Animated.View>
  );
}
