const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const _terserMod = require('@rollup/plugin-terser');
const terser = _terserMod.terser || _terserMod.default || _terserMod;

module.exports = [
  // ESM-style single-file outputs per binder entry
  {
    input: 'src/rhf.js',
    output: { file: 'dist/rhf.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  },
  {
    input: 'src/formik.js',
    output: { file: 'dist/formik.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  },
  {
    input: 'src/veevalidate.js',
    output: { file: 'dist/veevalidate.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  },
  {
    input: 'src/tanstack.js',
    output: { file: 'dist/tanstack.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  },
  {
    input: 'src/mantine.js',
    output: { file: 'dist/mantine.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  },
  {
    input: 'src/felte.js',
    output: { file: 'dist/felte.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  },
  {
    input: 'src/index.js',
    output: { file: 'dist/index.js', format: 'es', sourcemap: false, exports: 'named' },
    plugins: [resolve(), commonjs(), terser()],
    external: ['@formajs/mold']
  }
];
