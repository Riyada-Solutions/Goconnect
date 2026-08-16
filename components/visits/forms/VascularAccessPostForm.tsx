import React from "react";
import { Text, TextInput, View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import type { FlowSheetVascularAccessPost } from "@/data/models/flowSheet";

import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";

const PAIN_SCALE = Array.from({ length: 11 }, (_, i) => String(i));

const HEMOSTASIS_TIME_OPTIONS = [
  { value: "under_10", label: "Under 10 min" },
  { value: "10_15", label: "10 - 15 min" },
  { value: "15_20", label: "15 - 20 min" },
  { value: "over_20", label: "Over 20 min" },
];
const BLEEDING_OPTIONS = ["None", "Minimal", "Moderate", "Severe"] as const;
const THRILL_OPTIONS = ["Present", "Weak", "Absent"] as const;
const BRUIT_OPTIONS = ["Normal", "Abnormal", "Absent"] as const;
const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];
const LOCKING_SOLUTION_OPTIONS = ["Heparin", "Citrate", "Saline", "N/A"] as const;
const EXIT_SITE_AFTER_OPTIONS = ["Clean", "Red", "Swollen", "Drainage"] as const;
const COMPLICATIONS_OPTIONS = ["None", "Bleeding", "Infiltration", "Hematoma", "Infection"] as const;
const ACCESS_STATUS_DISCHARGE_OPTIONS = ["Stable", "Monitor", "Unstable"] as const;

interface Props {
  value: FlowSheetVascularAccessPost;
  onChange: (v: FlowSheetVascularAccessPost) => void;
  colors: any;
  disabled?: boolean;
}

export function VascularAccessPostForm({ value, onChange, colors, disabled }: Props) {
  const set = <K extends keyof FlowSheetVascularAccessPost>(key: K) =>
    (v: string) => onChange({ ...value, [key]: v });

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Hemostasis Time (AVF/AVG)" value={value.hemostasisTime || null} options={HEMOSTASIS_TIME_OPTIONS} placeholder="Choose" onChange={set("hemostasisTime")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Bleeding After Needle Removal" value={value.bleedingAfterNeedleRemoval || null} options={BLEEDING_OPTIONS} placeholder="Choose" onChange={set("bleedingAfterNeedleRemoval")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Thrill After Dialysis" value={value.thrillAfter || null} options={THRILL_OPTIONS} placeholder="Choose" onChange={set("thrillAfter")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Bruit After Dialysis" value={value.bruitAfter || null} options={BRUIT_OPTIONS} placeholder="Choose" onChange={set("bruitAfter")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Catheter Locked" value={value.catheterLocked || null} options={YES_NO_OPTIONS} placeholder="Choose" onChange={set("catheterLocked")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Locking Solution" value={value.lockingSolution || null} options={LOCKING_SOLUTION_OPTIONS} placeholder="Choose" onChange={set("lockingSolution")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Dressing Applied" value={value.dressingApplied || null} options={YES_NO_OPTIONS} placeholder="Choose" onChange={set("dressingApplied")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Exit Site After Treatment" value={value.exitSiteAfter || null} options={EXIT_SITE_AFTER_OPTIONS} placeholder="Choose" onChange={set("exitSiteAfter")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Pain After Treatment" value={value.painAfter || null} options={PAIN_SCALE} placeholder="Choose" onChange={set("painAfter")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Complications" value={value.complications || null} options={COMPLICATIONS_OPTIONS} placeholder="Choose" onChange={set("complications")} disabled={disabled} />
        </View>
      </View>
      <SelectField label="Access Status On Discharge" value={value.accessStatusDischarge || null} options={ACCESS_STATUS_DISCHARGE_OPTIONS} placeholder="Choose" onChange={set("accessStatusDischarge")} disabled={disabled} />

      <View>
        <Text style={[s.formLabel, { color: colors.text }]}>Nurse Comments / Actions Taken</Text>
        <TextInput
          style={[
            s.formInput,
            {
              minHeight: 70,
              textAlignVertical: "top",
              color: disabled ? colors.textSecondary : colors.text,
              backgroundColor: disabled ? colors.borderLight : colors.surface,
              borderColor: disabled ? colors.borderLight : colors.border,
            },
          ]}
          value={value.nurseComments}
          onChangeText={set("nurseComments")}
          placeholder="Access site status, actions taken..."
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          multiline
        />
      </View>

      <View>
        <Text style={[s.formLabel, { color: colors.text }]}>Physician Notification (If Applicable)</Text>
        <TextInput
          style={[
            s.formInput,
            {
              minHeight: 70,
              textAlignVertical: "top",
              color: disabled ? colors.textSecondary : colors.text,
              backgroundColor: disabled ? colors.borderLight : colors.surface,
              borderColor: disabled ? colors.borderLight : colors.border,
            },
          ]}
          value={value.physicianNotification}
          onChangeText={set("physicianNotification")}
          placeholder="Notes on physician notification, if any..."
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          multiline
        />
      </View>
    </View>
  );
}
