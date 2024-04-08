import { defineConfig } from 'vite'
import path from 'path'
import { promises as fs } from "fs"
import mime from './script/mime.js'

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    resolve:{
        alias:{
            '~': path.resolve(__dirname, ''),
        }
    },
    optimizeDeps: {
        exclude: ['playground-elements','lightningcss-wasm'],
    },
    plugins: [dontTransform("/playground/basic/","/playground/practice/","/playground/7guis/")],
    build: {
        target:"esnext",
        outDir: '../dist',
        manifest: true,
        rollupOptions:{
            input: {
                'playground': path.resolve(__dirname, 'src/playground/index.html')
            },
            external:["@viewding/lit-html","@viewding/reactivity"]
        }
    },
    esbuild: {
        loader: "ts",
    },

})

function dontTransform(...paths:string[]) {
    return {
        name: "vite-plugin-dont-transform",
        enforce: "pre" as 'pre',
        configureServer(server:any) {
            server.middlewares.use(async (req:any, res:any, next:any) => {
                const uri = req.url as string
                console.log(uri)

                if (paths.filter((item)=>uri.includes(item) ).length > 0) {
                    const data = await fs.readFile(`${server.config.root}${uri}`, "utf-8")
                    const exts = Object.keys(mime).filter(x => uri.endsWith("."+x));

                    if (exts.length !== 0) {
                        res.setHeader('Content-Type', (mime as any)[exts[0]])
                    } 
                 
                    res.end(data)
                    return
                }

                next()
            })
        },
    } // return plugin object
}
