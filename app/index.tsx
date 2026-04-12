import { Redirect } from "expo-router";
import React from "react";

import { useApp } from "@/context/AppContext";

export default function Index() {
  const { user, isReady } = useApp();
  if (!isReady) return null;
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/(auth)/login" />;
}
