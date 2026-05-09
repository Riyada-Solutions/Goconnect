import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import { visitDetailStyles as s } from "@/app/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";

export type DateTimeMode = "date" | "time" | "datetime";

interface Props {
  mode?: DateTimeMode;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  placeholder?: string;
  editable?: boolean;
  isRtl?: boolean;
  style?: any;
}

const inputType = (mode: DateTimeMode) =>
  mode === "date" ? "date" : mode === "time" ? "time" : "datetime-local";

const toInputValue = (mode: DateTimeMode, raw: string): string => {
  if (!raw) return "";
  if (mode === "time") return raw.length >= 5 ? raw.slice(0, 5) : raw;
  if (mode === "date") return raw.length >= 10 ? raw.slice(0, 10) : raw;
  if (raw.includes("T")) return raw.slice(0, 16);
  if (raw.includes(" ")) return raw.replace(" ", "T").slice(0, 16);
  return raw;
};

const fromInputValue = (mode: DateTimeMode, val: string): string => {
  if (!val) return "";
  if (mode === "datetime") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return val;
};

const formatTime12h = (hhmm: string): string => {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
};

const formatDisplay = (mode: DateTimeMode, raw: string): string => {
  if (!raw) return "";
  if (mode === "time") return formatTime12h(raw.slice(0, 5));
  if (mode === "date") return raw.slice(0, 10);
  const v = toInputValue("datetime", raw);
  if (!v) return "";
  const [datePart, timePart] = v.split("T");
  return `${datePart} ${formatTime12h(timePart ?? "")}`.trim();
};

const placeholderFor = (mode: DateTimeMode, custom?: string) =>
  custom ?? (mode === "time" ? "hh:mm a" : mode === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd hh:mm a");

const iconName = (mode: DateTimeMode) => (mode === "time" ? "clock" : "calendar");

const valueToDate = (mode: DateTimeMode, raw: string): Date => {
  if (!raw) return new Date();
  if (mode === "time") {
    const [h, m] = raw.split(":").map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }
  if (mode === "date") {
    const d = new Date(`${raw.slice(0, 10)}T00:00:00`);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
};

const dateToValue = (mode: DateTimeMode, d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (mode === "time") return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (mode === "date") return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return d.toISOString();
};

export function DateTimeField({
  mode = "datetime",
  value,
  onChange,
  colors,
  placeholder,
  editable = true,
  isRtl = false,
  style,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [iosTempDate, setIosTempDate] = useState<Date>(() => valueToDate(mode, value));

  const containerStyle = [
    s.formInput,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      flexDirection: isRtl ? ("row-reverse" as const) : ("row" as const),
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      opacity: editable ? 1 : 0.6,
    },
    style,
  ];

  const display = formatDisplay(mode, value);
  const isEmpty = !display;

  const renderText = () => (
    <Text
      style={{
        color: isEmpty ? colors.textTertiary : colors.text,
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        flex: 1,
        textAlign: isRtl ? "right" : "left",
        writingDirection: isRtl ? "rtl" : "ltr",
      }}
    >
      {isEmpty ? placeholderFor(mode, placeholder) : display}
    </Text>
  );

  const renderIcon = () => (
    <Feather name={iconName(mode) as any} size={16} color={colors.textSecondary} />
  );

  if (Platform.OS === "web") {
    const handleIconClick = (e: any) => {
      e.stopPropagation();
      if (!editable) return;
      const el = inputRef.current;
      if (!el) return;
      try {
        if (typeof (el as any).showPicker === "function") (el as any).showPicker();
        else el.focus();
      } catch {
        el.focus();
      }
    };

    return (
      <View style={containerStyle as any}>
        {renderText()}
        {React.createElement(
          "div",
          {
            onClick: handleIconClick,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: editable ? "pointer" : "default",
              padding: 2,
              marginLeft: isRtl ? 0 : 4,
              marginRight: isRtl ? 4 : 0,
            },
          },
          renderIcon(),
        )}
        {React.createElement("input", {
          ref: inputRef,
          type: inputType(mode),
          value: toInputValue(mode, value),
          onChange: (e: any) => onChange(fromInputValue(mode, e.target.value)),
          disabled: !editable,
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: editable ? "pointer" : "default",
            border: "none",
            background: "transparent",
            color: "transparent",
            padding: 0,
            margin: 0,
          },
        })}
      </View>
    );
  }

  const openNative = () => {
    if (!editable) return;
    const initial = valueToDate(mode, value);
    if (Platform.OS === "android") {
      const { DateTimePickerAndroid } = require("@react-native-community/datetimepicker");
      const openMode = (m: "date" | "time") =>
        DateTimePickerAndroid.open({
          value: initial,
          mode: m,
          is24Hour: false,
          onChange: (event: any, selected?: Date) => {
            if (event.type !== "set" || !selected) return;
            if (mode === "datetime" && m === "date") {
              const datePart = selected;
              DateTimePickerAndroid.open({
                value: datePart,
                mode: "time",
                is24Hour: false,
                onChange: (ev2: any, sel2?: Date) => {
                  if (ev2.type !== "set" || !sel2) return;
                  const merged = new Date(
                    datePart.getFullYear(),
                    datePart.getMonth(),
                    datePart.getDate(),
                    sel2.getHours(),
                    sel2.getMinutes(),
                  );
                  onChange(dateToValue("datetime", merged));
                },
              });
            } else {
              onChange(dateToValue(mode, selected));
            }
          },
        });
      openMode(mode === "time" ? "time" : "date");
      return;
    }
    setIosTempDate(initial);
    setIosPickerOpen(true);
  };

  return (
    <>
      <Pressable onPress={openNative} style={containerStyle as any} disabled={!editable}>
        {renderText()}
        {renderIcon()}
      </Pressable>
      {Platform.OS === "ios" && (
        <Modal visible={iosPickerOpen} transparent animationType="fade" onRequestClose={() => setIosPickerOpen(false)}>
          <Pressable
            onPress={() => setIosPickerOpen(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ backgroundColor: colors.surface, paddingBottom: 24 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <Pressable onPress={() => setIosPickerOpen(false)}>
                  <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(dateToValue(mode, iosTempDate));
                    setIosPickerOpen(false);
                  }}
                >
                  <Text style={{ color: Colors.primary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    Done
                  </Text>
                </Pressable>
              </View>
              {(() => {
                const DateTimePicker = require("@react-native-community/datetimepicker").default;
                return (
                  <DateTimePicker
                    value={iosTempDate}
                    mode={mode === "datetime" ? "datetime" : mode}
                    display="spinner"
                    is24Hour={false}
                    onChange={(_e: any, d?: Date) => d && setIosTempDate(d)}
                    themeVariant={colors.background?.startsWith?.("#0") ? "dark" : "light"}
                  />
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
