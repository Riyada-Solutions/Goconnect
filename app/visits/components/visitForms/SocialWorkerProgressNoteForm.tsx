import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import type {
  SocialWorkerLocation,
  SocialWorkerProgressNote,
} from "@/types/socialWorkerProgressNote";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { ProgressNoteItem } from "./ProgressNoteItem";

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  previousNotes: SocialWorkerProgressNote[];
  onSave: (input: { note: string; location: SocialWorkerLocation }) => void;
  onPrint: (note: string) => void;
  t: (key: any) => string;
}

export function SocialWorkerProgressNoteForm({
  colors,
  isReadOnly,
  initialExpanded,
  previousNotes,
  onSave,
  onPrint,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [currentNote, setCurrentNote] = useState("");
  const [location, setLocation] = useState<SocialWorkerLocation>("on_call");

  const handleSave = () => {
    if (!currentNote.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({ note: currentNote.trim(), location });
    setCurrentNote("");
  };

  const handlePrint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrint(currentNote);
  };

  const done = previousNotes.length > 0 || currentNote.trim() !== "";
  const locationLabel = (loc: SocialWorkerLocation) => (loc === "on_call" ? t("onCall") : t("inCenter"));

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("socialWorkerProgressNote")}
        icon="file-text"
        iconColor="#7C3AED"
        badges={done ? [{ text: String(previousNotes.length), bg: "#EDE9FE", fg: "#7C3AED" }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      {open && (
        <View style={{ padding: 14, gap: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
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
                      setLocation(n.location);
                    }}
                    metaBelow={
                      <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 }}>
                        {locationLabel(n.location)}
                      </Text>
                    }
                    colors={colors}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 16 }}>
            <LocationCheckbox
              label={t("onCall")}
              checked={location === "on_call"}
              onPress={() => setLocation("on_call")}
              colors={colors}
            />
            <LocationCheckbox
              label={t("inCenter")}
              checked={location === "in_center"}
              onPress={() => setLocation("in_center")}
              colors={colors}
            />
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

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[
                s.saveFlowBtn,
                { backgroundColor: currentNote.trim() ? Colors.primary : colors.border, flex: 1 },
              ]}
              onPress={handleSave}
              disabled={!currentNote.trim()}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("save")}</Text>
            </Pressable>
            <Pressable style={[s.saveFlowBtn, { backgroundColor: "#F59E0B", flex: 1 }]} onPress={handlePrint}>
              <Feather name="printer" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("print")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
}

function LocationCheckbox({
  label,
  checked,
  onPress,
  colors,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 2,
          borderRadius: 4,
          borderColor: checked ? Colors.primary : colors.border,
          backgroundColor: checked ? Colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Feather name="check" size={13} color="#fff" />}
      </View>
      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text }}>{label}</Text>
    </Pressable>
  );
}
