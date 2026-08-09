import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Share, Clipboard, Switch, Modal, TextInput } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/hooks/useTheme'
import { useNetwork } from '@/context/NetworkContext'
import { FCM_TOKEN_STORAGE_KEY, refreshPushToken } from '@/utils/pushNotifications'
import { notificationLogger, type NotificationLog } from '@/utils/notificationLogger'
import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import { Feather } from '@expo/vector-icons'
import { fetchNotificationTypes, sendTestNotification } from '@/utils/notificationAPI'
import type { NotificationType } from '@/utils/notificationSounds'
import { ENV } from '@/constants/env'

export default function DevScreen() {
  const { colors } = useTheme()
  const { devOfflineMode, setDevOfflineMode, isOnline, pendingCount } = useNetwork()
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([])
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null)
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [isFetchingTypes, setIsFetchingTypes] = useState(false)
  const [selectedType, setSelectedType] = useState<NotificationType | null>(null)
  const [testTitle, setTestTitle] = useState('Test Notification')
  const [testBody, setTestBody] = useState('This is a test notification')
  const [testId, setTestId] = useState('123')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)

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

  const handleFetchNotificationTypes = async () => {
    try {
      setIsFetchingTypes(true)
      const types = await fetchNotificationTypes()
      setNotificationTypes(types)
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0])
      }
      Alert.alert('Success', `Fetched ${types.length} notification types`)
    } catch (error) {
      Alert.alert('Error', `Failed to fetch notification types: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingTypes(false)
    }
  }

  const handleSendTestNotification = async () => {
    if (!firebaseToken) {
      Alert.alert('Error', 'Firebase token not available')
      return
    }

    if (!selectedType) {
      Alert.alert('Error', 'Please select a notification type')
      return
    }

    try {
      setIsSendingTest(true)
      const response = await sendTestNotification({
        token: firebaseToken,
        title: testTitle || 'Test Notification',
        body: testBody || 'This is a test',
        type: selectedType,
        id: parseInt(testId) || 123,
      })

      if (response.data.success) {
        Alert.alert('Success', 'Test notification sent successfully')
      } else {
        Alert.alert('Error', `Failed to send notification: ${response.message || 'Unknown error'}`)
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send test notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleCopyLog = async (log: NotificationLog) => {
    const text = formatLogAsText(log)
    await Clipboard.setString(text)
    Alert.alert('Success', 'Log copied to clipboard')
  }

  const formatLogAsText = (log: NotificationLog): string => {
    const time = new Date(log.timestamp).toLocaleTimeString()
    const type = log.type.toUpperCase()
    const title = log.title ? `Title: ${log.title}\n` : ''
    const body = log.body ? `Body: ${log.body}\n` : ''
    const msg = log.message ? `Message: ${log.message}\n` : ''
    const data = log.data ? `Data: ${JSON.stringify(log.data, null, 2)}\n` : ''

    return `[${time}] ${type}\n${title}${body}${msg}${data}`
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Developer Tools</Text>

        {/* Offline Mode Status Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, borderLeftWidth: 4, borderLeftColor: devOfflineMode ? '#dc2626' : '#16a34a', shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
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

        {/* Offline Mode Toggle Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
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

        {/* Firebase Token Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
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

        {/* Access Token Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
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

        {/* API Domain Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="globe" size={18} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>API Domain</Text>
          </View>
          <View style={{ backgroundColor: colors.borderLight, borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Current Domain (WebView & Notifications):</Text>
            <Text style={{ fontSize: 13, color: colors.text, fontFamily: 'monospace', fontWeight: '600' }}>
              {ENV.API_BASE_URL || 'Not configured'}
            </Text>
          </View>
        </View>

        {/* Send Test Notification Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="send" size={18} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>Send Test Notification</Text>
          </View>

          {/* Fetch Types Button */}
          <Pressable
            onPress={handleFetchNotificationTypes}
            disabled={isFetchingTypes}
            style={{
              backgroundColor: '#6366F1',
              padding: 12,
              borderRadius: 6,
              alignItems: 'center',
              opacity: isFetchingTypes ? 0.6 : 1,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isFetchingTypes ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="list" size={16} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
              {isFetchingTypes ? 'Fetching...' : 'Fetch Notification Types'}
            </Text>
          </Pressable>

          {/* Type Selector */}
          {notificationTypes.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Notification Type</Text>
              <Pressable
                onPress={() => setShowTypeSelector(!showTypeSelector)}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  borderRadius: 6,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '500' }}>
                  {selectedType || 'Select a type'}
                </Text>
                <Feather name={showTypeSelector ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
              </Pressable>

              {showTypeSelector && (
                <View style={{ backgroundColor: colors.surface, borderRadius: 6, maxHeight: 200 }}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {notificationTypes.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => {
                          setSelectedType(type)
                          setShowTypeSelector(false)
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderLight,
                          backgroundColor: selectedType === type ? colors.borderLight : 'transparent',
                        }}
                      >
                        <Text style={{ color: colors.text, fontWeight: selectedType === type ? '600' : '400' }}>
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Title Input */}
          {notificationTypes.length > 0 && (
            <>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Title</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    fontWeight: '500',
                  }}
                  placeholder="Test Notification"
                  placeholderTextColor={colors.textSecondary}
                  value={testTitle}
                  onChangeText={setTestTitle}
                />
              </View>

              {/* Body Input */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Body</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    fontWeight: '500',
                    height: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="This is a test notification"
                  placeholderTextColor={colors.textSecondary}
                  value={testBody}
                  onChangeText={setTestBody}
                  multiline
                />
              </View>

              {/* ID Input */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>ID</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    fontWeight: '500',
                  }}
                  placeholder="123"
                  placeholderTextColor={colors.textSecondary}
                  value={testId}
                  onChangeText={setTestId}
                  keyboardType="number-pad"
                />
              </View>

              {/* Send Button */}
              <Pressable
                onPress={handleSendTestNotification}
                disabled={isSendingTest || !selectedType}
                style={{
                  backgroundColor: '#EC4899',
                  padding: 12,
                  borderRadius: 6,
                  alignItems: 'center',
                  opacity: isSendingTest || !selectedType ? 0.6 : 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {isSendingTest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="send" size={16} color="#fff" />
                )}
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                  {isSendingTest ? 'Sending...' : 'Send Test Notification'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Notification Logs Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, shadowColor: "rgba(0,0,0,0.06)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
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
                    <Pressable
                      key={log.id}
                      onPress={() => setSelectedLog(log)}
                      style={({ pressed }) => [
                        {
                          marginBottom: 8,
                          paddingBottom: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderLight,
                          borderRadius: 4,
                          backgroundColor: pressed ? colors.borderLight : 'transparent',
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <Text style={{ fontSize: 10, color: colors.textTertiary }}>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
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
                          </View>
                          {log.title && <Text style={{ fontSize: 11, color: colors.text, fontWeight: '500', marginTop: 2 }}>{log.title}</Text>}
                          {log.body && <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{log.body}</Text>}
                          {log.message && <Text style={{ fontSize: 10, color: colors.textTertiary, fontStyle: 'italic', marginTop: 1 }}>{log.message}</Text>}
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.textTertiary} style={{ marginTop: 4 }} />
                      </View>
                    </Pressable>
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
      </ScrollView>

      {/* Log Detail Modal */}
    <Modal visible={!!selectedLog} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ backgroundColor: colors.surface, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Log Details</Text>
            <Pressable onPress={() => setSelectedLog(null)} hitSlop={10}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {selectedLog && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
            {/* Type Badge */}
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor:
                    selectedLog.type === 'error'
                      ? '#fee2e2'
                      : selectedLog.type === 'token'
                        ? '#dbeafe'
                        : selectedLog.type === 'tapped'
                          ? '#dcfce7'
                          : '#f3e8ff',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color:
                      selectedLog.type === 'error'
                        ? '#dc2626'
                        : selectedLog.type === 'token'
                          ? '#2563eb'
                          : selectedLog.type === 'tapped'
                            ? '#059669'
                            : '#7c3aed',
                  }}
                >
                  {selectedLog.type.toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {new Date(selectedLog.timestamp).toLocaleString()}
              </Text>
            </View>

            {/* Title */}
            {selectedLog.title && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>TITLE</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 14, color: colors.text }}>{selectedLog.title}</Text>
                </View>
              </View>
            )}

            {/* Body */}
            {selectedLog.body && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>BODY</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 14, color: colors.text }}>{selectedLog.body}</Text>
                </View>
              </View>
            )}

            {/* Message */}
            {selectedLog.message && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>MESSAGE</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 14, color: colors.text }}>{selectedLog.message}</Text>
                </View>
              </View>
            )}

            {/* Data */}
            {selectedLog.data && Object.keys(selectedLog.data).length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>DATA</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'monospace' }}>
                    {JSON.stringify(selectedLog.data, null, 2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Timestamp */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>TIMESTAMP</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'monospace' }}>
                  {selectedLog.timestamp}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => handleCopyLog(selectedLog)}
                style={{
                  backgroundColor: '#3B82F6',
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Feather name="copy" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Copy Details</Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedLog(null)}
                style={{
                  backgroundColor: colors.borderLight,
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
    </View>
  )
}
