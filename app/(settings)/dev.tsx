import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Share, Clipboard, Switch } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/hooks/useTheme'
import { useNetwork } from '@/context/NetworkContext'
import { FCM_TOKEN_STORAGE_KEY, refreshPushToken } from '@/utils/pushNotifications'
import { notificationLogger, type NotificationLog } from '@/utils/notificationLogger'
import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import { Feather } from '@expo/vector-icons'

export default function DevScreen() {
  const { colors } = useTheme()
  const { devOfflineMode, setDevOfflineMode, isOnline, pendingCount } = useNetwork()
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([])

  useEffect(() => {
    loadTokens()
  }, [])

  useEffect(() => {
    // Subscribe to real-time log updates
    const unsubscribe = notificationLogger.subscribe((logs) => {
      setNotificationLogs(logs)
    })

    return unsubscribe
  }, [])

  useFocusEffect(
    useCallback(() => {
      setNotificationLogs(notificationLogger.getLogs())
    }, [])
  )

  const loadTokens = async () => {
    try {
      const fbToken = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY)
      const authToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
      setFirebaseToken(fbToken)
      setAccessToken(authToken)
    } catch (error) {
      console.error('Error loading tokens:', error)
    }
  }

  const shareToken = async (token: string | null, type: 'firebase' | 'access') => {
    if (!token) {
      Alert.alert('Error', 'Token not available')
      return
    }
    try {
      await Share.share({
        message: `${type === 'firebase' ? 'Firebase' : 'Access'} Token: ${token}`,
        title: `${type === 'firebase' ? 'Firebase' : 'Access'} Token`,
      })
    } catch (error) {
      if (error instanceof Error && error.message !== 'User did not share') {
        console.error('Share error:', error)
      }
    }
  }

  const copyToken = async (token: string | null, type: string) => {
    if (!token) {
      Alert.alert('Error', 'Token not available')
      return
    }
    await Clipboard.setString(token)
    Alert.alert('Success', `${type} token copied to clipboard`)
  }

  const refreshFcmToken = async () => {
    try {
      setIsRefreshing(true)
      const newToken = await refreshPushToken()
      if (newToken) {
        setFirebaseToken(newToken)
        Alert.alert('Success', `Token refreshed: ${newToken.substring(0, 20)}...`)
      } else {
        Alert.alert(
          'Error',
          'Failed to get new token. Rebuild a native app with Firebase (`npx expo run:ios`) — Expo Go cannot register FCM.',
        )
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      Alert.alert('Error', 'Failed to refresh token')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCopyLogs = async () => {
    const text = notificationLogger.formatLogsAsText()
    if (!text) {
      Alert.alert('No logs', 'No notification logs to copy')
      return
    }
    await Clipboard.setString(text)
    Alert.alert('Success', 'Notification logs copied to clipboard')
  }

  const handleShareLogs = async () => {
    const text = notificationLogger.formatLogsAsText()
    if (!text) {
      Alert.alert('No logs', 'No notification logs to share')
      return
    }
    try {
      await Share.share({
        message: text,
        title: 'Notification Logs',
      })
    } catch (error) {
      if (error instanceof Error && error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share logs')
      }
    }
  }

  const handleClearLogs = async () => {
    Alert.alert('Clear logs?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await notificationLogger.clearLogs()
          setNotificationLogs([])
          Alert.alert('Success', 'Notification logs cleared')
        },
      },
    ])
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Developer Tools</Text>

        {/* Offline Mode Status */}
        <View style={{ backgroundColor: devOfflineMode ? '#fee2e2' : '#f0fdf4', borderRadius: 8, padding: 16, gap: 12, borderLeftWidth: 4, borderLeftColor: devOfflineMode ? '#dc2626' : '#16a34a' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name={devOfflineMode ? 'wifi-off' : 'wifi'} size={20} color={devOfflineMode ? '#dc2626' : '#16a34a'} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: devOfflineMode ? '#991b1b' : '#166534' }}>
                {devOfflineMode ? 'OFFLINE MODE' : 'ONLINE MODE'}
              </Text>
              <Text style={{ fontSize: 13, color: devOfflineMode ? '#7f1d1d' : '#3f6319', marginTop: 2 }}>
                Actual network: {isOnline && !devOfflineMode ? '✓ Connected' : '✗ Disconnected'}
              </Text>
              {pendingCount > 0 && (
                <Text style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontWeight: '600' }}>
                  ⏳ {pendingCount} item{pendingCount !== 1 ? 's' : ''} queued for sync
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Offline Mode Toggle */}
        <View style={{ backgroundColor: colors.borderLight, borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Feather name="settings" size={18} color={colors.text} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                Dev Offline Mode
              </Text>
            </View>
            <Switch
              value={devOfflineMode ?? false}
              onValueChange={(val) => {
                setDevOfflineMode?.(val)
              }}
              trackColor={{ false: '#d1d5db', true: '#ef4444' }}
              thumbColor={devOfflineMode ? '#991b1b' : '#fff'}
            />
          </View>
          <Text style={{ fontSize: 11, color: colors.textTertiary, fontStyle: 'italic' }}>
            Toggle to simulate offline mode. Overrides actual network for testing.
          </Text>
        </View>

        {/* Firebase Token Section */}
        <View style={{ backgroundColor: colors.borderLight, borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="send" size={18} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>Firebase Token</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'monospace' }}>
            {firebaseToken ? firebaseToken.substring(0, 40) + '...' : 'Not available'}
          </Text>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => shareToken(firebaseToken, 'firebase')}
              disabled={!firebaseToken || isRefreshing}
              style={{
                backgroundColor: '#10B981',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
                opacity: !firebaseToken || isRefreshing ? 0.6 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Feather name="share-2" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Share</Text>
            </Pressable>
            <Pressable
              onPress={() => copyToken(firebaseToken, 'Firebase')}
              disabled={!firebaseToken || isRefreshing}
              style={{
                backgroundColor: '#3B82F6',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
                opacity: !firebaseToken || isRefreshing ? 0.6 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Feather name="copy" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Copy</Text>
            </Pressable>
            <Pressable
              onPress={refreshFcmToken}
              disabled={isRefreshing}
              style={{
                backgroundColor: '#F59E0B',
                padding: 12,
                borderRadius: 6,
                alignItems: 'center',
                opacity: isRefreshing ? 0.6 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#fff" />
              )}
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Access Token Section */}
        <View style={{ backgroundColor: colors.borderLight, borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="key" size={18} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>Access Token</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'monospace' }}>
            {accessToken ? accessToken.substring(0, 40) + '...' : 'Not available'}
          </Text>
          <Pressable
            onPress={() => shareToken(accessToken, 'access')}
            disabled={!accessToken}
            style={{
              backgroundColor: '#8B5CF6',
              padding: 12,
              borderRadius: 6,
              alignItems: 'center',
              opacity: !accessToken ? 0.6 : 1,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Feather name="share-2" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Share</Text>
          </Pressable>
        </View>

        {/* Notification Logs Section */}
        <View style={{ backgroundColor: colors.borderLight, borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Feather name="bell" size={18} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>
              Notification Logs ({notificationLogs.length})
            </Text>
          </View>

          {notificationLogs.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.textTertiary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
              No notifications logged yet
            </Text>
          ) : (
            <>
              <View style={{ backgroundColor: colors.background, borderRadius: 6, padding: 10, maxHeight: 200 }}>
                <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled>
                  {notificationLogs.map((log) => (
                    <View key={log.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View>
                          <Text style={{ fontSize: 10, color: colors.textTertiary }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color:
                                log.type === 'error'
                                  ? '#dc2626'
                                  : log.type === 'token'
                                    ? '#2563eb'
                                    : log.type === 'tapped'
                                      ? '#059669'
                                      : '#7c3aed',
                            }}
                          >
                            [{log.type.toUpperCase()}]
                          </Text>
                          {log.title && <Text style={{ fontSize: 11, color: colors.text, fontWeight: '500' }}>{log.title}</Text>}
                          {log.body && <Text style={{ fontSize: 10, color: colors.textSecondary }}>{log.body}</Text>}
                          {log.message && <Text style={{ fontSize: 10, color: colors.textTertiary, fontStyle: 'italic' }}>{log.message}</Text>}
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={{ gap: 8 }}>
                <Pressable
                  onPress={handleCopyLogs}
                  style={{
                    backgroundColor: '#3B82F6',
                    padding: 12,
                    borderRadius: 6,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Feather name="copy" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Copy Logs</Text>
                </Pressable>

                <Pressable
                  onPress={handleShareLogs}
                  style={{
                    backgroundColor: '#10B981',
                    padding: 12,
                    borderRadius: 6,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Feather name="share-2" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Share Logs</Text>
                </Pressable>

                <Pressable
                  onPress={handleClearLogs}
                  style={{
                    backgroundColor: '#EF4444',
                    padding: 12,
                    borderRadius: 6,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Feather name="trash-2" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Clear Logs</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
