const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Native (Android/iOS) build output inside node_modules is irrelevant to JS
// bundling and can crash Metro's Windows file watcher (ENOENT on deeply
// nested Gradle/Kotlin build artifact folders), so keep it out of the watch.
//
// This used to go through metro-config's `private/defaults/exclusionList`, but
// SDK 57 swapped Metro for the @expo/metro fork and that internal path is no
// longer resolvable. Joining the patterns into one RegExp is exactly what the
// helper did, and it drops the dependency on Metro's private module layout.
// The separator class matches both "/" and "\" so this still works on Windows.
const SEP = "[/\\\\]";
config.resolver.blockList = new RegExp(
  [
    `node_modules${SEP}.*${SEP}android${SEP}.*${SEP}build${SEP}.*`,
    `node_modules${SEP}.*${SEP}ios${SEP}.*${SEP}build${SEP}.*`,
  ]
    .map((pattern) => `(${pattern})`)
    .join("|"),
);

config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer/expo",
);
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

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
