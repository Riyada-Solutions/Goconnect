import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { queueCount, subscribeToQueueChanges } from '@/data/offline_queue'

interface NetworkContextValue {
  isOnline: boolean
  pendingCount: number
  refreshPendingCount: () => void
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
  const wasOnlineRef = useRef(true)

  const refreshPendingCount = useCallback(() => {
    setPendingCount(queueCount())
  }, [])

  useEffect(() => {
    // Seed initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      // See data/offline_api.ts: isInternetReachable can be a stale/false
      // negative `null`/`false` probe result even while genuinely online,
      // so only an explicit `false` counts as offline.
      const online = !!state.isConnected && state.isInternetReachable !== false
      setIsOnline(online)
      wasOnlineRef.current = online
    })
    refreshPendingCount()

    // Keep pendingCount live as items are queued/synced/failed/cleared,
    // not just after a reconnect flush.
    const unsubscribeQueue = subscribeToQueueChanges(refreshPendingCount)

    const unsubscribeNetwork = NetInfo.addEventListener((state: NetInfoState) => {
      // See data/offline_api.ts: isInternetReachable can be a stale/false
      // negative `null`/`false` probe result even while genuinely online,
      // so only an explicit `false` counts as offline.
      const online = !!state.isConnected && state.isInternetReachable !== false
      setIsOnline(online)

      // Flush queue only on offline → online transition
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

  return (
    <NetworkContext.Provider value={{ isOnline, pendingCount, refreshPendingCount }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  return useContext(NetworkContext)
}
