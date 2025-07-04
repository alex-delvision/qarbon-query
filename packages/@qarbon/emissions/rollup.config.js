import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import esbuild from 'rollup-plugin-esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'fs',
  'path',
  'util',
  'stream',
  'crypto',
  'events',
  'buffer',
  'worker_threads'
];

const commonPlugins = [
  nodeResolve({
    preferBuiltins: true,
    exportConditions: ['node', 'default']
  }),
  esbuild({
    target: 'es2020',
    minify: false,
    tsconfig: './tsconfig.json'
  })
];

const minifyPlugins = [
  ...commonPlugins,
  terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info']
    },
    mangle: {
      reserved: ['Calculator', 'EmissionsCalculator', 'AIEmissionsCalculator', 'CloudEmissionsCalculator', 'CryptoEmissionsCalculator']
    }
  })
];

export default [
  // Main bundle - CommonJS and ES modules
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/index.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: commonPlugins
  },
  
  // Minified main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.min.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: minifyPlugins
  },

  // AI-only bundle
  {
    input: 'src/ai.ts',
    output: [
      {
        file: 'dist/ai.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/ai.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: commonPlugins
  },

  // AI-only minified bundle
  {
    input: 'src/ai.ts',
    output: {
      file: 'dist/ai.min.js',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    external,
    plugins: minifyPlugins
  },

  // Cloud-only bundle
  {
    input: 'src/cloud.ts',
    output: [
      {
        file: 'dist/cloud.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/cloud.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: commonPlugins
  },

  // Cloud-only minified bundle
  {
    input: 'src/cloud.ts',
    output: {
      file: 'dist/cloud.min.js',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    external,
    plugins: minifyPlugins
  },

  // Crypto-only bundle
  {
    input: 'src/crypto.ts',
    output: [
      {
        file: 'dist/crypto.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/crypto.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: commonPlugins
  },

  // Crypto-only minified bundle
  {
    input: 'src/crypto.ts',
    output: {
      file: 'dist/crypto.min.js',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    external,
    plugins: minifyPlugins
  },

  // Calculator-only bundle
  {
    input: 'src/calculator.ts',
    output: [
      {
        file: 'dist/calculator.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/calculator.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: commonPlugins
  },

  // Calculator-only minified bundle
  {
    input: 'src/calculator.ts',
    output: {
      file: 'dist/calculator.min.js',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    external,
    plugins: minifyPlugins
  },

  // Factors-only bundle
  {
    input: 'src/factors.ts',
    output: [
      {
        file: 'dist/factors.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/factors.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    external,
    plugins: commonPlugins
  },

  // Factors-only minified bundle
  {
    input: 'src/factors.ts',
    output: {
      file: 'dist/factors.min.js',
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    external,
    plugins: minifyPlugins
  },

  // Browser bundle - includes all dependencies
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/qarbon-emissions.browser.js',
      format: 'umd',
      name: 'QarbonEmissions',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      esbuild({
        target: 'es2020',
        minify: false,
        tsconfig: './tsconfig.json'
      })
    ]
  },

  // Browser bundle - minified
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/qarbon-emissions.browser.min.js',
      format: 'umd',
      name: 'QarbonEmissions',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      esbuild({
        target: 'es2020',
        minify: true,
        tsconfig: './tsconfig.json'
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info']
        },
        mangle: {
          reserved: ['QarbonEmissions']
        }
      })
    ]
  }
];
