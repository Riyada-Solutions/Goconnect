import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";

interface Props {
  author: string;
  note: string;
  createdAt: string;
  copyLabel: string;
  onCopy: () => void;
  metaBelow?: React.ReactNode;
  colors: any;
}

export function ProgressNoteItem({ author, note, createdAt, copyLabel, onCopy, metaBelow, colors }: Props) {
  return (
    <View
      style={{
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.card,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text }}>{author}</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary }}>
          {new Date(createdAt).toLocaleString()}
        </Text>
      </View>
      <Pressable
        onPress={onCopy}
        style={{
          alignSelf: "flex-start",
          backgroundColor: Colors.primary,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          marginBottom: 6,
        }}
      >
        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{copyLabel}</Text>
      </Pressable>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text, lineHeight: 19 }}>
        {note}
      </Text>
      {metaBelow}
    </View>
  );
}
