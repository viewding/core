import { defineConfig } from 'vite'
import path from 'path'
import { promises as fs } from "fs"

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    resolve:{
        alias:{
            '~': path.resolve(__dirname, ''),
        }
    },
    plugins: [dontTransform()],
    build: {
        target:"esnext",
        outDir: 'dist',
        manifest: true,
        rollupOptions:{
            input: {
                'test/playground': path.resolve(__dirname, 'src/test/playground/index.html')
            },
            external:["@viewding/lit-html","@viewding/reactivity"]
        }
    },
    esbuild: {
        loader: "ts",
    },

})

function dontTransform() {
    return {
        name: "vite-plugin-dont-transform",
        enforce: "pre" as 'pre',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const uri = req.url as string
                let data: [string, string] | undefined
                console.log(uri)

                if (uri.includes("playground/svg") && (uri.endsWith(".ts") || uri.endsWith(".js") ) ) {
                    data = [
                        "application/javascript",
                        await fs.readFile(`${server.config.root}${uri}`, "utf-8"),
                    ]
                }

                if (data) {
                    res.setHeader("Content-Type", data[0])
                    res.end(data[1])
                    return
                }

                next()
            })
        },
    } // return plugin object
}

