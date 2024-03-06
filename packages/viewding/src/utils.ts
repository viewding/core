// 驼峰格式转换成连字符格式。
// const humpName = ['abcAbc', 'AbcAbc', 'abcABCAbc','abcABAbc', 'abcAbcA', 'abcAbcABC', 'abcAbcAB']
// console.log(humpName.map((name)=>toHyphen(name))  )
// [LOG]: ["abc-abc", "abc-abc", "abc-abc-abc", "abc-ab-abc", "abc-abc-a", "abc-abc-abc", "abc-abc-ab"]
export function toHyphen(name: string) {
    let s: string

    // 结尾处的连续大写字符串：前添加连字符,并且转换为小写。
    s = name.replace(
        /(?<![A-Z])([A-Z]+)$/g,
        (str) => '-' + str.toLocaleLowerCase()
    )
    //console.log(s)

    // 后面没有紧跟大写字符的字符：前添加连字符,并且转换为小写。
    s = s.replace(/([A-Z])(?![A-Z])/g, (str) => '-' + str.toLocaleLowerCase())
    //console.log(s)

    // 连续的一个或多个大写字符前添加连字号，并且把整串字符转换为小写
    s = s.replace(/([A-Z]+)/g, '-$1').toLowerCase()
    //console.log(s)

    // 如果字符串为Pasca命名，那么由于第一单词就大写，所以会产生打头的连字号，需要删除掉。
    if (s.startsWith('-')) s = s.substring(1)
    //console.log(s)
    return s
}

// 连字符转驼峰
// const hyphenName = ['abc-abc', 'abc-abc', 'abc-abc', 'abc-abc-a', 'abc-abc-abc', 'abc-abc-ab']
// console.log(hyphenName.map((name)=>toHump(name))  )
// [LOG]: ["abcAbc", "abcAbc", "abcAbc", "abcAbcA", "abcAbcAbc", "abcAbcAb"]
export function toHump(name: string) {
    return name.replace(/\-(\w)/g, function (all, letter) {
        return letter.toUpperCase()
    })
}

// 浏览器api中的window已经有了innerWidth、innerHeight、outerWidth和outerHeight的属性,
// 但是，没有width和height的属性，下面的win的尺寸返回的是documentElement客户区的尺寸。
export const win = {
    width: window.document.documentElement.clientWidth,
    height: window.document.documentElement.clientHeight,
}

function getDocumentDimension(dimension: 'Width' | 'Height'): number {
    const docEle = document.documentElement
    return Math.max(
        document.body[`scroll${dimension}`],
        docEle[`scroll${dimension}`],
        document.body[`offset${dimension}`],
        docEle[`offset${dimension}`],
        docEle[`client${dimension}`]
    )
}

// 对于document的尺寸来说不存在inner、outer的概念。
export const doc = {
    width() {
        return getDocumentDimension('Width')
    },
    height() {
        return getDocumentDimension('Height')
    },
    ready(callback: () => any) {
        const cb = () => setTimeout(callback, 0)
        // readyState的取值只有三个：loading, interactive, complete。
        // 通过domcument上的readystatechange事件，可以模拟load, DOMContentLoaded事件，还可以在DOMContentLoaded之前运行处理程序。
        if (document.readyState !== 'loading') {
            cb()
        } else {
            document.addEventListener('DOMContentLoaded', cb)
        }
    },
    id(id:string){
        if(id.startsWith('#')) id = id.substring(1)
        return document.getElementById(id)
    }
}

type PlainObject<T> = Record<string, T>

export function isNumeric(value: unknown): value is number {
    if (typeof value === 'number') {
        return !isNaN(value) && isFinite(value)
    }
    return false
}

export function isPlainObject(value: unknown): value is PlainObject<any> {
    if (typeof value !== 'object' || value === null) return false
    const proto = Object.getPrototypeOf(value)
    return proto === null || proto === Object.prototype
}


// 比较：todo
// NodeAPI: node.childNodes 是一个只读属性，返回包含指定节点的子节点的集合，该集合为即时更新的 NodeList 类型集合，包含文本和注释节点。
// element.children: Element.children 是一个只读属性，返回 一个 Node 的子elements ，是一个动态更新的 HTMLCollection，包含Element元素，不只是HTMLElement。
//
// HTMLTemplateElement API: templateElement.content属性返回<template>元素的模板内容 (一个 DocumentFragment)
// templateElement.content.children

// 对比如下实现，用template比用document要轻量。
// const tmp = document.implementation.createHTMLDocument('')
// tmp.body.innerHTML = htmlString
// return tmp.body.childNodes
export function parseHTML(html: string) {
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    return template.childNodes
}

export function isDocument(value: Node): value is Document {
    return !!value && value.nodeType === Node.DOCUMENT_NODE
}

export function isDocumentFragment(value: Node): value is DocumentFragment {
    return !!value && value.nodeType === Node.DOCUMENT_FRAGMENT_NODE
}

export function isElement(value: Node): value is Element {
    return !!value && value.nodeType === Node.ELEMENT_NODE
}
