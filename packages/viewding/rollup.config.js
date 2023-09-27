import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser'
import resolve from '@rollup/plugin-node-resolve';
import { dts } from "rollup-plugin-dts";

export default [
  {
    input: 'src/index.ts',
    plugins: [typescript(), resolve()],
    output: [
      {file: 'dist/viewding.js', format: 'es', sourcemap: true},
      {file: 'dist/viewding.min.js', format: 'es', plugins:[terser()]},
    ],
  },
  {
    input: "dist/temp/index.d.ts",
    output: [{ file: "dist/viewding.d.ts", format: "es" }],
    plugins: [dts()],
  },

];








