module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@/components': './src/components',
            '@/components/*': './src/components/*',
            '@/screens': './src/screens',
            '@/screens/*': './src/screens/*',
            '@/services': './src/services',
            '@/services/*': './src/services/*',
            '@/utils': './src/utils',
            '@/utils/*': './src/utils/*',
            '@/types': './src/types',
            '@/types/*': './src/types/*',
            '@/hooks': './src/hooks',
            '@/hooks/*': './src/hooks/*',
            '@/providers': './src/providers',
            '@/providers/*': './src/providers/*',
            '@/store': './src/store',
            '@/store/*': './src/store/*',
            '@/config': './src/config',
            '@/config/*': './src/config/*',
            '@/constants': './src/constants',
            '@/constants/*': './src/constants/*',
            '@/*': './src/*',
            '@': './',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

