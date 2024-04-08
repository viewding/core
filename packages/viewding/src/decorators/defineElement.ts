import { attachCss } from "../mount"
import { reactiveElement } from "../reactiveElement"
import { toHyphen } from "../utils"

// 需要特别注意的是：
// 1. 一个HTMLXxxxElement可能对应多个html标记！
// 2. HTMLElement也可以对应baseTag，比如<nav></nav>对应的DOM对接接口就是HTMLElement。


// 扩展Html原生标签时，注解必须指明被扩展的标签名，因为根据类型无法推断具体的元素。
// 当缺省自定义元素名称时，自动根据使用类名称的小写连字符名称。
// 可以随意指定其中的一个参数和两个参数，根据自定义元素的名称必须包含 '-' 连字符的约定自动识别对应的形参。
export function defineElement(
    tagName?: string,
    baseTag?: string
) {
    // 只有一个参数时，如果不包含 "-" 那么表示该参数是baseTag。
    if(arguments.length>=1 && !tagName!.includes('-')){
        baseTag = arguments[0]
        if(arguments.length==2){
            tagName = arguments[1]
        }
        else{
            tagName = undefined
        }
    }

    return function(clazz: ReturnType<typeof reactiveElement>){
        if (tagName === undefined || tagName === '') {
            tagName = toHyphen(clazz.name)
        }

        if (baseTag === undefined) {
            customElements.define(tagName, clazz)
        } else {
            customElements.define(tagName, clazz, {
                extends: baseTag,
            })
        }

        if( clazz.styles && clazz.styles().trim() !== '' ){
            attachCss(`@scope (${tagName}){${clazz.styles()}}`)
        }
        return clazz as any
    }
}
