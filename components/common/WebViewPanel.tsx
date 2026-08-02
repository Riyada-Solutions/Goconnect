import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'

import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import { useTheme } from '@/hooks/useTheme'
import { log } from '@/utils/logger'

interface WebViewPanelProps {
  /** The URL to load — pass a fully-built URL (see `utils/webviewURLCreater.ts`). */
  url: string
}

/** Reusable widget that renders a URL in an embedded webview, with loading/error states. */
export function WebViewPanel({ url }: WebViewPanelProps) {
  const { colors } = useTheme()
  const webViewRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)
  const [callbacksFired, setCallbacksFired] = useState<string[]>([])
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    console.log('🎬 WebViewPanel received URL:', url, 'URL empty?', !url);
    if (!url) {
      console.warn('⚠️ WebViewPanel: URL is empty!')
    }
    let isMounted = true

    AsyncStorage.getItem(ACCESS_TOKEN_KEY).then((value) => {
      if (!isMounted) return
      setToken(value)
      setTokenReady(true)
      console.log('✅ WebViewPanel token ready:', { hasToken: !!value, url, tokenValue: value ? `${value.substring(0, 20)}...` : 'none' });
      log('WebViewPanel.token', `hasToken=${!!value}, url=${url}`)
    }).catch((err) => {
      if (!isMounted) return
      console.error('❌ Error fetching token:', err)
      setToken(null)
      setTokenReady(true)
    })

    return () => {
      isMounted = false
    }
  }, [url])

  // Timeout if loading takes too long (8 seconds) — force error display
  useEffect(() => {
    if (!loading || error) return
    const timeout = setTimeout(() => {
      console.log('[WebView] Timeout after 8s, no callbacks fired:', callbacksFired)
      setLoading(false)
      setError(true)
      log('WebViewPanel.timeout', `URL did not load in 8s: ${url}`)
    }, 8000)
    return () => clearTimeout(timeout)
  }, [loading, error, url, callbacksFired])

  const handleRetry = () => {
    setError(false)
    setLoading(true)
    setCallbacksFired([])
    setRetryCount(r => r + 1)
    if (webViewRef.current) {
      webViewRef.current.reload()
    }
  }

  const showWebView = tokenReady && !error
  const showLoading = (loading || !tokenReady) && !error

  // Log the state when WebView is about to render
  if (showWebView) {
    console.log('🔴 RENDER: WebView about to render with state:', {
      url,
      urlEmpty: !url,
      tokenReady,
      token: token ? `${token.substring(0, 20)}...` : null,
      error,
      showWebView
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Debug: Show URL on screen if empty */}
      {!url && (
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            ⚠️ No URL provided
          </Text>
        </View>
      )}
      {showWebView && (
        <WebView
          ref={webViewRef}
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
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          decelerationRate="normal"
          scrollEnabled={true}
          nestedScrollEnabled={true}
          originWhitelist={['*']}
          renderLoading={() => (
            <View style={[styles.centerState, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={[{ fontSize: 12, color: colors.textTertiary, marginTop: 12 }]}>
                Loading WebView...
              </Text>
            </View>
          )}
          onLoadStart={() => {
            console.log('📱 [WebView] onLoadStart fired with URL:', url)
            console.log('🔴 WebView source.uri was:', url)
            setCallbacksFired(p => [...p, 'onLoadStart'])
            setLoading(true)
            log('WebView.onLoadStart', `url=${url}`)
          }}
          onLoadEnd={() => {
            console.log('✅ [WebView] onLoadEnd fired - page fully loaded')
            setCallbacksFired(p => [...p, 'onLoadEnd'])
            setLoading(false)
            log('WebView.onLoadEnd', `url=${url}`)
          }}
          onError={(syntheticEvent) => {
            console.error('❌ [WebView] onError:', syntheticEvent.nativeEvent.description)
            setCallbacksFired(p => [...p, 'onError'])
            setLoading(false)
            setError(true)
            log('WebView.onError', `url=${url}, error=${syntheticEvent.nativeEvent.description}`)
          }}
          onHttpError={(syntheticEvent) => {
            console.error('❌ [WebView] onHttpError:', syntheticEvent.nativeEvent.statusCode)
            setCallbacksFired(p => [...p, `onHttpError(${syntheticEvent.nativeEvent.statusCode})`])
            log('WebView.onHttpError', `url=${url}, statusCode=${syntheticEvent.nativeEvent.statusCode}`)
          }}
          injectedJavaScript={`
            (function() {
              try {
                document.body.style.backgroundColor = 'white';
                document.documentElement.style.backgroundColor = 'white';

                const hasContent = document.body.innerText.length > 0;
                const currentUrl = window.location.href;
                const bodyChildCount = document.body.children.length;

                if (!hasContent) {
                  document.body.innerHTML = '<div style="padding: 20px; color: red; font-size: 14px; font-family: monospace;">No content loaded\\n\\nURL: ' + currentUrl + '\\nBody children: ' + bodyChildCount + '</div>';
                }

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'content_check',
                  hasContent: hasContent,
                  currentUrl: currentUrl,
                  bodyChildCount: bodyChildCount,
                  title: document.title
                }));
              } catch (e) {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'error',
                  message: e.toString()
                }));
              }
            })();
            true;
          `}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data)
              console.log('[WebView] onMessage:', data)
              if (data.type === 'content_check') {
                console.log('[WebView] Content check:', {
                  hasContent: data.hasContent,
                  url: data.currentUrl,
                  bodyChildren: data.bodyChildCount,
                  title: data.title
                })
              } else if (data.type === 'error') {
                console.error('[WebView] JavaScript error:', data.message)
              }
            } catch (e) {
              console.error('[WebView] Failed to parse message:', e)
            }
          }}
        />
      )}
      {error && (
        <View style={[styles.centerState, { backgroundColor: colors.background, padding: 20 }]}>
          <Feather name="alert-triangle" size={28} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Failed to load WebView
          </Text>
          <Text style={[{ fontSize: 11, color: colors.textTertiary, marginTop: 12, fontFamily: 'monospace', textAlign: 'center' }]}>
            {`Callbacks fired: ${callbacksFired.join(', ') || 'NONE'}\n\nToken: ${token ? '✓ Ready' : '✗ Missing'}\n\nURL:\n${url}`}
          </Text>
          <Text style={[{ fontSize: 12, color: colors.textTertiary, marginTop: 16 }]}>
            Check: Network • Domain • ATS Settings
          </Text>
          <Pressable
            style={[styles.retryBtn, { marginTop: 20, backgroundColor: colors.info ?? '#3B82F6' }]}
            onPress={handleRetry}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14, marginLeft: 6 }}>
              Retry
            </Text>
          </Pressable>
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
  retryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
})
