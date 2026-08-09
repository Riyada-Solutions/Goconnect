import { Audio } from 'expo-av'
import { Platform } from 'react-native'

export type NotificationType =
  | 'appointment'
  | 'emergency_referral'
  | 'lab_order'
  | 'lab_result'
  | 'medication'
  | 'dialysis_order'
  | 'incident'
  | 'holiday_treatment'
  | 'patient_document_reminder'
  | 'employee_document_reminder'
  | 'appointment_rescheduled'
  | 'isolation'
  | 'vaccine_overdue'
  | 'vaccine_due_soon'
  | 'task'

let soundInstance: Audio.Sound | null = null

async function loadSound(): Promise<Audio.Sound | null> {
  if (soundInstance) {
    return soundInstance
  }

  try {
    console.log('🔊 Loading notification sound...')
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sound/notification_sounbd.wav'),
    )
    soundInstance = sound
    console.log('✅ Notification sound loaded successfully')
    return sound
  } catch (error) {
    console.error(`❌ Failed to load notification sound:`, error)
    console.error('Stack:', (error as Error).stack)
    return null
  }
}

export async function playNotificationSound(type: NotificationType): Promise<void> {
  if (Platform.OS === 'web') return

  try {
    console.log(`🔔 Playing notification sound for type: ${type}`)
    const sound = await loadSound()
    if (sound) {
      console.log('📢 Sound loaded, resetting position...')
      await sound.setPositionAsync(0)
      console.log('▶️ Playing sound...')
      await sound.playAsync()
      console.log('✅ Sound played successfully')
    } else {
      console.warn('⚠️ Sound instance is null')
    }
  } catch (error) {
    console.error(`❌ Failed to play notification sound:`, error)
    console.error('Stack:', (error as Error).stack)
  }
}

export async function cleanup(): Promise<void> {
  if (soundInstance) {
    try {
      await soundInstance.unloadAsync()
    } catch (error) {
      console.warn('⚠️ Failed to unload sound:', error)
    }
    soundInstance = null
  }
}
