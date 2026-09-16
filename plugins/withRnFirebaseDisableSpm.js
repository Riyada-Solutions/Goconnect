/**
 * Expo config plugin — forces React Native Firebase to use CocoaPods instead
 * of Swift Package Manager.
 *
 * RNFirebase 22+ defaults to SPM Firebase products, which are dynamic-only and
 * conflict with Expo's `useFrameworks: static`. Manual Podfile edits are wiped
 * by `expo prebuild --clean` (used on EAS), so this plugin re-injects the flag
 * every prebuild.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FLAG_LINE = '$RNFirebaseDisableSPM = true';
const FLAG_BLOCK = [
  '',
  '# RN Firebase SPM products are dynamic-only; Expo requires static frameworks.',
  FLAG_LINE,
  '',
].join('\n');

function withRnFirebaseDisableSpm(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        return cfg;
      }

      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes('$RNFirebaseDisableSPM')) {
        return cfg;
      }

      const marker = 'prepare_react_native_project!';
      if (contents.includes(marker)) {
        contents = contents.replace(marker, `${FLAG_BLOCK}${marker}`);
      } else {
        contents = `${FLAG_BLOCK}${contents}`;
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
}

module.exports = withRnFirebaseDisableSpm;
