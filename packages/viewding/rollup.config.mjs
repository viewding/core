import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser'

export default [
  {
    input: 'src/index.ts',
    plugins: [typescript()],
    output: [
      {file: 'dist/index.esm.js', format: 'es'},
      {file: 'dist/index.esm.min.js', format: 'es', plugins:[terser()]},
    ],
  },

];








