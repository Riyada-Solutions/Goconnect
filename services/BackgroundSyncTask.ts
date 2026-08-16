import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'
import { flushQueue } from './SyncService'

const TASK_NAME = 'GOCONNECT_BACKGROUND_SYNC'

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const { synced } = await flushQueue()
    return synced > 0
  } catch (error) {
    console.warn('⚠️ Background sync failed:', error instanceof Error ? error.message : error)
    return false
  }
})

export async function registerBackgroundSync(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    })
  } catch (error) {
    console.debug('⚠️ Background task registration unavailable (Expo Go):', error instanceof Error ? error.message : error)
  }
}
