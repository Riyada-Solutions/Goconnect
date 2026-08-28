import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, Clipboard } from "react-native";

import { Card } from "@/components/common/Card";
import { WebViewBottomSheet } from "@/components/common/WebViewBottomSheet";
import { getDialysisOrderUrl } from "@/utils/webviewURLCreater";
import { useApp } from "@/context/AppContext";

interface Props {
  visitId: number;
  colors: any;
}

/** Visit form section that opens the web app's Dialysis Order tab in a webview bottom sheet. */
export function DialysisOrderWebViewForm({ visitId, colors }: Props) {
  const { refreshAppSettings } = useApp();
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getDialysisOrderUrl(visitId).then((builtUrl) => {
      console.log('🔗 DialysisOrderForm URL:', builtUrl);
      setUrl(builtUrl);
    }).catch((err) => {
      console.log('❌ Error building URL:', err);
    });
  }, [visitId]);

  const handleOpen = () => {
    setVisible(true);
  };

  const handleCopyUrl = () => {
    if (!url) {
      Alert.alert('URL not ready', 'URL is still being built. Try again in a moment.');
      return;
    }
    Clipboard.setString(url);
    Alert.alert('Copied!', 'URL copied to clipboard');
  };

  return (
    <>
      <Card style={styles.card}>
        <Pressable style={styles.row} onPress={handleOpen}>
          <Feather name="file-text" size={18} color="#4F46E5" />
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            Dialysis Order
          </Text>
          <Pressable onPress={handleCopyUrl} hitSlop={8}>
            <Feather name="copy" size={16} color={colors.textTertiary} />
          </Pressable>
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
