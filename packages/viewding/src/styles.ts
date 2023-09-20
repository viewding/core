import init, { transform, browserslistToTargets } from "lightningcss-wasm"
import wasmUrl from 'lightningcss-wasm/lightningcss_node.wasm?url'
import {default as browserslist} from "browserslist"

await init(wasmUrl);

let targets = browserslistToTargets(browserslist());

export function compileCss(src: string) {
    let { code, map } = transform({
        filename: "style.css",
        code: new TextEncoder().encode(src),
        drafts: {
            nesting: true,
        },
        minify: true,
        targets,
    });
    return new TextDecoder().decode(code);
}

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
    String.raw({ raw: strings }, ...values)

export function attachCss(styles: string) {
    document.head.insertAdjacentHTML(
        "beforeend",
        `<style>${compileCss(styles).toString()}</style>`
    );
}
