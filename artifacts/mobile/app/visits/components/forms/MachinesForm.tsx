import React from "react";

import { SelectField } from "@/components/ui/SelectField";

export const MACHINE_OPTIONS = [
  "Fresenius 4008S",
  "Fresenius 5008S",
  "Fresenius 6008",
  "Nipro Surdial X",
  "Nipro Surdial 55 Plus",
  "B.Braun Dialog+",
  "B.Braun Dialog Adv",
  "Nikkiso DBB-06",
  "Gambro AK 200S",
  "Toray TR-321",
] as const;

interface Props {
  machine: string;
  onChange: (v: string) => void;
  colors: any;
  disabled?: boolean;
}

export function MachinesForm({ machine, onChange, colors: _colors, disabled }: Props) {
  return (
    <SelectField
      label="Choose Machine"
      value={machine || null}
      options={MACHINE_OPTIONS}
      placeholder="Select machine..."
      onChange={onChange}
      disabled={disabled}
    />
  );
}
