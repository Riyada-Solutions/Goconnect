import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";
import type { LabDocument } from "@/data/models/labResult";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";
import { getDocumentKind, openDocumentViewer } from "@/utils/openDocument";

interface LabDocumentItemProps {
  doc: LabDocument;
  title: string;
  onOpenImage: (uri: string) => void;
}

/** One lab document: images preview inline, PDFs and other links open the viewer. */
export function LabDocumentItem({ doc, title, onOpenImage }: LabDocumentItemProps) {
  const { t } = useApp();
  const { colors } = useTheme();
  const kind = getDocumentKind(doc.url, doc.mimeType);
  const meta = [doc.uploadedBy, doc.uploadedAt].filter(Boolean).join(" · ");

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (kind === "image") onOpenImage(doc.url);
    else openDocumentViewer(doc.url, kind, title);
  };

  const info = (
    <View style={s.info}>
      <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
      {doc.description ? (
        <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={2}>{doc.description}</Text>
      ) : null}
      {meta ? <Text style={[s.sub, { color: colors.textTertiary }]} numberOfLines={1}>{meta}</Text> : null}
    </View>
  );

  if (kind === "image") {
    return (
      <Pressable onPress={open} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Image source={{ uri: doc.url }} style={[s.preview, { backgroundColor: colors.borderLight }]} contentFit="cover" transition={150} />
        <View style={s.rowPad}>
          {info}
          <Feather name="maximize-2" size={16} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  }

  const icon = kind === "pdf" ? "file-text" : "link";
  return (
    <Pressable
      onPress={kind === "pdf" ? open : undefined}
      disabled={kind !== "pdf"}
      style={[s.card, s.rowPad, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[s.iconBox, { backgroundColor: Colors.pastel.teal }]}>
        <Feather name={icon} size={18} color={Colors.primary} />
      </View>
      {info}
      {kind === "pdf" ? (
        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
      ) : (
        <Pressable onPress={open} style={[s.viewBtn, { borderColor: Colors.primary }]}>
          <Feather name="eye" size={14} color={Colors.primary} />
          <Text style={[s.viewText, { color: Colors.primary }]}>{t("view")}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  rowPad: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  preview: { width: "100%", height: 180 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  viewText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
