/** @format */

import { ElementPart, Directive, PartInfo, PartType, noChange, nothing, directive, DirectiveParameters } from "@viewding/lit-html"

import { ReactiveRef } from "@viewding/reactivity"

type RefValue<T> = (value?: T) => T

function isSameArray(a1: any[], a2: any[]) {
    if (!Array.isArray(a1) || !Array.isArray(a2)) return false
    if (a1.length != a2.length) return false
    a1.forEach((item, index) => {
        if (item != a2[index]) return false
    })
    return true
}

// input取值为object时，默认object有value字段。
function getValue(input: ReactiveRef<any> | Array<any> | object, field?: string) {
    if (typeof input === "function") return input()
    if (field) {
        return (input as any)[field]
    }

    // input  is a Array
    return input
}

function setValue(value: any, input: RefValue<any> | Array<any> | object, fieldOrArrayOp?: string | boolean) {
    if (typeof input === "function") {
        input(value)
        return
    }
    if (typeof fieldOrArrayOp === "string") {
        ;(input as any)[fieldOrArrayOp] = value
        return
    }

    if (Array.isArray(input)) {
        if(Array.isArray(value)) {
            input.length = 0
            input.push(value)
        }
        else {
            const pos = input.indexOf(value)
            if (fieldOrArrayOp == true) {
                if (pos < 0) input.push(value)
            } else {
                if (pos >= 0) input.splice(pos, 1)
            }
        }
    }
}

type InputOptions = {
    eventName: string
    modifiers?: string
}

function inputEventName(element: HTMLElement) {
    const tag = element.tagName.toLowerCase()
    if (tag === "select") return "change"
    if (tag === "textarea") return "input"
    if (tag === "input") {
        const type = (element as HTMLInputElement)["type"]
        return type == "checkbox" || type == "radio" ? "change" : "input"
    }
    return "update"
}

function setElementValue(
    element: HTMLElement,
    inputValue: ReactiveRef<any> | Array<any> | object,
    field?: string
) {
    const v = getValue(inputValue, field)
    const tag = element.tagName.toLowerCase()
    if (tag === "input") {
        const eleInput = element as HTMLInputElement
        const type = eleInput["type"]
        if (type == "checkbox" || type == "radio") {
            const checked = eleInput.checked
            const value = eleInput.value
            if (Array.isArray(inputValue)) {
                const pos = inputValue.indexOf(value)
                eleInput.checked = pos >= 0
            } else if (typeof v == "boolean") {
                eleInput.checked = v
            } else {
                eleInput.checked = v == value
            }
            return
        }
    }
    if (tag === "select") {
        const eleSelect = element as HTMLSelectElement
        const options = [...eleSelect.options]
        if (Array.isArray(inputValue)) {
            options.map((option) => {
                if (inputValue.includes(option.value)) {
                    option.selected = true
                }
            })
        } 
        else if (Array.isArray(v)) {
            options.map((option) => {
                if (v.includes(option.value)) {
                    option.selected = true
                }
            })
        } 
        else {
            eleSelect.value = v
        }
        return
    }

    ;(element as any)["value"] = v
}

function updateListener(
    element: HTMLElement,
    inputValue: ReactiveRef<any> | Array<any> | object,
    field?: string
) {
    let value: any
    const tag = element.tagName.toLowerCase()
    switch (tag) {
        case "input":
            value = (element as HTMLInputElement)["value"]
            break
        case "earea":
            value = (element as HTMLTextAreaElement)["value"]
            break
        case "select":
            const se = element as HTMLSelectElement
            if (se.options && se.multiple) {
                const options: any[] = [...se.options]
                value = options.filter((option) => option.selected).map((option) => option.value)
            } else {
                value = se.value
            }
            break
        default:
            value = (element as any)["value"]
    }

    // 对check、radio做特殊处理
    if (tag === "input") {
        const type = (element as HTMLInputElement)["type"]
        if (type == "checkbox" || type == "radio") {
            const v = typeof getValue(inputValue)
            const checked = (element as HTMLInputElement).checked
            if (v == "boolean") {
                setValue(checked, inputValue,field)
            } else if (Array.isArray(inputValue)) {
                setValue(value, inputValue, checked)
            } else {
                setValue(value, inputValue,field)
            }
            return
        }
    }

    setValue(value, inputValue, field)
}

class BindValueDirective extends Directive {
    _args: any
    inputValue?: ReactiveRef<any> | Array<any> | object
    field?: string
    element?: HTMLElement
    updateListener?: (event: any) => void
    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error("Error")
        }
    }

    render(inputValue:ReactiveRef<any> | Array<any> | object, field?: string, inputOptions?: InputOptions) {
        return getValue(inputValue, field)
    }

    update(part: ElementPart,[inputValue, field, inputOptions]: DirectiveParameters<this>) {
        this.element = part.element as HTMLElement

        this.inputValue = inputValue
        this.field = field

        let eventName = inputEventName(this.element)
        if(inputOptions?.eventName){
            eventName = inputOptions?.eventName
        }
        setElementValue(this.element, this.inputValue!, this.field)

        // 避免重复注册事件, 否则每一次update render都会注册一个事件。
        if (this.updateListener) return noChange

        // 注册事件，跟踪用户的交互输入
        const eventHandler = () => {
            updateListener(this.element!, this.inputValue!, this.field)
        }
        this.element.addEventListener(eventName, eventHandler)
        this.updateListener = eventHandler
        return noChange
    }
}

// Create the directive function
export const bindValue = directive(BindValueDirective)
