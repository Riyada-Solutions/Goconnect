import React, { createContext, useContext, useCallback, useRef } from 'react'

type RefreshCallback = () => void

interface RefreshContextType {
  onTabRefresh: (callback: RefreshCallback) => void
  triggerRefresh: (tab: string) => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const callbacksRef = useRef<{ [key: string]: Set<RefreshCallback> }>({})

  const onTabRefresh = useCallback((callback: RefreshCallback) => {
    if (!callbacksRef.current[callback.toString()]) {
      callbacksRef.current[callback.toString()] = new Set()
    }
    callbacksRef.current[callback.toString()].add(callback)

    return () => {
      callbacksRef.current[callback.toString()].delete(callback)
    }
  }, [])

  const triggerRefresh = useCallback((tab: string) => {
    Object.values(callbacksRef.current).forEach((set) => {
      set.forEach((callback) => callback())
    })
  }, [])

  return (
    <RefreshContext.Provider value={{ onTabRefresh, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useTabRefresh() {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error('useTabRefresh must be used within RefreshProvider')
  }
  return context
}
