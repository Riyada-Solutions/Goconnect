import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Colors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";
import type { CareTeamMember } from "@/data/models/careTeam";

export type { CareTeamMember };

interface CareTeamViewProps {
  members: CareTeamMember[];
  title?: string;
  animDelay?: number;
  showHeader?: boolean;
}

function roleColor(role: string): { bg: string; label: string; dot: string } {
  const r = role.toLowerCase();
  if (r.includes("physician") || r.includes("doctor") || r.includes("dr"))
    return { bg: "#3B82F620", label: "#60A5FA", dot: "#3B82F6" };
  if (r.includes("nurse team") || r.includes("team lead"))
    return { bg: "#F59E0B20", label: "#FCD34D", dot: "#F59E0B" };
  if (r.includes("nurse"))
    return { bg: "#8B5CF620", label: "#A78BFA", dot: "#8B5CF6" };
  if (r.includes("social"))
    return { bg: "#10B98120", label: "#34D399", dot: "#10B981" };
  if (r.includes("cardio"))
    return { bg: "#EF444420", label: "#F87171", dot: "#EF4444" };
  if (r.includes("pulmo"))
    return { bg: "#10B98120", label: "#34D399", dot: "#10B981" };
  if (r.includes("neuro"))
    return { bg: "#F59E0B20", label: "#FCD34D", dot: "#F59E0B" };
  return { bg: "#9CA3AF20", label: "#D1D5DB", dot: "#9CA3AF" };
}

export function CareTeamView({
  members,
  title = "Care Team",
  animDelay = 140,
  showHeader = true,
}: CareTeamViewProps) {
  const { colors } = useTheme();
  const list = members.filter((m) => m && m.name);
  if (list.length === 0) return null;

  const hasExplicitPrimary = list.some((m) => m.isPrimary);
  const primary = hasExplicitPrimary ? list.find((m) => m.isPrimary) : list[0];
  const others = hasExplicitPrimary
    ? list.filter((m) => !m.isPrimary)
    : list.slice(1);

  return (
    <Animated.View entering={FadeInDown.delay(animDelay).springify()}>
      {showHeader && (
        <SectionHeader
          title={title}
          count={`${list.length} ${list.length === 1 ? "member" : "members"}`}
        />
      )}

      <Card style={styles.card}>
        {primary && (
          <View style={styles.primaryRow}>
            <Avatar name={primary.name} imageUrl={primary.avatarUrl} size={44} color={Colors.primaryLight} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.primaryName, { color: colors.text }]}>
                {primary.name}
              </Text>
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>{primary.role.toUpperCase()}</Text>
              </View>
            </View>
            {primary.phone ? <ActionButton type="call" value={primary.phone} /> : null}
          </View>
        )}

        {others.map((member, idx) => {
          const rc = roleColor(member.role);
          const showDivider = primary !== undefined || idx > 0;
          return (
            <View key={`${member.name}-${idx}`}>
              {showDivider && (
                <View
                  style={[styles.divider, { backgroundColor: colors.borderLight }]}
                />
              )}
              <View style={styles.memberRow}>
                <Avatar name={member.name} imageUrl={member.avatarUrl} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {member.name}
                  </Text>
                  <View style={styles.roleRow}>
                    <View style={[styles.roleDot, { backgroundColor: rc.dot }]} />
                    <View style={[styles.rolePill, { backgroundColor: rc.bg }]}>
                      <Text style={[styles.roleText, { color: rc.label }]}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                </View>
                {member.phone ? <ActionButton type="call" value={member.phone} /> : null}
              </View>
            </View>
          );
        })}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  headerAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  headerCount: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  headerCountText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: `${Colors.primary}08`,
  },
  primaryName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  primaryBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  memberName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rolePill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
});
