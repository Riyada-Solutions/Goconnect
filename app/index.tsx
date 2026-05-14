import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";

import { useApp } from "@/context/AppContext";
import { getFaceToken } from "@/data/secure_storage";

export default function Index() {
  const { user, isReady } = useApp();
  const [checking, setChecking] = useState(true);
  const [needsBioUnlock, setNeedsBioUnlock] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!user) { setChecking(false); return; }

    (async () => {
      try {
        const enabled = await AsyncStorage.getItem("@goconnect/biometric");
        if (enabled === "true") {
          const faceToken = await getFaceToken();
          if (faceToken) {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (compatible && enrolled) setNeedsBioUnlock(true);
          }
        }
      } catch {}
      finally {
        setChecking(false);
      }
    })();
  }, [isReady, user]);

  // Wait until both AppContext and biometric check are done
  if (!isReady || (user && checking)) return null;

  if (user) {
    if (needsBioUnlock) return <Redirect href="/biometric-unlock" />;
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/(auth)/login" />;
}
