/** @format */
import {css} from "./util"

export class CssBuilder {
    #namedStyles = new Map<string, string>()

    appendName(name: string, style: string, appendClass = false) {
        // 追加而不是覆盖
        if (this.#namedStyles.has(name)) {
            style = this.#namedStyles.get(name) + style
        }
        this.#namedStyles.set(name, style)
        if(appendClass){
            this.appendCss(css`.${name} {${style}}`)
        }
    }
    
    mergeNames(styles: Map<string, string>) {
        styles.forEach((v, k) => this.appendName(k, v))
    }

    getStyle(name: string) {
        return this.#namedStyles.get(name)
    }

    get namedStyles(){
        return this.#namedStyles
    }

    #regexStyles = new Map<RegExp, (matches: RegExpMatchArray) => string>()

    addRegex(regex: RegExp, func: (matches: RegExpMatchArray) => string) {
        this.#regexStyles.set(regex, func)
    }

    mergeRegex(styles: Map<RegExp, (matches: RegExpMatchArray) => string>) {
        styles.forEach((v, k) => this.addRegex(k, v))
    }

    matchStyle(name: string) {
        for (const item of this.#regexStyles) {
            const matches = name.match(item[0])
            if (matches) {
                return item[1](matches)
            }
        }
    }

    get regexStyles(){
        return this.#regexStyles
    }

    #namedMedia = new Map<string, string>()
    #regexMedia = new Map<RegExp, (matches: RegExpMatchArray) => string>()

    addMedia(name: string, media: string) {
        this.#namedMedia.set(name, media)
    }

    mergeMediaNames(styles: Map<string, string>) {
        styles.forEach((v, k) => this.appendName(k, v))
    }

    addMediaRegex(regex: RegExp, func: (matches: RegExpMatchArray) => string) {
        this.#regexMedia.set(regex, func)
    }
    mergeMediaRegex(styles: Map<RegExp, (matches: RegExpMatchArray) => string>) {
        styles.forEach((v, k) => this.addRegex(k, v))
    }

    // 根据正则匹配生成样式
    withMedia(name: string, content: string): string | Error {
        if (this.#namedMedia.has(name)) {
            return `\n@media ${this.#namedMedia.get(name)}{
                ${content}
            }`
        }
        for (const item of this.#regexMedia) {
            const matches = name.match(item[0])
            if (matches) {
                return `\n@media ${item[1](matches)}{
                    ${content}
                }`
            }
        }
        return new Error(`媒体名称没有预定义：${name}`)
    }

    get namedMedia(){
        return this.#namedMedia
    }

    get regexMedia() {
        return this.#regexMedia
    }

    clear(){
        this.#namedStyles.clear()
        this.#regexStyles.clear()
        this.#namedMedia.clear()
        this.#regexMedia.clear()
        this.#styles = []
    }

    // names：以空白（匹配/\s+/）分隔的一系列命名的样式类，每个样式类代表一组样式规则。
    mixStyles(names: string) {
        let ss = ""
        for (const name of names.trim().split(/\s+/)) {
            let s = this.getStyle(name)
            if (s) {
                ss += "\n" + s
                continue
            }
            s = this.matchStyle(name)
            if (s) {
                ss += "\n" + s
            }
        }
        return ss
    }

    #styles = [] as string[]

    appendCss(styleSheet: string) {
        this.#styles.push(styleSheet)
    }

    appendNameClassCss(styleClass: string){
        const pos = styleClass.indexOf("{")
        if (pos){
            const name = styleClass.substring(0,pos).trim().substring(1)  // 去掉类名称前的点号。
            const style = styleClass.substring(pos).$unwrap("{}")
            this.appendName(name,style)
            this.appendCss(styleClass)
        }
    }

    get allCss() {
        return this.#styles.join("\n")
    }

    merge(cb :CssBuilder){
        this.appendCss(cb.allCss)
        this.mergeNames(cb.namedStyles)
        this.mergeRegex(cb.regexStyles)
        this.mergeMediaNames(cb.namedMedia)
        this.mergeMediaRegex(cb.regexMedia)
    
    }
}

