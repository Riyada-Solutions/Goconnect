import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Status =
  | "active"
  | "inactive"
  | "critical"
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed"
  | string;

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label?: string }
> = {
  active: { bg: "#E6F9F2", text: "#00A67E", dot: "#00A67E" },
  confirmed: { bg: "#E6F9F2", text: "#00A67E", dot: "#00A67E" },
  completed: { bg: "#EEF2FF", text: "#4F46E5", dot: "#4F46E5" },
  pending: { bg: "#FEF9C3", text: "#B45309", dot: "#F59E0B" },
  inactive: { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" },
  cancelled: { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
  critical: { bg: "#FFF1F1", text: "#DC2626", dot: "#EF4444" },
  in_progress: { bg: "#E0F2FE", text: "#0369A1", dot: "#2DAAAE", label: "In Progress" },
  "in progress": { bg: "#E0F2FE", text: "#0369A1", dot: "#2DAAAE", label: "In Progress" },
  result_ready: { bg: "#E6F9F2", text: "#00A67E", dot: "#00A67E", label: "Result ready" },
  "result ready": { bg: "#E6F9F2", text: "#00A67E", dot: "#00A67E", label: "Result ready" },
  acknowledged: { bg: "#EEF2FF", text: "#4F46E5", dot: "#4F46E5", label: "Acknowledged" },
  start_procedure: { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316", label: "Start Procedure" },
  "start procedure": { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316", label: "Start Procedure" },
  end_procedure: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "End Procedure" },
  "end procedure": { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "End Procedure" },
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  label,
  size = "md",
}: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? "inactive";
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.inactive;
  const text = label ?? config.label ?? status;
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: config.dot },
          isSmall && styles.dotSm,
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSmall && styles.textSm,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  textSm: {
    fontSize: 11,
  },
});
