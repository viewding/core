import { Elecollection } from "./elecollection"
import * as util from '../utils'

declare global {
    interface Element {
        $empty(): this
        $html(): string
        $html(html: string): this
        $text(): string
        $text(text: string): this
        $constains(selecter: string | Node):boolean
    }
}

Element.prototype.$empty = function (this: Element) {
    this.replaceChildren()
    return this
}

// 不建议使用html()和text()，如果需要直接使用Node.textContent，Element.innerHTML/outerHTML/innerText属性，如果要操作子元素则使用Element.insertAdjacentHTML()/insertAdjacentText()。

function html(this: Element): string
function html(this: Element, html: string): Element

// 仅仅是Element.innerHTML属性的转调用，不建议使用。
function html(this: Element, html?: string) {
    if (html === undefined) return this.innerHTML
    const hasScript = /<script[\s>]/.test(html)
    if (hasScript) {
        this.$empty().append(html)
    } else {
        this.innerHTML = html
    }
    return this
}

Element.prototype.$html = html

function text(this: Element): string
function text(this: Element, text: string): Element

// 仅仅是对Node.textContent属性的转调用，不建议使用。
// 另外一个和Node.textContent类似的是HTMLElement.innerText, 两者的比较如下：
// 1. textContent 会获取所有元素的内容，包括 <script> 和 <style> 元素，然而 innerText 只展示给人看的元素。
// 2. textContent 会返回节点中的每一个元素。相反，innerText 受 CSS 样式的影响，并且不会返回隐藏元素的文本。
function text(this: Element, text?: string) {
    if (text === undefined) return this.textContent
    this.textContent = text
    return this
}

Element.prototype.$text = text

// 检测元素是否包含指定的文本或者指定的子节点
Element.prototype.$constains = function(this:Element,textOrNode:string|Node){
    if(typeof textOrNode=== 'string'){
        return this.textContent===null?false:this.textContent.includes(textOrNode)
    }
    else return this.contains(textOrNode)

}

// jquery中的contents(), 用e.childNodes代替。
// childNodes
// children

export type AdjacentPosition = 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'

declare module './elecollection' {
    export interface Elecollection{
        clone(deep?:boolean):Elecollection

        // insert around
        wrap(wrappingElement:string | Element):this
        wrapAll(wrappingElement:string | Element):Element | null
        wrapInner(wrappingElement:string | Element):this
        unwrap(selector:string):void
    }
}

// 根据最新W3C的规范，deep默认是false, 原来的W3C规范中deep默认是true。
// 注意：克隆出来的元素不属于domcument，需要手动添加到document中。
// 克隆一个元素节点会拷贝它所有的属性以及属性值，当然也就包括了属性上绑定的事件 (比如onclick="alert(1)"),
// 但不会拷贝那些使用addEventListener()方法或者node.onclick = fn这种用 JavaScript 动态绑定的事件。
// todo：对比jquery, 支持克隆事件监听器。
Elecollection.prototype.clone = function(this:Elecollection,deep=false){
    const elecol = new Elecollection()
    for( const e of this){
        elecol.push(e.cloneNode(deep) as HTMLElement)
    }
    return this
}

function inmostChild(e:Element):Element{
    let firstChild = e.children.item(0)
    if (firstChild===null) return e
    else return inmostChild(e)
}

// Wrap元素可以是多层嵌套的，依次递归查找每一层的第一个子元素的子元素的最深元素为包裹元素。
function wrap(this:Elecollection, wrappingElement: string | Element, inner:boolean=false){
    let arroundEle:Element;
    if (typeof wrappingElement === 'string'){
        let node = [...util.parseHTML(wrappingElement)].find(e=>{
            return e instanceof Element
        })
        if (node===undefined) return this
        arroundEle = node as Element
    }
    else {
        arroundEle = wrappingElement
    }

    if(inner){
        for(const ele of this){
            const wrap = arroundEle.cloneNode(true) as Element
            ele.prepend(wrap)
            inmostChild(wrap).append(...ele.childNodes)
        }
        return this
    }
    else{
        const elecol = new Elecollection()
        for(const ele of this){
            const wrap = arroundEle.cloneNode(true) as HTMLElement
            ele.replaceWith(wrap)
            inmostChild(wrap).appendChild(ele)
            elecol.push(wrap)
        }
        return elecol
    }
}

