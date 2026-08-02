module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its babel transform into react-native-worklets.
    // Must stay last in the plugin list.
    plugins: ['react-native-worklets/plugin'],
  };
};
