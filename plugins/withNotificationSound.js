/**
 * Expo config plugin — bundles the custom push-notification sound into
 * native resources so notifee's Android channel / iOS notification `sound`
 * can reference it. Runs during `expo prebuild` (both plain and --clean),
 * same lifecycle as plugins/withOpaqueIosIcon.js, since android/ and ios/
 * are regenerated from scratch on every EAS build.
 *
 * Android: copied to android/app/src/main/res/raw/<filename> — referenced
 * by resource name (filename without extension), e.g. notifee's
 * `sound: 'notification_sounbd'`.
 * iOS: copied into the Xcode project's main group and added as a resource
 * build file — referenced by filename with extension, e.g. notifee's
 * `sound: 'notification_sounbd.wav'`.
 *
 * Mirrors expo-notifications' own plugin/build/withNotificationsAndroid.js
 * and withNotificationsIOS.js sound-bundling logic.
 */
const { withDangerousMod, withXcodeProject, IOSConfig, assertValidAndroidAssetName } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SOUND_RELATIVE_PATH = path.join('assets', 'sound', 'notification_sounbd.wav');
const ANDROID_RAW_PATH = path.join('android', 'app', 'src', 'main', 'res', 'raw');

function withNotificationSoundAndroid(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const fileName = path.basename(SOUND_RELATIVE_PATH);
      assertValidAndroidAssetName(path.parse(fileName).name, 'withNotificationSound');

      const rawDir = path.join(projectRoot, ANDROID_RAW_PATH);
      if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

      fs.copyFileSync(
        path.join(projectRoot, SOUND_RELATIVE_PATH),
        path.join(rawDir, fileName),
      );
      return cfg;
    },
  ]);
}

function withNotificationSoundIOS(config) {
  return withXcodeProject(config, (cfg) => {
    const projectRoot = cfg.modRequest.projectRoot;
    const projectName = cfg.modRequest.projectName;
    if (!projectName) return cfg;

    const fileName = path.basename(SOUND_RELATIVE_PATH);
    const sourceRoot = IOSConfig.Paths.getSourceRoot(projectRoot);
    fs.copyFileSync(
      path.join(projectRoot, SOUND_RELATIVE_PATH),
      path.join(sourceRoot, fileName),
    );

    let project = cfg.modResults;
    if (!project.hasFile(`${projectName}/${fileName}`)) {
      project = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: `${projectName}/${fileName}`,
        groupName: projectName,
        isBuildFile: true,
        project,
      });
    }
    cfg.modResults = project;
    return cfg;
  });
}

module.exports = (config) => withNotificationSoundIOS(withNotificationSoundAndroid(config));
