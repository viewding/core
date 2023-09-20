import { toHyphen } from "../utils"

// to-do：
// 当没有提供baseTag参数时，可以根据基类提供baseTag的默认值的算法：
// 一级一级搜索clazz.__proto__....__proto__.name，匹配 /^HTML(\W+)Element$/, 如果先匹配到HTMLElement, 那么就没有baseTag。
// 如果匹配到其他的HTMLXxxElement, 那么事先根据API建立一个类名和标签的映射表，不用全部映射，有规律的名称通过字符串处理即可得到。
// 需要特别注意的是：
// 1. 一个HTMLXxxxElement可能对应多个html标记！映射表中只能以其中一个作为默认值。
// 2. HTMLElement也可以对应baseTag，比如<nav></nav>对应的DOM对接接口就是HTMLElement。

export function defineElement(
    tagName?: string,
    baseTag?: string
) {
    // 只有一个参数时，如果不包含 "-" 那么表示该参数是baseTag。
    if(arguments.length==1 && !tagName!.includes('-')){
        baseTag = arguments[0]
        tagName = undefined
    }

    return function(clazz: CustomElementConstructor){
        if (tagName === undefined || tagName === '') {
            tagName = toHyphen((clazz as Function).name)
        }

        if (baseTag === undefined) {
            customElements.define(tagName, clazz)
        } else {
            customElements.define(tagName, clazz, {
                extends: baseTag,
            })
        }

        return clazz as any
    }

}
