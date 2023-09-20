import { Elecollection } from './elecollection'

declare global {
    interface Element {
        $next(selector?: string): Element | null
        $nextAll(selector?: string): Elecollection
        $prev(selector?: string): Element | null
        $prevAll(selector?: string): Elecollection
        $siblings(selector?: string): Elecollection
        $parents(selector?: string): Elecollection
    }
}

// children(selector)：e.queryselectorAll(`:scope ${selector}`)
// 当从 DOM API 使用，如（querySelector(), querySelectorAll(), matches(), 或 Element.closest()）, :scope 匹配你调用 API 的元素。
// 子元素：
// Element API：Element.children 是一个只读属性，返回 一个 Node 的子elements ，是一个动态更新的 HTMLCollection。
// Element API：Element.childElementCount 只读属性返回一个无符号长整型数字，表示给定元素的子元素数。
// Element API：firstElementChild、lastElementChild，返回第一个或者最后一个元素，如果没有子元素，那么返回null。
//
// 后代：
// querySelector(), querySelectorAll()

// 兄弟：
// Element API：nextElementSibling、previousElementSibling、返回前后的同级元素，如果已经是第一个或者最后一个，那么返回null。

// 祖先：
// Element API：Element.closest(selectors) 方法用来获取：匹配特定选择器且离当前元素最近的祖先元素（也可以是当前元素本身）。如果匹配不到，则返回 null。selectors 是指定的选择器，比如 "p:hover, .toto + q"
// 注意：parentElement属性放到了Node接口中，Node接口中还有parentNode的属性
// HTMLElement中还有和定位相关的offsetParent属性。

// Node也有类似的API：firstchild, lastChild, previousSibling, nextSibling, parentNode, childNodes, parentElement

Element.prototype.$next = function (this: Element, selector?: string) {
    if (selector) {
        const next = this.nextElementSibling
        if (next && next.matches(selector)) {
            return next
        }
        return null
    } else {
        return this.nextElementSibling
    }
}

Element.prototype.$nextAll = function (this: Element, selector?: string) {
    const collection = new Elecollection()
    let e = this
    while (true) {
        const next = e.$next(selector)
        if (next === null) break
        if(next instanceof HTMLElement) collection.push(next)
        e = next
    }
    return collection
}

Element.prototype.$prev = function (this: Element, selector?: string) {
    if (selector) {
        const prev = this.previousElementSibling
        if (prev && prev.matches(selector)) {
            return prev
        }
        return null
    } else {
        return this.previousElementSibling
    }
}

Element.prototype.$prevAll = function (this: Element, selector?: string) {
    const collection = new Elecollection()
    let e = this
    while (true) {
        const prev = e.$next(selector)
        if (prev === null) break
        if(prev instanceof HTMLElement) collection.push(prev)
        e = prev
    }
    return collection
}

Element.prototype.$siblings = function (this: Element, selector?: string) {
    const collections = this.$prevAll(selector)
    collections.push(...this.$nextAll(selector))
    return collections
}

Element.prototype.$parents = function parents(
    this: Element,
    selector?: string
) {
    const parents = new Elecollection()
    let e = this
    while (true) {
        let p = e.parentNode
        if (p === null || (e as unknown as Document) === document) break
        if(p instanceof HTMLElement) {
            if (!selector || p.matches(selector)) parents.push(p)
        }
    }
    return parents
}

declare module './elecollection' {
    export interface Elecollection {
        anotherMethod(): string
    }
}

Elecollection.prototype.anotherMethod = () => ''
