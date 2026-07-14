import React from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'

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

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeightRatio={0.92}>
      <View style={[styles.body, { height: height * 0.8 }]}>
        {url ? <WebViewPanel url={url} /> : null}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: { width: '100%' },
})
