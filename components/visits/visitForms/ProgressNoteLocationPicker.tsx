import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import {
  PROGRESS_NOTE_LOCATIONS,
  type ProgressNoteLocation,
} from "@/data/models/socialWorkerProgressNote";

/** One translation key per location; keep in step with `ProgressNoteLocation`. */
const LOCATION_LABEL_KEYS: Record<ProgressNoteLocation, string> = {
  on_call: "onCall",
  in_center: "inCenter",
  on_visit: "onVisit",
};

export const progressNoteLocationLabel = (
  loc: ProgressNoteLocation,
  t: (key: any) => string,
) => t(LOCATION_LABEL_KEYS[loc] ?? "inCenter");

/** Single-choice location row shared by the doctor and social-worker notes. */
export function ProgressNoteLocationPicker({
  value,
  onChange,
  colors,
  t,
}: {
  value: ProgressNoteLocation;
  onChange: (loc: ProgressNoteLocation) => void;
  colors: any;
  t: (key: any) => string;
}) {
  // Wraps rather than scrolls — three labels no longer fit one row
  // on a narrow phone, and Arabic labels are longer still.
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {PROGRESS_NOTE_LOCATIONS.map((loc) => (
        <LocationCheckbox
          key={loc}
          label={progressNoteLocationLabel(loc, t)}
          checked={value === loc}
          onPress={() => onChange(loc)}
          colors={colors}
        />
      ))}
    </View>
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
