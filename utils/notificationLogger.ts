import AsyncStorage from '@react-native-async-storage/async-storage'

const NOTIFICATION_LOGS_KEY = '@goconnect/notification_logs'
const MAX_LOGS = 50

export interface NotificationLog {
  id: string
  timestamp: string
  type: 'received' | 'tapped' | 'error' | 'token'
  title?: string
  body?: string
  data?: Record<string, any>
  message?: string
}

class NotificationLogger {
  private logs: NotificationLog[] = []

  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY)
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load notification logs:', error)
      this.logs = []
    }
  }

  async addLog(log: Omit<NotificationLog, 'id' | 'timestamp'>) {
    const newLog: NotificationLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }

    this.logs.unshift(newLog)

    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS)
    }

    await this.persist()
  }

  private async persist() {
    try {
      await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(this.logs))
    } catch (error) {
      console.error('Failed to persist notification logs:', error)
    }
  }

  getLogs(): NotificationLog[] {
    return [...this.logs]
  }

  async clearLogs() {
    this.logs = []
    try {
      await AsyncStorage.removeItem(NOTIFICATION_LOGS_KEY)
    } catch (error) {
      console.error('Failed to clear notification logs:', error)
    }
  }

  formatLogsAsText(): string {
    return this.logs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString()
        const type = log.type.toUpperCase()
        const title = log.title ? ` [${log.title}]` : ''
        const body = log.body ? ` - ${log.body}` : ''
        const msg = log.message ? ` - ${log.message}` : ''
        const data = log.data ? ` - ${JSON.stringify(log.data)}` : ''

        return `[${time}] ${type}${title}${body}${msg}${data}`
      })
      .join('\n')
  }
}

export const notificationLogger = new NotificationLogger()
