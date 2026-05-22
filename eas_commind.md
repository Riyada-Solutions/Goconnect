BUILD APK
windose
eas build --platform android --profile preview
eas build --platform ios --profile preview

mac
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production

BUILD AAB
npx eas-cli build -p android --profile production

RUN 
npx expo start --clear