import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { notificationDisplay, type NotificationAlert } from '@/utils/notificationDisplay'
import { navigateFromNotificationPayload } from '@/utils/pushNotifications'

export function NotificationBanner() {
  const [notification, setNotification] = useState<NotificationAlert | null>(null)
  const [slideAnim] = useState(new Animated.Value(-150))
  const { top } = useSafeAreaInsets()

  useEffect(() => {
    const unsubscribe = notificationDisplay.subscribe((notif) => {
      setNotification(notif)

      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()

      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        hideNotification()
      }, 5000)

      return () => clearTimeout(timer)
    })

    return unsubscribe
  }, [slideAnim])

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null)
    })
  }

  if (!notification) return null

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: top + 12, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Pressable
        style={styles.banner}
        onPress={() => {
          hideNotification()
          if (notification.payload) {
            navigateFromNotificationPayload(notification.payload)
          }
        }}
      >
        <View style={styles.content}>
          <Feather name="bell" size={16} color="#fff" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification.body}
            </Text>
          </View>
        </View>
        <Pressable onPress={hideNotification} hitSlop={10}>
          <Feather name="x" size={16} color="#fff" />
        </Pressable>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(19, 168, 189, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.95)',
  },
})
