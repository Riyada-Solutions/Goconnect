import { Feather } from '@expo/vector-icons'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetwork } from '@/context/NetworkContext'
import { deleteItem, peekAll, subscribeToQueueChanges, type QueuedMutation } from '@/data/offline_queue'
import { flushQueue, retryItem, subscribeToSyncActivity } from '@/services/SyncService'
import { BottomSheet } from '@/components/common/BottomSheet'
import { useTheme } from '@/hooks/useTheme'
import { Colors } from '@/theme/colors'
import { describeQueuedAction, describeVisitContext } from '@/utils/offlineLabels'

export function OfflineBanner() {
  const { isOnline, pendingCount, refreshPendingCount } = useNetwork()
  const { top } = useSafeAreaInsets()
  const [sheetVisible, setSheetVisible] = useState(false)

  if (isOnline && pendingCount === 0) return null

  const label = isOnline
    ? `Syncing — ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`
    : pendingCount > 0
      ? `Offline — ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`
      : 'You are currently using offline mode.'

  return (
    <>
      <Pressable
        onPress={() => pendingCount > 0 && setSheetVisible(true)}
        style={[
          styles.banner,
          { paddingTop: top + 20, backgroundColor: isOnline ? '#0F766E' : '#F59E0B' },
        ]}
      >
        <Feather name={isOnline ? 'upload-cloud' : 'wifi-off'} size={14} color="#fff" />
        <Text style={styles.text}>{label}</Text>
        {pendingCount > 0 && (
          <Feather name="chevron-right" size={16} color="#fff" style={{ marginLeft: 'auto' }} />
        )}
      </Pressable>
      <PendingChangesSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onQueueChanged={refreshPendingCount}
      />
    </>
  )
}

function PendingChangesSheet({
  visible,
  onClose,
  onQueueChanged,
}: {
  visible: boolean
  onClose: () => void
  onQueueChanged: () => void
}) {
  const { colors } = useTheme()
  const [items, setItems] = useState<QueuedMutation[]>([])
  const [retryingAll, setRetryingAll] = useState(false)
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [activeSyncId, setActiveSyncId] = useState<number | null>(null)

  const reload = useCallback(() => {
    setItems(peekAll())
  }, [])

  React.useEffect(() => {
    if (visible) reload()
  }, [visible, reload])

  // Keep the list (and its loading spinner) live while the sheet is open,
  // even when a retry is happening automatically in the background (e.g.
  // triggered by reconnect), not just from a manual "Retry" tap here.
  React.useEffect(() => {
    if (!visible) return
    const unsubQueue = subscribeToQueueChanges(reload)
    const unsubActivity = subscribeToSyncActivity(setActiveSyncId)
    return () => {
      unsubQueue()
      unsubActivity()
    }
  }, [visible, reload])

  const handleDiscard = useCallback(
    (item: QueuedMutation) => {
      Alert.alert(
        'Discard this change?',
        'This pending change will be permanently removed and will not be sent to the server.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              deleteItem(item.id)
              reload()
              onQueueChanged()
            },
          },
        ],
      )
    },
    [reload, onQueueChanged],
  )

  const handleRetryOne = useCallback(
    async (item: QueuedMutation) => {
      setRetryingId(item.id)
      try {
        await retryItem(item.id)
      } finally {
        setRetryingId(null)
        reload()
        onQueueChanged()
      }
    },
    [reload, onQueueChanged],
  )

  const handleRetryAll = useCallback(async () => {
    setRetryingAll(true)
    try {
      await flushQueue()
    } finally {
      setRetryingAll(false)
      reload()
      onQueueChanged()
    }
  }, [reload, onQueueChanged])

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Pending changes"
      subtitle={`${items.length} change${items.length === 1 ? '' : 's'} waiting to sync`}
    >
      <View style={styles.sheetHeader}>
        <Pressable
          onPress={handleRetryAll}
          disabled={retryingAll || items.length === 0}
          style={[
            styles.retryAllBtn,
            { backgroundColor: Colors.primary, opacity: retryingAll || items.length === 0 ? 0.5 : 1 },
          ]}
        >
          {retryingAll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="refresh-cw" size={14} color="#fff" />
          )}
          <Text style={styles.retryAllText}>Retry all</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nothing pending — everything is synced.
          </Text>
        ) : (
          items.map((item) => {
            const isRetrying = retryingId === item.id || activeSyncId === item.id
            return (
              <View
                key={item.id}
                style={[styles.row, { borderColor: colors.borderLight, backgroundColor: colors.background }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    {describeQueuedAction(item.url)}
                  </Text>
                  {describeVisitContext(item.url, item.visitId) ? (
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                      {describeVisitContext(item.url, item.visitId)}
                    </Text>
                  ) : null}
                  {isRetrying ? (
                    <Text style={[styles.rowPending, { color: Colors.primary }]}>Retrying…</Text>
                  ) : item.lastError ? (
                    <Text style={[styles.rowError, { color: '#DC2626' }]} numberOfLines={3}>
                      {item.lastError} {item.retries > 0 ? `(retried ${item.retries}x)` : ''}
                    </Text>
                  ) : (
                    <Text style={[styles.rowPending, { color: colors.textSecondary }]}>
                      Waiting to sync…
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => handleRetryOne(item)}
                  disabled={isRetrying}
                  hitSlop={8}
                  style={[styles.iconBtn, { backgroundColor: 'rgba(15,118,110,0.1)' }]}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Feather name="refresh-cw" size={16} color={Colors.primary} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => handleDiscard(item)}
                  disabled={isRetrying}
                  hitSlop={8}
                  style={[styles.iconBtn, { backgroundColor: 'rgba(220,38,38,0.1)' }]}
                >
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </Pressable>
              </View>
            )
          })
        )}
      </ScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  banner: {
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
  sheetHeader: { paddingHorizontal: 20, paddingBottom: 4 },
  retryAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  retryAllText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  sheetBody: { paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  rowSubtitle: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  rowError: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  rowPending: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
