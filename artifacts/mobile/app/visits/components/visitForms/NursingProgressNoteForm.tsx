import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import type { NursingProgressNote } from "@/data/models/nursingProgressNote";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { ProgressNoteItem } from "./ProgressNoteItem";

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  /** When true, render without the outer Card + CollapsibleHeader — intended
   *  for use inside a shared group (e.g. Progress Note). */
  embedded?: boolean;
  previousNotes: NursingProgressNote[];
  onSave: (note: string) => void;
  t: (key: any) => string;
}

export function NursingProgressNoteForm({
  colors,
  isReadOnly,
  initialExpanded,
  embedded,
  previousNotes,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [currentNote, setCurrentNote] = useState("");

  const handleSave = () => {
    if (!currentNote.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(currentNote.trim());
    setCurrentNote("");
  };

  const done = previousNotes.length > 0 || currentNote.trim() !== "";

  const body = (
    <View style={{ gap: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
      <View>
        <Text style={[s.formLabel, { color: colors.text, marginBottom: 8 }]}>{t("previousProgressNotes")}</Text>
        {previousNotes.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            {t("noPreviousNotes")}
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {previousNotes.map((n) => (
              <ProgressNoteItem
                key={n.id}
                author={n.author}
                note={n.note}
                createdAt={n.createdAt}
                copyLabel={t("copy")}
                onCopy={() => {
                  Haptics.selectionAsync();
                  setCurrentNote(n.note);
                }}
                colors={colors}
              />
            ))}
          </View>
        )}
      </View>

      <View>
        <Text style={[s.formLabel, { color: colors.text }]}>{t("currentProgressNotes")}</Text>
        <TextInput
          style={[
            s.formInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              minHeight: 120,
              textAlignVertical: "top",
            },
          ]}
          value={currentNote}
          onChangeText={setCurrentNote}
          placeholder={t("progressNotePlaceholder")}
          placeholderTextColor={colors.textTertiary}
          multiline
          editable={!isReadOnly}
        />
      </View>

      <Pressable
        style={[s.saveFlowBtn, { backgroundColor: currentNote.trim() ? Colors.primary : colors.border }]}
        onPress={handleSave}
        disabled={!currentNote.trim()}
      >
        <Feather name="save" size={16} color="#fff" />
        <Text style={s.mainBtnText}>{t("save")}</Text>
      </Pressable>
    </View>
  );

  if (embedded) return body;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("nursingProgressNote")}
        icon="file-text"
        iconColor="#2563EB"
        badges={done ? [{ text: String(previousNotes.length), bg: "#DBEAFE", fg: "#2563EB" }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      {open && body}
    </Card>
  );
}
