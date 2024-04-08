/** @format */

import { html, mount } from "viewding"
import browserslist from "browserslist"
import init, { transform, browserslistToTargets } from "lightningcss-wasm"

await init()
let targets = browserslistToTargets(browserslist())

function compileCss(src: string) {
    let { code, map } = transform({
        filename: "style.css",
        code: new TextEncoder().encode(src),
        drafts: {
            nesting: true,
        },
        targets,
    })
    return new TextDecoder().decode(code)
}

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
    compileCss(String.raw({ raw: strings }, ...values))

const message = "Hello World!"

let code = css`
    .foo {
        color: blue;

        & & .bar {
            color: red;
        }
    }
    @custom-media --modern (color), (hover);

    @media (--modern) and (width > 1024px) {
        .a {
            color: green;
        }
    }
    .logo {
        background: image-set(url(logo.png) 2x, url(logo.png) 1x);
    }
`

function template() {
    return html`<pre><code>${code}</code></pre>`
}

mount(document.body, template)
