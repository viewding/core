
import {
    PropertyPart,
    Directive,
    PartInfo,
    PartType,
    noChange,
    nothing,
    directive,
} from '@viewding/lit-html'

import { ReactiveRef } from './reactiveRef'

type RefValue<T> = (value?: T) => T

function isSameArray(a1: any[], a2: any[]) {
    if (!Array.isArray(a1) || !Array.isArray(a2)) return false
    if (a1.length != a2.length) return false
    a1.forEach((item, index) => {
        if (item != a2[index]) return false
    })
    return true
}

// function parseInputValue(input: RefValue<any> | [string,object] | [object, string] | string): RefValue<any> {
//     if( typeof input === 'function') return input
//     if( Array.isArray(input)){
//         if(typeof input[0] == 'string') return refProp(input[0], input[1])
//         else  return refProp(input[1] as string, input[0])
//     }
//     return refProp(input)
// }

// function refProp(prop: string, obj?: any): RefValue<any> {
//     if (!obj) obj = this
//     return (value?) => {
//         value!==undefined ? (obj[prop] = value) : obj[prop]
//     }
// }

// ？？ 用上面返回包裹函数替代下面的getValue/setValue在运行时不正常，不清楚原因
// todo：input取值为object时，默认object有value字段。
function getValue(this:any,
    input: RefValue<any> | [string, object] | [object, string] | string
) {
    if (typeof input === 'function') return input()
    if (Array.isArray(input)) {
        if (typeof input[0] == 'string') return (input[1] as any)[input[0]]
        else return (input[0] as any)[input[1] as string]
    }
    return this[input]
}

function setValue(this:any,
    input: RefValue<any> | [string, object] | [object, string] | string,
    value: any
) {
    if (typeof input === 'function') {
        input(value)
        return
    }
    if (Array.isArray(input)) {
        if (typeof input[0] == 'string') (input[1] as any)[input[0]] = value
        else (input[0] as any)[input[1] as string] = value
        return
    }
    this[input] = value
}

type InputOptions = {
    eventName: string
    valueProp: string // 当绑定check, radio时，valueProp用来指定checked时的取值。
    modifiers?: string
}

function inputEventName(element: HTMLElement) {
    const tag = element.tagName.toLowerCase()
    if (tag === 'select') return 'change'
    if (tag === 'textarea') return 'input'
    if (tag === 'input') {
        const type = (element as HTMLInputElement)['type']
        return  type == 'checkbox' || type == 'radio'
            ? 'change'
            : 'input'
    }
    return 'update'
}

class RadioDirective extends Directive {
    _args?: any[]
    inputValue?: ReactiveRef<any> | [string, object] | [object, string] | string
    element?: HTMLElement
    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.PROPERTY) {
            throw new Error('Error')
        }
    }

    // ？？
    // 可能对于自定义组件才会执行该方法，在浏览器中跟踪时，对于input来说，发现下述方法未被执行。
    render(
        inputValue:
            | ReactiveRef<any>
            | [string, object]
            | [object, string]
            | string,
        inputOptions?: InputOptions
    ) {
        return nothing
    }

    update(part: PropertyPart, args: any[]) {
        this.element = part.element as HTMLElement

        this.inputValue = args[0]
        const checkProp = part.name
        const {
            eventName = inputEventName(this.element),
            valueProp = 'value',
            modifiers,
        } = args[1] || {}

        const checked = (this.element as any)[valueProp!] == getValue(this.inputValue!)
        if ((this.element as any)[checkProp!] != checked) {
            (this.element as any)[checkProp!] = checked
        }

        if (isSameArray(this._args!, args)) return noChange
        this._args = args

        // 注册事件，跟踪用户的交互输入
        this.element.addEventListener(eventName, () => {
            if ((this.element as any)[checkProp!])
                setValue(this.inputValue!, (this.element as any)[valueProp!])
        })
        return noChange
    }
}

class CheckDirective extends Directive {
    _args?: any
    inputValue?: any[]
    element?: HTMLElement
    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.PROPERTY) {
            throw new Error('Error')
        }
    }

    render(inputValue: any[], inputOptions?: InputOptions) {
        return nothing
    }

    update(part: PropertyPart, args: any[]) {
        this.element = part.element as HTMLElement

        this.inputValue = args[0]
        const checkProp = part.name
        const {
            eventName = inputEventName(this.element),
            valueProp = 'value',
            modifiers,
        } = args[1] || {}

        ;(this.element as any)[checkProp!] = this.inputValue!.includes(
            (this.element as any)[valueProp!]
        )

        if (isSameArray(this._args, args)) return noChange
        this._args = args

        // 注册事件，跟踪用户的交互输入
        this.element.addEventListener(eventName, () => {
            const pos = this.inputValue!.indexOf((this.element as any)[valueProp!])
            if ((this.element as any)[checkProp!]) {
                if (pos < 0) this.inputValue!.push((this.element as any)[valueProp!])
            } else {
                if (pos >= 0) this.inputValue!.splice(pos, 1)
            }
        })
        return noChange
    }
}

class ValueDirective extends Directive {
    _args: any
    inputValue?: ReactiveRef<any> | [string, object] | [object, string] | string
    element?: HTMLElement
    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.PROPERTY) {
            throw new Error('Error')
        }
    }

    render(
        inputValue:
            | ReactiveRef<any>
            | [string, object]
            | [object, string]
            | string,
        inputOptions?: InputOptions
    ) {
        return getValue(inputValue)
    }

    update(part: PropertyPart, args:any[]) {
        this.element = part.element as HTMLElement
        this.inputValue = args[0]
        const valueProp = part.name
        const { eventName = inputEventName(this.element), modifiers } =
            args[1] || {}

        ;(this.element as any)[valueProp!] = getValue(this.inputValue!)

        // 避免重复注册事件
        if (isSameArray(this._args, args)) return noChange
        this._args = args

        // 注册事件，跟踪用户的交互输入
        const eventHandler = () => {
            setValue(this.inputValue!, (this.element as any)[valueProp!])
        }
        this.element.addEventListener(eventName, eventHandler)
        return noChange
    }
}

// Create the directive function
export const value = directive(ValueDirective)
export const radio = directive(RadioDirective)
export const check = directive(CheckDirective)

declare global {
    export interface HTMLSelectElement {
        get $values(): string | string[]
        set $values(value: string | string[])
    }
}
Object.defineProperty(HTMLSelectElement.prototype, '$values', {
    get() {
        if (this.options && this.multiple) {
            const options = [...this.options]
            return options
                .filter((option) => option.selected)
                .map((option) => option.value)
        } else {
            return this.value
        }
    },
    set(value) {
        const values = value instanceof Array ? value : [value]
        const options = [...this.options]
        options.map((option) => {
            if (values.includes(option.value)) {
                option.selected = true
            }
        })
    },
    enumerable: true,
    configurable: false,
})
