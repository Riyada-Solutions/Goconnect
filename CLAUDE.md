# GoConnect (CareConnect Nurse)

Expo SDK 57 / React Native 0.86.3 / Hermes / New Architecture. Bundle id `com.careconnectksa.nurse`, Apple team `N3R8MF955Y`, ASC app id `6761141367`. Package manager: **npm** (`pnpm-lock.yaml` is a stale leftover).

## How the owner ships iOS

- **Expo is only used to run the app locally** (`npm run dev` / `npx expo run:ios`).
- **TestFlight uploads are done with Xcode, not EAS** — the EAS free build quota is used up. Do not run `eas build` / `eas submit` unless explicitly asked.
- Command-line equivalent of Xcode → Archive → Distribute (uses the Apple account signed in to Xcode). Confirm with the user before uploading:
  ```bash
  cd ios
  export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
  xcodebuild -workspace Goconnect.xcworkspace -scheme Goconnect -configuration Release \
    -destination 'generic/platform=iOS' -archivePath build/Goconnect.xcarchive -allowProvisioningUpdates archive
  xcodebuild -exportArchive -archivePath build/Goconnect.xcarchive \
    -exportOptionsPlist build/ExportOptions.plist -exportPath build/export -allowProvisioningUpdates
  ```
  `ExportOptions.plist`: `method=app-store-connect`, `destination=upload`, `teamID=N3R8MF955Y`, `signingStyle=automatic`.
- **Build number must be higher than the last one in App Store Connect** (EAS builds also count; last known: 58 on 2026-09-18). Set it in both `app.json` → `ios.buildNumber` and `ios/Goconnect/Info.plist` → `CFBundleVersion`. If Apple replies "bundle version must be higher than … ‘N’", use N+1.
- `ios/Goconnect/Goconnect.entitlements` must keep `aps-environment` = `production`; `expo prebuild` resets it to `development`.
- CocoaPods crashes with `unicode_normalize` errors in shells without a UTF-8 locale — export `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` before `pod install` / `expo prebuild`.

## Startup crash in TestFlight after the Expo upgrade (fixed 2026-09-18)

**Symptom:** app works with Expo in development but crashes immediately when opened from TestFlight.

**Root cause:** a hand edit inside `node_modules/expo-modules-jsi/.../Runtime/JavaScriptRuntime.swift` (made to get past an Xcode 26.2 / Swift 6.2 compile error) force-unwrapped the JSI arguments pointer: `UnsafePointer(bitPattern: argumentsAddr)!`. Hermes passes a **null** arguments pointer for zero-argument calls (native getters), so the release app hit `EXC_BREAKPOINT` in `createFunctionClosure` while loading the JS bundle.

**Fix:** `patches/expo-modules-jsi+57.1.0.patch` keeps the compile fix but leaves the arguments pointer optional. It is applied automatically by `patch-package` (`postinstall` script in `package.json`). If `expo-modules-jsi` is upgraded, check whether the patch still applies / is still needed.

**Things that were tried and were NOT the cause — don't repeat them:**
- Disabling the New Architecture (`RCTNewArchEnabled: false`) — RN 0.86 + Reanimated 4 require it; never turn it off.
- Adding `LSMinimumSystemVersion` / changing `UIRequiresFullScreen` in Info.plist.
- Deleting `ios/Podfile.lock` (keep it committed).
- Wrapping JS startup code in more try/catch — the crash was native, not JS.

## How to debug a release-only (TestFlight) crash on this Mac

1. Reproduce locally with a **Release** build in the simulator (same as TestFlight, no Metro):
   ```bash
   cd ios && export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
   xcodebuild -workspace Goconnect.xcworkspace -scheme Goconnect -configuration Release \
     -sdk iphonesimulator -destination 'id=<SIM_UDID>' -derivedDataPath build/dd CODE_SIGNING_ALLOWED=NO
   xcrun simctl install <SIM_UDID> build/dd/Build/Products/Release-iphonesimulator/Goconnect.app
   xcrun simctl launch <SIM_UDID> com.careconnectksa.nurse
   ```
2. If it dies, read the newest `~/Library/Logs/DiagnosticReports/Goconnect-*.ips` (crashed thread + `exception`).
3. Symbolicate unnamed frames with the dSYM from `build/dd/Build/Products/Release-iphonesimulator/` (e.g. `xcrun atos -arch arm64 -o <dSYM DWARF> -l 0x0 <imageOffset> | xcrun swift-demangle`).
4. Also check for other hand edits in `node_modules` — they are lost on reinstall or, worse, silently break release builds. Persist any needed change with `npx patch-package <pkg>`.
5. Crashes from real TestFlight devices: App Store Connect → TestFlight → Crashes, or Xcode → Window → Organizer → Crashes.
