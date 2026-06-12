BUILD APK
Windose
eas build --platform android --profile preview
eas build --platform ios --profile preview

MAC
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production

BUILD AAB
npx eas-cli build -p android --profile production

RUN 
Debug
npx expo start --clear

Release 
npx expo run:ios --configuration Release
npx expo run:android --variant release


SUBMIT WITHOUT EAS

iOS (manual via Transporter on Mac)
1. Download IPA from EAS dashboard
2. Open Transporter app (Mac App Store - free)
3. Drag IPA into Transporter → click Deliver

iOS (via Xcode)
Xcode → Window → Organizer → Distribute App

Android (manual APK upload)
1. eas build --platform android --profile preview
2. Download APK from EAS dashboard
3. Upload to Google Play Console → Internal Testing → upload APK

Local APK (no EAS)
npx expo run:android --variant release
APK path: android/app/build/outputs/apk/release/app-release.apk
