import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useApp } from '@/context/AppContext'
import { FCM_TOKEN_STORAGE_KEY } from '@/utils/pushNotifications'
import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import { Feather } from '@expo/vector-icons'

const DEV_CODE = '100200'
const PHONE_NUMBER = '01020139072'

export default function DevScreen() {
  const { t, colors } = useApp()
  const [code, setCode] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTokens()
  }, [])

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

  const handleCodeSubmit = () => {
    if (code === DEV_CODE) {
      setIsUnlocked(true)
      setCode('')
    } else {
      Alert.alert('Invalid Code', 'The code you entered is incorrect.')
      setCode('')
    }
  }

  const shareToken = async (tokenType: 'firebase' | 'access') => {
    setLoading(true)
    try {
      const token = tokenType === 'firebase' ? firebaseToken : accessToken

      if (!token) {
        Alert.alert('Error', `${tokenType} token not found`)
        return
      }

      // Send to backend to share token via SMS
      const response = await fetch('https://nurse-app.careconnectksa.com/api/dev/share-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token,
          tokenType,
          phoneNumber: PHONE_NUMBER,
        }),
      })

      if (response.ok) {
        Alert.alert('Success', `${tokenType === 'firebase' ? 'Firebase' : 'Access'} token shared to ${PHONE_NUMBER}`)
      } else {
        Alert.alert('Error', 'Failed to share token')
      }
    } catch (error) {
      console.error('Error sharing token:', error)
      Alert.alert('Error', 'Failed to share token: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  if (!isUnlocked) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, justifyContent: 'center', minHeight: '100%' }}>
        <View style={{ gap: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center' }}>
            Developer Access
          </Text>

          <TextInput
            placeholder="Enter access code"
            placeholderTextColor={colors.textTertiary}
            value={code}
            onChangeText={setCode}
            secureTextEntry
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              fontSize: 16,
            }}
          />

          <Pressable
            onPress={handleCodeSubmit}
            style={{
              backgroundColor: '#3B82F6',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Unlock</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Developer Tools</Text>

        {/* Firebase Token Section */}
        <View style={{ backgroundColor: colors.borderLight, borderRadius: 8, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="send" size={18} color={colors.text} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>Firebase Token</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'monospace' }}>
            {firebaseToken ? firebaseToken.substring(0, 40) + '...' : 'Not available'}
          </Text>
          <Pressable
            onPress={() => shareToken('firebase')}
            disabled={loading || !firebaseToken}
            style={{
              backgroundColor: '#10B981',
              padding: 12,
              borderRadius: 6,
              alignItems: 'center',
              opacity: loading || !firebaseToken ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Share to {PHONE_NUMBER}</Text>
            )}
          </Pressable>
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
            onPress={() => shareToken('access')}
            disabled={loading || !accessToken}
            style={{
              backgroundColor: '#8B5CF6',
              padding: 12,
              borderRadius: 6,
              alignItems: 'center',
              opacity: loading || !accessToken ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Share to {PHONE_NUMBER}</Text>
            )}
          </Pressable>
        </View>

        {/* Lock Button */}
        <Pressable
          onPress={() => setIsUnlocked(false)}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
            borderRadius: 6,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>Lock Dev Tools</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
