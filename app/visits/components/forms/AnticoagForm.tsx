import React from "react";

import { FormField } from "../FormField";

interface Props {
  type: string;
  onChange: (v: string) => void;
  colors: any;
}

export function AnticoagForm({ type, onChange, colors }: Props) {
  return (
    <FormField
      label="Anticoagulation Type"
      value={type}
      onChangeText={onChange}
      colors={colors}
      placeholder="Choose..."
    />
  );
}
