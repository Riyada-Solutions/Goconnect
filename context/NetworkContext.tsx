import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { queueCount } from '@/data/offline_queue'

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
      const online = !!(state.isConnected && state.isInternetReachable)
      setIsOnline(online)
      wasOnlineRef.current = online
    })

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable)
      setIsOnline(online)

      // Flush queue only on offline → online transition
      if (online && !wasOnlineRef.current && onReconnect) {
        onReconnect().then(() => refreshPendingCount())
      }
      wasOnlineRef.current = online
    })

    return unsubscribe
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
