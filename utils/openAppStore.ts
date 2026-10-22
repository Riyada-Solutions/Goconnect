import { Linking, Platform } from "react-native";

const IOS_APP_ID = "6761141367";
const ANDROID_PACKAGE = "com.careconnectksa.nurse";

function nativeStoreUrl(): string {
  if (Platform.OS === "android") {
    return `market://details?id=${ANDROID_PACKAGE}`;
  }
  return `itms-apps://apps.apple.com/app/id${IOS_APP_ID}`;
}

function webStoreUrl(): string {
  if (Platform.OS === "android") {
    return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  }
  return `https://apps.apple.com/app/id${IOS_APP_ID}`;
}

/** Opens the App Store / Play Store app directly (falls back to https if needed). */
export async function openAppStore(): Promise<void> {
  try {
    await Linking.openURL(nativeStoreUrl());
  } catch {
    await Linking.openURL(webStoreUrl()).catch(() => {});
  }
}
