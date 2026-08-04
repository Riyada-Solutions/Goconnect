import React from "react";
import { View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import type { FlowSheetVascularAccessPre } from "@/data/models/flowSheet";

const PAIN_SCALE = Array.from({ length: 11 }, (_, i) => String(i));

const ACCESS_TYPE_OPTIONS = ["AVF", "AVG", "CVC", "Permacath"] as const;
const ACCESS_SITE_OPTIONS = [
  "Right Arm", "Left Arm", "Right Forearm", "Left Forearm", "Chest", "Neck", "Thigh",
] as const;
const ACCESS_PATENCY_OPTIONS = ["Thrill Present", "Weak Thrill", "Thrill Absent"] as const;
const BRUIT_OPTIONS = ["Normal", "Abnormal", "Absent"] as const;
const CATHETER_CONDITION_OPTIONS = ["Intact", "Damaged", "Kinked", "Leaking", "N/A"] as const;
const EXIT_SITE_APPEARANCE_OPTIONS = ["Clean & Dry", "Red", "Swollen", "Drainage", "Crusted"] as const;
const DRESSING_STATUS_OPTIONS = ["Clean & Intact", "Soiled", "Loose", "Needs Change"] as const;
const INFECTION_SIGNS_OPTIONS = ["None", "Redness", "Swelling", "Discharge", "Pain/Tenderness"] as const;
const EDEMA_OPTIONS = ["None", "Mild", "Moderate", "Severe"] as const;
const HEMATOMA_OPTIONS = ["None", "Small", "Moderate", "Large"] as const;
const CANNULATION_SITE_OPTIONS = ["Suitable", "Limited", "Not Suitable"] as const;
const BLOOD_FLOW_OPTIONS = ["Good", "Sluggish", "Poor"] as const;
const READY_FOR_DIALYSIS_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

interface Props {
  value: FlowSheetVascularAccessPre;
  onChange: (v: FlowSheetVascularAccessPre) => void;
  disabled?: boolean;
}

export function VascularAccessPreForm({ value, onChange, disabled }: Props) {
  const set = <K extends keyof FlowSheetVascularAccessPre>(key: K) =>
    (v: string) => onChange({ ...value, [key]: v });

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Access Type" value={value.accessType || null} options={ACCESS_TYPE_OPTIONS} placeholder="Choose" onChange={set("accessType")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Access Site" value={value.accessSite || null} options={ACCESS_SITE_OPTIONS} placeholder="Choose" onChange={set("accessSite")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Access Patency (AVF/AVG)" value={value.accessPatency || null} options={ACCESS_PATENCY_OPTIONS} placeholder="Choose" onChange={set("accessPatency")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Bruit (AVF/AVG)" value={value.bruit || null} options={BRUIT_OPTIONS} placeholder="Choose" onChange={set("bruit")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Catheter Condition" value={value.catheterCondition || null} options={CATHETER_CONDITION_OPTIONS} placeholder="Choose" onChange={set("catheterCondition")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Exit Site Appearance" value={value.exitSiteAppearance || null} options={EXIT_SITE_APPEARANCE_OPTIONS} placeholder="Choose" onChange={set("exitSiteAppearance")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Dressing Status" value={value.dressingStatus || null} options={DRESSING_STATUS_OPTIONS} placeholder="Choose" onChange={set("dressingStatus")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Signs Of Infection" value={value.infectionSigns || null} options={INFECTION_SIGNS_OPTIONS} placeholder="Choose" onChange={set("infectionSigns")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Pain Score" value={value.painScore || null} options={PAIN_SCALE} placeholder="Choose" onChange={set("painScore")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Edema" value={value.edema || null} options={EDEMA_OPTIONS} placeholder="Choose" onChange={set("edema")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Hematoma" value={value.hematoma || null} options={HEMATOMA_OPTIONS} placeholder="Choose" onChange={set("hematoma")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Cannulation Site (AVF/AVG)" value={value.cannulationSite || null} options={CANNULATION_SITE_OPTIONS} placeholder="Choose" onChange={set("cannulationSite")} disabled={disabled} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Blood Flow Before Start" value={value.bloodFlowBeforeStart || null} options={BLOOD_FLOW_OPTIONS} placeholder="Choose" onChange={set("bloodFlowBeforeStart")} disabled={disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Ready For Dialysis" value={value.readyForDialysis || null} options={READY_FOR_DIALYSIS_OPTIONS} placeholder="Choose" onChange={set("readyForDialysis")} disabled={disabled} />
        </View>
      </View>
    </View>
  );
}
