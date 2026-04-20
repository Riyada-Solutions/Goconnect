import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  // @ts-ignore - exported but not in types
  getReactNativePersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const iosConfig = {
  apiKey: "AIzaSyA1OZTZ_7bmuZKI46bbaUqAI_L8nGrflfM",
  authDomain: "careconnect-nurse.firebaseapp.com",
  projectId: "careconnect-nurse",
  storageBucket: "careconnect-nurse.firebasestorage.app",
  messagingSenderId: "695023650711",
  appId: "1:695023650711:ios:37cd745d7bf50f8e5366d2",
};

const androidConfig = {
  apiKey: "AIzaSyC2c9VhlO-FvuRdOw0YRPwXDfVZY8wtBI8",
  authDomain: "careconnect-nurse.firebaseapp.com",
  projectId: "careconnect-nurse",
  storageBucket: "careconnect-nurse.firebasestorage.app",
  messagingSenderId: "695023650711",
  appId: "1:695023650711:android:37a0c38fea6f1d9f5366d2",
};

const webConfig = androidConfig;

const config =
  Platform.OS === "ios"
    ? iosConfig
    : Platform.OS === "android"
      ? androidConfig
      : webConfig;

const app = getApps().length ? getApp() : initializeApp(config);

let auth: Auth;
try {
  auth =
    Platform.OS === "web"
      ? getAuth(app)
      : initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
} catch {
  auth = getAuth(app);
}

const firestore: Firestore = getFirestore(app);

export const firebase = {
  app,
  auth,
  firestore,
};

export { app, auth, firestore };
