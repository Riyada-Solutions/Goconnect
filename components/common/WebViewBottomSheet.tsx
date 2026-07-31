import React, { useCallback } from 'react'
import { StyleSheet, View, Text, useWindowDimensions, Alert } from 'react-native'

import { BottomSheet } from '@/components/common/BottomSheet'
import { WebViewPanel } from '@/components/common/WebViewPanel'

interface WebViewBottomSheetProps {
  visible: boolean
  onClose: () => void
  /** The URL to load — pass a fully-built URL (see `utils/webviewURLCreater.ts`). */
  url: string | null
  /** Optional title rendered in the sheet header. */
  title?: string
}

/** Bottom sheet that renders a URL in an embedded webview. */
export function WebViewBottomSheet({ visible, onClose, url, title }: WebViewBottomSheetProps) {
  const { height } = useWindowDimensions()

  const handleCopyUrl = useCallback(() => {
    if (!url) return
    // Show alert with URL that user can copy
    Alert.alert(
      'WebView URL',
      url,
      [
        { text: 'Close', style: 'cancel' },
      ],
      { cancelable: true }
    )
  }, [url])

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeightRatio={0.92} onCopyUrl={url ? handleCopyUrl : undefined}>
      <View style={[styles.body, { height: height * 0.8 }]}>
        {url ? (
          <WebViewPanel url={url} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
              Loading URL...
            </Text>
          </View>
        )}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: { width: '100%' },
})
