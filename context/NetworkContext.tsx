import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { queueCount, subscribeToQueueChanges } from '@/data/offline_queue'

const DEV_OFFLINE_OVERRIDE_KEY = '@goconnect/dev_offline_override'

interface NetworkContextValue {
  isOnline: boolean
  pendingCount: number
  refreshPendingCount: () => void
  devOfflineMode?: boolean
  setDevOfflineMode?: (enabled: boolean) => Promise<void>
}

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  pendingCount: 0,
  refreshPendingCount: () => {},
})

export function NetworkProvider({ children, onReconnect }: {
  children: React.ReactNode
  onReconnect?: () => Promise<void>
}) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [devOfflineMode, setDevOfflineMode] = useState(false)
  const wasOnlineRef = useRef(true)

  const refreshPendingCount = useCallback(() => {
    setPendingCount(queueCount())
  }, [])

  const handleSetDevOfflineMode = useCallback(async (enabled: boolean) => {
    setDevOfflineMode(enabled)
    if (enabled) {
      await AsyncStorage.setItem(DEV_OFFLINE_OVERRIDE_KEY, 'true')
    } else {
      await AsyncStorage.removeItem(DEV_OFFLINE_OVERRIDE_KEY)
    }
  }, [])

  useEffect(() => {
    // Load dev offline override setting
    AsyncStorage.getItem(DEV_OFFLINE_OVERRIDE_KEY).then(val => {
      setDevOfflineMode(val === 'true')
    })

    // Seed initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      const online = !!state.isConnected && state.isInternetReachable !== false
      setIsOnline(online)
      wasOnlineRef.current = online
    })
    refreshPendingCount()

    // Keep pendingCount live as items are queued/synced/failed/cleared
    const unsubscribeQueue = subscribeToQueueChanges(refreshPendingCount)

    const unsubscribeNetwork = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!state.isConnected && state.isInternetReachable !== false
      setIsOnline(online)

      // Flush queue only on offline → online transition (if not in dev offline mode)
      if (online && !wasOnlineRef.current && onReconnect) {
        onReconnect().then(() => refreshPendingCount())
      }
      wasOnlineRef.current = online
    })

    return () => {
      unsubscribeQueue()
      unsubscribeNetwork()
    }
  }, [onReconnect, refreshPendingCount])

  // Dev offline mode overrides actual network status
  const effectiveIsOnline = devOfflineMode ? false : isOnline

  return (
    <NetworkContext.Provider value={{
      isOnline: effectiveIsOnline,
      pendingCount,
      refreshPendingCount,
      devOfflineMode,
      setDevOfflineMode: handleSetDevOfflineMode
    }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  return useContext(NetworkContext)
}
