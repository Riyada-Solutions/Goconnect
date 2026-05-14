import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  /** When provided and a member has an `id` and `confirmed !== true`,
   *  an inline confirm button appears on that member's row. */
  onConfirmMember?: (member: CareTeamMember) => void;
  /** The `id` of the member currently being confirmed — shows a spinner. */
  confirmingMemberId?: string | number | null;
  /** Label for the confirmed badge. Defaults to "Confirmed". */
  confirmedLabel?: string;
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

function MemberAction({
  member,
  onConfirmMember,
  confirmingMemberId,
  confirmedLabel = "Confirmed",
}: {
  member: CareTeamMember;
  onConfirmMember?: (m: CareTeamMember) => void;
  confirmingMemberId?: string | number | null;
  confirmedLabel?: string;
}) {
  if (member.confirmed) {
    return (
      <View style={styles.confirmedBadge}>
        <Feather name="check" size={11} color="#00A67E" />
        <Text style={styles.confirmedText}>{confirmedLabel}</Text>
      </View>
    );
  }
  if (onConfirmMember && member.id != null) {
    const isLoading = confirmingMemberId != null && confirmingMemberId === member.id;
    return (
      <Pressable
        onPress={() => !isLoading && onConfirmMember(member)}
        style={styles.confirmBtn}
      >
        {isLoading ? (
          <ActivityIndicator size={14} color={Colors.primary} />
        ) : (
          <Feather name="check" size={14} color={Colors.primary} />
        )}
      </Pressable>
    );
  }
  return null;
}

export function CareTeamView({
  members,
  title = "Care Team",
  animDelay = 140,
  showHeader = true,
  onConfirmMember,
  confirmingMemberId,
  confirmedLabel = "Confirmed",
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
            <MemberAction
              member={primary}
              onConfirmMember={onConfirmMember}
              confirmingMemberId={confirmingMemberId}
              confirmedLabel={confirmedLabel}
            />
          </View>
        )}

        {others.map((member, idx) => {
          const rc = roleColor(member.role);
          const showDivider = primary !== undefined || idx > 0;
          return (
            <View key={`${member.name}-${idx}`}>
              {showDivider && (
                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
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
                <MemberAction
                  member={member}
                  onConfirmMember={onConfirmMember}
                  confirmingMemberId={confirmingMemberId}
                />
              </View>
            </View>
          );
        })}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  confirmBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${Colors.primary}15`,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E6F9F2",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confirmedText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#00A67E",
  },
});
