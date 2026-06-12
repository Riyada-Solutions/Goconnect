
# Expo / EAS Commands Reference

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## COMMON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Start Metro bundler (debug mode, clears cache)
npx expo start --clear

# Build for both iOS and Android (testing)
eas build --platform all --profile preview

# Build for both iOS and Android (production)
eas build --platform all --profile production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ANDROID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Run on emulator (debug)
npx expo run:android

# Run on device (release)
npx expo run:android --variant release

# Build APK - direct install, no Play Store (EAS)
eas build --platform android --profile preview

# Build APK - locally, no EAS needed
npx expo run:android --variant release
# APK output: android/app/build/outputs/apk/release/app-release.apk

# Build AAB - for Google Play Store (EAS)
eas build --platform android --profile production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## iOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Run on simulator (debug)
npx expo run:ios

# Run on device (release)
npx expo run:ios --configuration Release

# Build IPA - internal testers, direct link, no TestFlight (EAS)
eas build --platform ios --profile preview

# Build IPA - for App Store / TestFlight (EAS)
eas build --platform ios --profile production

# ── Push to TestFlight via EAS ──────────────────
# Step 1 - Build
eas build --platform ios --profile production
# Step 2 - Submit
eas submit --platform ios --profile production

# ── Push to TestFlight via Xcode (no EAS needed) ─
# Use when EAS free quota is used up

# Step 1 - Generate native iOS project
npx expo prebuild --platform ios --clean

# Step 2 - Open in Xcode
open ios/Goconnect.xcworkspace

# Step 3 - In Xcode:
#   - Select project → Signing & Capabilities
#   - Set Team to your Apple Developer account
#   - Enable "Automatically manage signing"
#   - In top bar select "Any iOS Device (arm64)"

# Step 4 - Archive
#   Xcode menu → Product → Archive → wait to finish

# Step 5 - Distribute
#   Organizer → Distribute App → App Store Connect → Upload
#   Then appstoreconnect.apple.com → TestFlight (appears in ~15 min)
