module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          unstable_transformImportMeta: true,
          // React Compiler disabled — beta version generates code Hermes cannot parse
          jsxImportSource: undefined,
        },
      ],
    ],
    plugins: [
      // React Native Reanimated must be last
      "react-native-reanimated/plugin",
    ],
  };
};
