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
  } catch {
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
  } catch {
    // Background fetch may be unavailable in Expo Go — silently skip.
  }
}
