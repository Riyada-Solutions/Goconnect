const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow Babel to transform packages that ship TypeScript source via the
// "react-native" package.json field (e.g. react-native-reanimated@4,
// react-native-worklets). Without this, Hermes receives raw TypeScript and
// throws parse errors on Android.
config.transformer.transformIgnorePatterns = [
  "node_modules/(?!(?:.pnpm/[^/]+/node_modules/)?(" +
    "react-native" +
    "|@react-native(-community)?" +
    "|expo(nent)?" +
    "|@expo(nent)?/.*" +
    "|@expo-google-fonts/.*" +
    "|react-navigation" +
    "|@react-navigation/.*" +
    "|@unimodules/.*" +
    "|unimodules" +
    "|sentry-expo" +
    "|native-base" +
    "|react-native-svg" +
    "|react-native-reanimated" +
    "|react-native-worklets" +
    "|react-native-keyboard-controller" +
    "|react-native-safe-area-context" +
    "|react-native-screens" +
    "|react-native-gesture-handler" +
  "))",
];

module.exports = config;
