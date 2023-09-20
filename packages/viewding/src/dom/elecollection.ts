import * as util from '../utils'
export type Selector =
    | string
    | HTMLCollection
    | NodeList
    | Element
    | Element[]
    | ArrayLike<Element>
type Context = Document | Element

const idRe = /^#(?:[\w-]|\\.|[^\x00-\xa0])*$/
const classRe = /^\.(?:[\w-]|\\.|[^\x00-\xa0])*$/
const htmlRe = /<.+>/
const tagRe = /^\w+$/

export type ElementMatcher = (e:Element,i:number)=>boolean

export class Elecollection extends Array<HTMLElement> {
    constructor(selector?: Selector, context: Context = document){
        super()
        if (selector === undefined) return
        let eles: any = selector
        if (typeof selector === 'string') {
            eles =
                idRe.test(selector) && 'getElementById' in context
                    ? (context as Document).getElementById(
                          selector.slice(1).replace(/\\/g, '')
                      )
                    : htmlRe.test(selector)
                    ? util.parseHTML(selector)
                    : search(selector, context)
        }

        if (eles?.nodeType) eles = [eles]
        this.push(...eles)
    }

    add(selector?: Selector, context: Context = document){
        this.push(...new Elecollection(selector,context))
        return this
    }

    // 保留满足条件的元素, 返回不满足条件而被移除了的其他元素。
    // 对应jquery的not, filter
    only(selector:string | ElementMatcher ){
        let compare:ElementMatcher;
        if(typeof selector === 'string'){
            compare = (e,i)=>e.matches(selector)
        }
        else compare = selector
        const others = new Elecollection()
        this.forEach((e,i)=>{
            if(!compare(e,i)){
                others.push(e)
                this.splice(i,1)
            }
        })
        return others
    }

    // 保留序号为偶数的元素, 返回序号为奇数的元素。
    // 对应jquery的odd,even
    onlyEven(){
        return this.only((e,i)=> i%2==0)
    }

    // 保留包含了特定或匹配的子元素的元素，返回被移除的元素
    onlyContains( selector: string | Node ) {
        let comparator:ElementMatcher
        if( typeof selector === 'string' ){
            comparator = (e,i)=>!!e.querySelector(selector)
        }
        else comparator = (e,i)=>e.contains(selector)
        return this.only ( comparator );
    };
}

// eq, first, last, slice, map 等jquery的方法，用Array的内置方法即可。
// jqury的is，用matches或===代替。

function search(selector: string, context: Context): ArrayLike<Element> {
    return classRe.test(selector)
        ? context.getElementsByClassName(
                selector.slice(1).replace(/\\/g, '')
            )
        : tagRe.test(selector)
        ? context.getElementsByTagName(selector)
        : context.querySelectorAll(selector)
}

export function query(selector: Selector, context: Context = document){
    return new Elecollection(selector,context)
}

