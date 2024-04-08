/** @format */
import init, { transform, browserslistToTargets } from "lightningcss-wasm"
import browserslist from "browserslist"

await init()
let targets = browserslistToTargets(browserslist())

function compileCss(src: string) {
    try {
        let { code, map } = transform({
            filename: "style.css",
            code: new TextEncoder().encode(src),
            drafts: {
                nesting: true,
            },
            minify: true,
            targets,
        })
        return new TextDecoder().decode(code)
    } catch (e) {
        const err = e as any
        console.log(
            `ErrorType: ${err.data.type}
fileNmae: ${err.fileName}
line: ${err.loc.line} column:${err.loc.column}
message: ${err.message}

source:
${src}
`
        )
        return ""
    }
}

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
    compileCss(String.raw({ raw: strings }, ...values))

export class CssVar {
    static customPropertyPrefix = "cd-"

    name
    // css的属性值采用字符串表示，对于实际含义为number的属性使用add等函数eu
    value: string
    darkValue?: string
    constructor(name: string, value: string, darkValue?: string) {
        this.name = name
        this.value = value
        this.darkValue = darkValue
    }
    // 如果值为空字符串，那么不生成自定义属性。
    varProperty(value?: string) {
        if (!value) value = this.value
        if (value == "") return ""
        else return `--${this.varname}:${value}`
    }

    // 当不提供参数时，CSS变量的默认值为this.value, 当CSS的默认值为""时，返回不带默认值的var(...)值。
    // 当提供参数时，以提供的参数为CSS变量的默认值，所以参数为""时直接返回不带默认值的var(...)值。
    varValue(value?: string) {
        if (typeof value === "undefined") value = this.value
        if (value.trim() == "") return `var(--${this.varname})`
        return `var(--${this.varname}, ${value})`
    }
    get varname() {
        return CssVar.customPropertyPrefix + this.name
    }
}

// 如果语法出错，那么返回数值0，不抛出异常。
// 带单位的数值字符串的正则规则解释：
// 1. 可以有可选的符号，但不支持打头的正号。
// 2. 小数部分可选。
// 3. 当只有小数部分时，整数部分的0可以省略。
// 4. 单位是可选的，单位可以是单个%字符，或者1到多个大小写组成的字符串。
export function unitNumber(x: string) {
    const r = /^(-?\d+(?:\.\d+)?)((?:%?)|(?:[a-zA-z])*)$/gm
    // 修正css中小数可以省略打头的0的表示法。
    if (x.startsWith(".")) x = "0" + x
    if (x.startsWith("-.")) x = "-0" + x.substring(1)
    const matches = x.match(r)
    if (matches) {
        return { num: parseFloat(matches[1]), unit: matches[2] }
    }
    return { num: 0, unit: "" }
}

// 带单位的数值运算
// 比如： add(1rem,2rem) -> 3rem
export function add(x: string, y: string) {
    const a = unitNumber(x)
    const b = unitNumber(y)
    if (a.unit !== b.unit) return "0"
    else return `${a.num + b.num}` + a.unit
}

export function subtract(x: string, y: string) {
    const a = unitNumber(x)
    const b = unitNumber(y)
    if (a.unit !== b.unit) return "0"
    else return `${a.num + b.num}` + a.unit
}

export function multiply(x: string, y: number) {
    const a = unitNumber(x)
    return `${a.num * y}` + a.unit
}

export function divide(x: string, y: number) {
    const a = unitNumber(x)
    return `${a.num / y}` + a.unit
}

declare global {
    export interface String {
        $unwrap(start: string, end?: string): string
    }
}

// wrap有两种形式,
// 1. 两个字符："<startChar><endChar>"， 如: "{}", "<>"等
// 2. 以空格分隔的两个字符串："<startString> <endString>，如"<p> </p>", "{ }"等
function _unwrap(this: string, wrap: string) {
    wrap = wrap.trim()
    if (wrap.length < 2) return this

    let start = ""
    let end = ""
    if (wrap.length == 2) {
        start = wrap[0]
        end = wrap[1]
    } else {
        let se = wrap.split(" ")
        if (se.length == 2) {
            start = se[0]
            end = se[1]
        }
    }

    if (start === "" || end === "") return this

    let str = this.trim()
    if (str.startsWith(start) && str.endsWith(end)) {
        return str.substring(start.length, str.length - end.length)
    }
    return this
}

String.prototype.$unwrap = _unwrap

// See https://codepen.io/kevinweber/pen/dXWoRw
//
// Requires the use of quotes around data URIs.
export function escapeSvg(url: string) {
    const encode = (str: string) => {
        return str
            .replaceAll("<", "%3c")
            .replaceAll(">", "%3e")
            .replaceAll("#", "%23")
            .replaceAll("(", "%28")
            .replaceAll(")", "%29")
    }
    if (url.startsWith("data:image/svg+xml")) {
        return encode(url)
    }
    if (url.startsWith("url(")) {
        const end = url.lastIndexOf(")")
        url = url.substring(4, end)
        return `url(${encode(url)})`
    }
    return url
}

// zindex
export enum zindex {
    dropdown = 1000,
    sticky = 1020,
    fixed = 1030,
    offcanvasBackdrop = 1040,
    offcanvas = 1045,
    modalBackdrop = 1050,
    modal = 1055,
    popover = 1070,
    tooltip = 1080,
    toast = 1090,
}

