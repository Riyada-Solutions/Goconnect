import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { Card } from "@/components/common/Card";
import { WebViewBottomSheet } from "@/components/common/WebViewBottomSheet";
import { getDialysisOrderUrl } from "@/utils/webviewURLCreater";

interface Props {
  visitId: number;
  colors: any;
}

/** Visit form section that opens the web app's Dialysis Order tab in a webview bottom sheet. */
export function DialysisOrderForm({ visitId, colors }: Props) {
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleOpen = () => {
    setVisible(true);
    if (!url) getDialysisOrderUrl(visitId).then(setUrl);
  };

  return (
    <>
      <Card style={styles.card}>
        <Pressable style={styles.row} onPress={handleOpen}>
          <Feather name="file-text" size={18} color="#4F46E5" />
          <Text style={[styles.title, { color: colors.text }]}>Dialysis Order</Text>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </Card>
      <WebViewBottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        url={url}
        title="Dialysis Order"
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
