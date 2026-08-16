import React, { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { machineDisplayLabel } from "@/data/models/machine";
import { useMachines } from "@/hooks/useMachines";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  /** Stored value is the backend `machine_id` (as a string). */
  machine: string;
  onChange: (v: string) => void;
  colors: any;
  disabled?: boolean;
}

export function MachinesForm({ machine, onChange, colors: _colors, disabled }: Props) {
  const { colors } = useTheme();
  const { data, isLoading, isError } = useMachines();

  const options = useMemo<SelectOption[]>(() => {
    if (!data) return [];
    return data.map((m) => ({ value: String(m.id), label: machineDisplayLabel(m) }));
  }, [data]);

  // Preserve the previously-saved value even if the machine is no longer in
  // the catalog (decommissioned, branch swap, etc.) so the user still sees it.
  const optionsWithCurrent = useMemo<SelectOption[]>(() => {
    if (!machine) return options;
    const exists = options.some((o) =>
      typeof o === "string" ? o === machine : o.value === machine,
    );
    if (exists) return options;
    return [{ value: machine, label: `Machine ${machine}` }, ...options];
  }, [options, machine]);

  return (
    <View>
      <SelectField
        label="Choose Machine"
        value={machine || null}
        options={optionsWithCurrent}
        placeholder={isLoading ? "Loading machines..." : "Select machine..."}
        onChange={onChange}
        disabled={disabled || isLoading}
      />
      {isLoading && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
            Loading machines…
          </Text>
        </View>
      )}
      {isError && (
        <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 6, fontFamily: "Inter_400Regular" }}>
          Couldn't load machines from server.
        </Text>
      )}
    </View>
  );
}
