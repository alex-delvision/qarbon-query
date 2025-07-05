const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    mode: argv.mode || 'production',
    target: ['web', 'es2020'],
    entry: {
      background: './src/background-clean.ts',
      content: './src/content-sse.ts',
      popup: './src/popup-hybrid.ts',
      settings: './src/settings.ts',
      tracker: './src/lib/browser-agnostic-tracker.ts',
    },
    output: {
      path: path.resolve(__dirname, 'extension'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@qarbon/shared': path.resolve(
          __dirname,
          '../../packages/@qarbon/shared/src'
        ),
        '@qarbon/sdk': path.resolve(__dirname, '../../packages/@qarbon/sdk/src'),
        '@qarbon/emissions': path.resolve(__dirname, '../../packages/@qarbon/emissions/src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: path.resolve(__dirname, 'tsconfig.json'),
                transpileOnly: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      usedExports: true,
      minimize: argv.mode !== 'development',
    },
    devtool: isDev ? 'inline-source-map' : false,
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/tokenExtractors.ts'),
            to: path.resolve(__dirname, 'extension/tokenExtractors.ts'),
          },
          {
            from: path.resolve(__dirname, 'src/dnr_rules_fixed.json'),
            to: path.resolve(__dirname, 'extension/dnr_rules.json'),
          },
          {
            from: path.resolve(__dirname, 'src/manifest.json'),
            to: path.resolve(__dirname, 'extension/manifest.json'),
          },
          {
            from: path.resolve(__dirname, 'src/popup.html'),
            to: path.resolve(__dirname, 'extension/popup.html'),
          },
          {
            from: path.resolve(__dirname, 'src/settings.html'),
            to: path.resolve(__dirname, 'extension/settings.html'),
          },
          {
            from: path.resolve(__dirname, 'src/icons'),
            to: path.resolve(__dirname, 'extension/icons'),
          },
          {
            from: path.resolve(__dirname, 'src/styles'),
            to: path.resolve(__dirname, 'extension/styles'),
          },
        ],
      }),
      ...(argv.mode === 'production' ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'stats.html',
          openAnalyzer: false,
        }),
      ] : []),
    ],
  };
};
