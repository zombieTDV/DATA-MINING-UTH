module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }],
    ],
    plugins: [
      // NativeWind must be BEFORE module-resolver
      'nativewind/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/theme': './src/theme',
            '@/types': './src/types',
            '@/data': './src/data',
            '@/utils': './src/utils',
            '@/hooks': './src/hooks',
            '@/services': './src/services',
            '@/navigation': './src/navigation',
            '@/store': './src/store',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin', // must be last
    ],
  };
};
