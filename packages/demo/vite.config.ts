import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    resolve:{
        alias:{
            '~': path.resolve(__dirname, ''),
        }
    },
    build: {
        outDir: 'dist',
        manifest: true,
        rollupOptions:{
            input: {
                'input/client': path.resolve(__dirname, 'src/input/client.ts')
            },
            output: {
                entryFileNames: '[name]-[hash].js'
            }
        }
    },
    esbuild: {
        loader: "ts",
    },

})
