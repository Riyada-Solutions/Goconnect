import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { useApp } from "@/context/AppContext";
import type { Branch } from "@/data/models/workspace";
import {
  useSetSelectedBranch,
  useSetSelectedSystem,
  useWorkspace,
} from "@/hooks/useWorkspace";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";
import { systemLabel } from "@/utils/workspace";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function WorkspaceSheet({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { user, t, updateWorkspaceSelection, refreshUser } = useApp();

  const { data, isLoading, isError, refetch } = useWorkspace(visible);
  const systemMutation = useSetSelectedSystem();
  const branchMutation = useSetSelectedBranch();

  const selectedSystem = user?.selected_system ?? null;
  const selectedBranchId = user?.selected_branch_id ?? null;

  const handleSystem = async (system: string) => {
    if (system === selectedSystem || systemMutation.isPending) return;
    Haptics.selectionAsync();
    const previous = selectedSystem;
    updateWorkspaceSelection({ selected_system: system });
    try {
      await systemMutation.mutateAsync(system);
      void refreshUser();
    } catch {
      updateWorkspaceSelection({ selected_system: previous });
    }
  };

  const handleBranch = async (branch: Branch) => {
    if (branch.id === selectedBranchId || branchMutation.isPending) return;
    Haptics.selectionAsync();
    const prevId = selectedBranchId;
    const prevBranch = user?.selected_branch ?? null;
    updateWorkspaceSelection({
      selected_branch_id: branch.id,
      selected_branch: branch,
    });
    try {
      await branchMutation.mutateAsync(branch.id);
      void refreshUser();
    } catch {
      updateWorkspaceSelection({
        selected_branch_id: prevId,
        selected_branch: prevBranch,
      });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("switchWorkspace")}
      subtitle={t("switchWorkspaceSub")}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {t("workspaceLoadError")}
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: Colors.pastel.teal }]}
            >
              <Text style={[styles.retryText, { color: Colors.primary }]}>
                {t("retry")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Systems */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t("system").toUpperCase()}
            </Text>
            <View style={styles.chipRow}>
              {(data?.systems ?? []).map((system) => {
                const active = system === selectedSystem;
                return (
                  <Pressable
                    key={system}
                    onPress={() => handleSystem(system)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? Colors.primary : colors.surface,
                        borderColor: active ? Colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={system === "home" ? "home" : "briefcase"}
                      size={15}
                      color={active ? "#fff" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? "#fff" : colors.text },
                      ]}
                    >
                      {systemLabel(system, t as (k: string) => string)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Branches */}
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary, marginTop: 20 },
              ]}
            >
              {t("branch").toUpperCase()}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {(data?.branches ?? []).map((branch, idx, arr) => {
                const active = branch.id === selectedBranchId;
                return (
                  <Pressable
                    key={branch.id}
                    onPress={() => handleBranch(branch)}
                    style={({ pressed }) => [
                      styles.branchRow,
                      idx !== arr.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                      },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View
                      style={[
                        styles.branchIcon,
                        {
                          backgroundColor: active
                            ? Colors.primary
                            : Colors.pastel.teal,
                        },
                      ]}
                    >
                      <Feather
                        name="map-pin"
                        size={16}
                        color={active ? "#fff" : Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.branchName, { color: colors.text }]}>
                        {branch.name}
                      </Text>
                      <Text
                        style={[styles.branchSub, { color: colors.textSecondary }]}
                      >
                        {[branch.medical_center_name, branch.address]
                          .filter(Boolean)
                          .join(" • ") || branch.branch_code}
                      </Text>
                    </View>
                    {active ? (
                      <Feather name="check-circle" size={20} color={Colors.primary} />
                    ) : (
                      <View
                        style={[styles.radio, { borderColor: colors.border }]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4 },
  center: { paddingVertical: 40, alignItems: "center", gap: 14 },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  branchIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  branchName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  branchSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
});
