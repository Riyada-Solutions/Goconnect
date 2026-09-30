import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ZoomableImageModal } from "@/components/common/ZoomableImageModal";
import { useApp } from "@/context/AppContext";
import type { LabDocument, LabResult } from "@/data/models/labResult";
import { useTheme } from "@/hooks/useTheme";
import { LabDocumentItem } from "./LabDocumentItem";

interface LabDocumentsSectionProps {
  order: LabResult;
}

type Entry = { key: string; title: string; doc: LabDocument };

export function LabDocumentsSection({ order }: LabDocumentsSectionProps) {
  const { t, can } = useApp();
  const { colors } = useTheme();
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const entries: Entry[] = [];
  if (order.resultPdfUrl && can("view_lab_result_pdf")) {
    entries.push({ key: "result", title: t("viewLabResults"), doc: { id: -1, url: order.resultPdfUrl } });
  }
  if (order.labOrderPdfUrl && can("view_lab_order_pdf")) {
    entries.push({ key: "order", title: t("viewLabOrder"), doc: { id: -2, url: order.labOrderPdfUrl } });
  }
  for (const doc of order.documents ?? []) {
    entries.push({ key: `doc-${doc.id}`, title: doc.fileName || t("document"), doc });
  }

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{t("labDocuments")}</Text>
      {entries.length === 0 ? (
        <Text style={[s.empty, { color: colors.textSecondary }]}>{t("noDocuments")}</Text>
      ) : (
        entries.map((e) => <LabDocumentItem key={e.key} doc={e.doc} title={e.title} onOpenImage={setZoomUri} />)
      )}
      <ZoomableImageModal uri={zoomUri} onClose={() => setZoomUri(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 8 },
});
