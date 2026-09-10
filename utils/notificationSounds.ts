import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
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

let soundInstance: AudioPlayer | null = null

// expo-audio's createAudioPlayer is synchronous, unlike expo-av's
// Audio.Sound.createAsync, so this no longer needs to be async.
function loadSound(): AudioPlayer | null {
  if (soundInstance) {
    return soundInstance
  }

  try {
    console.log('🔊 Loading notification sound...')
    soundInstance = createAudioPlayer(
      require('../assets/sound/notification_sounbd.wav'),
    )
    console.log('✅ Notification sound loaded successfully')
    return soundInstance
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
    const player = loadSound()
    if (player) {
      console.log('📢 Sound loaded, resetting position...')
      await player.seekTo(0)
      console.log('▶️ Playing sound...')
      player.play()
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
      soundInstance.remove()
    } catch (error) {
      console.warn('⚠️ Failed to unload sound:', error)
    }
    soundInstance = null
  }
}
