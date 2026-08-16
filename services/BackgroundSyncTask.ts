// @ts-ignore - expo-background-fetch is deprecated but still functional
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'
import { flushQueue } from './SyncService'

const TASK_NAME = 'GOCONNECT_BACKGROUND_SYNC'

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const { synced } = await flushQueue()
    return synced > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData
  } catch (error) {
    console.warn('⚠️ Background sync failed:', error instanceof Error ? error.message : error)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function registerBackgroundSync(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    })
  } catch (error) {
    // Background fetch unavailable in Expo Go — silently skip
  }
}
