import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="app-settings" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="about" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
