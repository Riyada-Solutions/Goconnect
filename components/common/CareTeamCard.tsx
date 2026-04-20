import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";

interface TeamMember {
  name: string;
  role: string;
  phone?: string;
}

interface CareTeamCardProps {
  provider?: string;
  medicalTeam?: TeamMember[];
  colors: {
    text: string;
    textSecondary: string;
    borderLight: string;
    surface: string;
    card: string;
  };
  animDelay?: number;
}

function roleColor(role: string): { bg: string; label: string; dot: string } {
  const r = role.toLowerCase();
  if (r.includes("physician") || r.includes("doctor") || r.includes("dr"))
    return { bg: "#3B82F620", label: "#60A5FA", dot: "#3B82F6" };
  if (r.includes("nurse"))
    return { bg: "#8B5CF620", label: "#A78BFA", dot: "#8B5CF6" };
  if (r.includes("cardio"))
    return { bg: "#EF444420", label: "#F87171", dot: "#EF4444" };
  if (r.includes("pulmo"))
    return { bg: "#10B98120", label: "#34D399", dot: "#10B981" };
  if (r.includes("neuro"))
    return { bg: "#F59E0B20", label: "#FCD34D", dot: "#F59E0B" };
  return { bg: "#9CA3AF20", label: "#D1D5DB", dot: "#9CA3AF" };
}

export function CareTeamCard({ provider, medicalTeam, colors, animDelay = 140 }: CareTeamCardProps) {
  const hasContent = provider || (medicalTeam && medicalTeam.length > 0);
  if (!hasContent) return null;

  const providerMember = medicalTeam?.find((m) => m.name === provider);
  const otherMembers = medicalTeam?.filter((m) => m.name !== provider) ?? [];

  return (
    <Animated.View entering={FadeInDown.delay(animDelay).springify()}>
      {/* Section header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: Colors.primary }} />
        <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.text }}>Care Team</Text>
        {medicalTeam && medicalTeam.length > 0 && (
          <View style={{ backgroundColor: `${Colors.primary}18`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>
              {medicalTeam.length} {medicalTeam.length === 1 ? "member" : "members"}
            </Text>
          </View>
        )}
      </View>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Primary provider row */}
        {provider && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: `${Colors.primary}08` }}>
            <Avatar name={provider} size={44} color={Colors.primaryLight} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.text }}>{provider}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ backgroundColor: `${Colors.primary}20`, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.primary }}>PRIMARY PROVIDER</Text>
                </View>
              </View>
            </View>
            {providerMember?.phone && <ActionButton type="call" value={providerMember.phone} />}
          </View>
        )}

        {/* Other team members */}
        {otherMembers.map((member, idx) => {
          const rc = roleColor(member.role);
          return (
            <View key={idx}>
              <View style={{ height: 1, backgroundColor: colors.borderLight, marginHorizontal: 14 }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Avatar name={member.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.text, marginBottom: 4 }}>{member.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rc.dot }} />
                    <View style={{ backgroundColor: rc.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: rc.label }}>{member.role}</Text>
                    </View>
                  </View>
                </View>
                {member.phone && <ActionButton type="call" value={member.phone} />}
              </View>
            </View>
          );
        })}
      </Card>
    </Animated.View>
  );
}
