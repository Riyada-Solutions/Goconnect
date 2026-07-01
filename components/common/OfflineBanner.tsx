import { Feather } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetwork } from '@/context/NetworkContext'

export function OfflineBanner() {
  const { isOnline, pendingCount } = useNetwork()
  const { top } = useSafeAreaInsets()

  if (isOnline) return null

  const label = pendingCount > 0
    ? `Offline — ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`
    : "You are currently using offline mode."

  return (
    <View style={[styles.banner, { paddingTop: top+20 }]}>
      <Feather name="wifi-off" size={14} color="#fff" />
      <Text style={styles.text}>{label}</Text>
    </View>
  ) 
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
})
