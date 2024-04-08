import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser'
import resolve from '@rollup/plugin-node-resolve';
import { dts } from "rollup-plugin-dts";

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'src/index.ts',
    watch: {
      buildDelay: 10000,
      include: 'src/**'
    },
    plugins: [
      json(), 
      commonjs({
        include: /node_modules/,
        requireReturnsDefault: 'auto', // <---- RollupError: "default" is not exported
      }),
      typescript(), 
      resolve()
    ],
    external: ["lightningcss-wasm","browserslist","colorjs.io"],
    output: [
      {file: 'dist/jcss.js', format: 'es', sourcemap: true},
      {file: 'dist/jcss.min.js', format: 'es', plugins:[terser()]},
    ],
  },
  {
    input: "dist/temp/index.d.ts",
    output: [{ file: "dist/jcss.d.ts", format: "es" }],
    plugins: [dts()],
  },

];