Elecollection.prototype.wrap = function (this:Elecollection, wrappingElement: string | Element){
    return wrap.bind(this)(wrappingElement, false )
}

Elecollection.prototype.wrapInner = function (this:Elecollection, wrappingElement: string | Element){
    return wrap.bind(this)(wrappingElement, true)
}

// Wrap元素可以是多层嵌套的，依次递归查找每一层的第一个子元素的子元素的最深元素为包裹元素。
// Elecollection中的所有元素一起被包裹，如果过这些元素不是连在一起的同级元素，那么包裹后一次移动到第一个元素之后。
function wrapAll(this:Elecollection, wrappingElement: string | Element){
    let arroundEle:Element;
    if (typeof wrappingElement === 'string'){
        let node = [...util.parseHTML(wrappingElement)].find(e=>{
            return e instanceof Element
        })
        if (node===undefined) return null
        arroundEle = node as Element
    }
    else {
        arroundEle = wrappingElement
    }

    let first=true
    const wrapEle = arroundEle.cloneNode(true) as Element
    const inmost = inmostChild(wrapEle)
    for(const ele of this){
        if(first){
            ele.replaceWith(wrapEle)
        }
        inmost.appendChild(ele)
    }
    return wrapEle
}

Elecollection.prototype.wrapAll = wrapAll

Elecollection.prototype.unwrap = function(this:Elecollection, selector?:string){
    for(const ele of this){
        const parent = ele.parentElement
        if( parent === null || selector===undefined) continue
        if(parent.matches(selector)){
            parent.after(...parent.childNodes)
            parent.remove()
        }
    }
    return
}

// Element API: before(), after(), append(), prepend(), 分别在当前的前后插入，子节点的开始或结束位置插入，
// 这几个方法的参数都是((Node or DOMString)... nodes)， DOMString为Text节点。
// 当要把Elecollection中的所有元素添加到某个Element时，可以使用如下语法，以before为例：
// element.before(...elecollction) // 因为elecollection从array派生，所以可以使用解构语法。
// 当要在Elecollection的每个元素中添加节点时，可以使用如下语法，以before为例：
// elecollection.each((e)=>e.before(...nodes))
// 或者，for(const e of elecollection){e.before(...nodes)}
// 所以一般不需要提供类似jquery的append, appendTo, prepend, prependTo, before, insertBefore, after, insertAfter等方法。

// Element API: insertAjacentElement(), insertAjacentHTML(), insertAjacentText(), 
// 这几个方法的参数，第一是position, 取值：'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'，第二个参数分别为一个元素，或者解析为html或text的字符串。
// Element API: replaceChildren(), replaceWith(), 
// 这两个方法的参数都是((Node or DOMString)... nodes)， DOMString为Text节点。

// Element API: element.remove(), 把element从DOM树中移除。

// Node API：node.appendChild()，insertBefore()。
// insertBefore()的语法为：insertedNode = parentNode.insertBefore(newNode, referenceNode)
// node.appendChild()和element.append()和的比较：
// 1. Element.append() 允许追加 DOMString 对象，而 Node.appendChild() 只接受 Node 对象。
// 2. Element.append() 没有返回值，而 Node.appendChild() 返回追加的 Node 对象。
// 3. Element.append() 可以追加多个节点和字符串，而 Node.appendChild() 只能追加一个节点。

// Node API： let oldChild = node.removeChild(child); 被移除的这个子节点仍然存在于内存中，只是没有添加到当前文档的 DOM 树中
// Node API： parentNode.replaceChild(newChild, oldChild); 用指定的节点替换当前节点的一个子节点，并返回被替换掉的节点。

