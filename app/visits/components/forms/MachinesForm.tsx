import React from "react";

import { FormField } from "../FormField";

interface Props {
  machine: string;
  onChange: (v: string) => void;
  colors: any;
}

export function MachinesForm({ machine, onChange, colors }: Props) {
  return (
    <FormField
      label="Choose Machine"
      value={machine}
      onChangeText={onChange}
      colors={colors}
      placeholder="e.g. 49827 | W45832"
    />
  );
}
