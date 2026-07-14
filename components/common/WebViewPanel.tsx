import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'

import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import { useTheme } from '@/hooks/useTheme'

interface WebViewPanelProps {
  /** The URL to load — pass a fully-built URL (see `utils/webviewURLCreater.ts`). */
  url: string
}

/** Reusable widget that renders a URL in an embedded webview, with loading/error states. */
export function WebViewPanel({ url }: WebViewPanelProps) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(ACCESS_TOKEN_KEY).then((value) => {
      setToken(value)
      setTokenReady(true)
    })
  }, [])

  const showWebView = tokenReady && !error
  const showLoading = (loading || !tokenReady) && !error

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showWebView && (
        <WebView
          source={{
            uri: url,
            // The webview is embedded in-app, so (unlike an external browser
            // link) it can also carry the access token as a real header —
            // this only applies to the initial request, the `token` query
            // param on the URL itself is what covers client-side navigation.
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
          style={[styles.webview, { backgroundColor: colors.background }]}
          containerStyle={{ backgroundColor: colors.background }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      )}
      {error && (
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <Feather name="alert-triangle" size={28} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Failed to load this page.
          </Text>
        </View>
      )}
      {showLoading && (
        <View
          style={[
            styles.centerState,
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
})
