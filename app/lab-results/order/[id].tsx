import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ZoomableImageModal } from "@/components/common/ZoomableImageModal";
import { LabResultsWithAttachments } from "@/components/labResults/LabResultsWithAttachments";
import { LabResultCardSkeleton, ListSkeleton } from "@/components/skeletons";
import { useApp } from "@/context/AppContext";
import { useLabResults } from "@/hooks/useLabResults";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

function LabOrderDetailScreen() {
  const { id, patientId } = useLocalSearchParams<{ id: string; patientId: string }>();
  const { t } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad, horizontal } = useScreenPadding();
  const [zoomUri, setZoomUri] = React.useState<string | null>(null);

  const { data: orders = [], isLoading, isError, refetch } = useLabResults(Number(patientId));
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const order = orders.find((o) => o.id === Number(id));

  const meta = order
    ? [
        { icon: "user" as const, label: t("addedBy"), value: order.addedBy ?? "—" },
        { icon: "clock" as const, label: t("addedAt"), value: order.addedAt },
        { icon: "calendar" as const, label: t("dueDate"), value: order.dueDate },
      ]
    : [];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
          {t("labRequisition")} {order ? `#${order.id}` : ""}
        </Text>
      </View>

      {isLoading ? (
        <ListSkeleton count={3} renderItem={() => <LabResultCardSkeleton />} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !order ? (
        <EmptyState icon="file-text" title={t("noLabResults")} description={t("noLabResultsDescription")} />
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { padding: horizontal, paddingBottom: botPad }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        >
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={s.infoCard}>
              <View style={s.headerRow}>
                <Text style={[s.company, { color: colors.text }]} numberOfLines={2}>{order.labCompany}</Text>
                <StatusBadge status={order.status} size="sm" />
              </View>
              {meta.map((m) => (
                <View key={m.label} style={s.metaRow}>
                  <Feather name={m.icon} size={12} color={colors.textTertiary} />
                  <Text style={[s.metaLabel, { color: colors.textTertiary }]}>{m.label}</Text>
                  <Text style={[s.metaValue, { color: colors.text }]} numberOfLines={1}>{m.value}</Text>
                </View>
              ))}
            </Card>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(60).duration(300)}>
            <LabResultsWithAttachments order={order} onOpenImage={setZoomUri} />
          </Animated.View>
          <ZoomableImageModal uri={zoomUri} onClose={() => setZoomUri(null)} />
        </ScrollView>
      )}
    </View>
  );
}

export default function LabOrderDetail() {
  return (
    <ErrorBoundary>
      <LabOrderDetailScreen />
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  content: { gap: 16 },
  infoCard: { padding: 14, gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  company: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  metaValue: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" },
});
