const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    mode: argv.mode || 'production',
    entry: {
      background: './src/background-clean.ts',
      content: './src/content-fixed.ts',
      popup: './src/popup.ts',
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
                transpileOnly: false,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimize: false, // Disable minification for better debugging
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
            from: path.resolve(__dirname, 'src/manifest-minimal.json'),
            to: path.resolve(__dirname, 'extension/manifest.json'),
          },
          {
            from: path.resolve(__dirname, 'src/popup.html'),
            to: path.resolve(__dirname, 'extension/popup.html'),
          },
          {
            from: path.resolve(__dirname, 'src/icons'),
            to: path.resolve(__dirname, 'extension/icons'),
          },
        ],
      }),
    ],
  };
};
