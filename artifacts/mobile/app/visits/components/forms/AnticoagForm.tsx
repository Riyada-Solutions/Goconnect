import React from "react";

import { SelectField } from "@/components/ui/SelectField";

export const ANTICOAG_OPTIONS = [
  "Heparin",
  "Low Molecular Weight Heparin",
  "Citrate",
  "Nafamostat",
  "Argatroban",
  "None",
] as const;

interface Props {
  type: string;
  onChange: (v: string) => void;
  colors: any;
  disabled?: boolean;
}

export function AnticoagForm({ type, onChange, colors: _colors, disabled }: Props) {
  return (
    <SelectField
      label="Anticoagulation Type"
      value={type || null}
      options={ANTICOAG_OPTIONS}
      placeholder="Select type..."
      onChange={onChange}
      disabled={disabled}
    />
  );
}
