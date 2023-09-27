/** @format */

import { render, TemplateResult } from "@viewding/lit-html"
import { toHyphen } from "./utils.js"
import { reactive } from "@viewding/reactivity"
import { asyncEffect } from "./mount"

export interface PropertyDefine<Type = unknown> {
    // 对于对象，赋初值时不要使用undefined或null，否则无法自动推断属性的数据类型，可以使用{},()=>{},[]等带类型信息的空白值。
    // 对于基本类型直接赋值即可，如5, "abc", true等。
    initValue?: Type

    // Property的类型，从Attribute转换时，如果Property尚未赋值，那么需要下述字段确定Property的类型。
    type?: string

    /* 取值false时，不创建Property对应的Attribute。
     * 一般来说，简单数据类型的property都有对应的attribute，对象类型的property往往没有对应的attribute。
     * 如果property是对象类型，并且设置了attribute，那么默认的attribute采用json格式的字符串来表示object的值。
     */
    attribute?: boolean | string

    // 属性值是否发生了变化的检测函数，。
    hasChanged?(value: Type, oldValue: Type): boolean

    // 从attribute获取propery的值
    fromAttribute?(value: string | null, type?: unknown): Type

    // 把property值转换给对应的attribute字符串值，或者null。
    toAttribute?(value: Type): string | null
}

// attribute取值为真时，设置为""空字符串。
const attributeTrueValue = ""

export function toAttribute(value: unknown): null | string {
    const type = typeof value
    let attrValue: null | string = null
    switch (type) {
        case "boolean":
            attrValue = value ? attributeTrueValue : null
            break
        case "undefined":
            attrValue = null
            break
        case "bigint":
        case "number":
        case "string":
        case "symbol":
            attrValue = String(value)
            break
        case "object":
        case "function":
            attrValue = value == null ? null : JSON.stringify(value)
            break
    }
    return attrValue
}

export function fromAttribute<T>(value: string | null, type?: string) {
    if (value === null) {
        return value
    }
    let propValue: unknown = value
    switch (type) {
        case "boolean":
            propValue = value !== null
            break
        case "bigint":
            propValue = value === null ? null : BigInt(value)
        case "number":
            propValue = value === null ? null : Number(value)
            break
        case "symbol":
            propValue = Symbol.for(value)
            break
        case "object":
        case "function":
            // Do *not* generate exception when invalid JSON is set as elements
            // don't normally complain on being mis-configured.
            // TODO(sorvell): Do generate exception in *dev mode*.
            try {
                // Assert to adhere to Bazel's "must type assert JSON parse" rule.
                propValue = JSON.parse(value!) as unknown
            } catch (e) {
                propValue = null
            }
            break
    }

    return propValue as T
}

/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
export const notEqual = (value: unknown, old: unknown): boolean => {
    // This ensures (old==NaN, value==NaN) always returns false
    return old !== value && (old === old || value === value)
}

type Constructor<T = {}> = new (...args: any[]) => T

export type Hook = "BeforeRender" | "AfterRender" | "Connected" | "Disconnected"
export type HookCallBack = (isFirst?: boolean) => void

// shadowRootOptions在createRenderRoot()中使用，createRenderRoot的默认行为是：
// 当shadowRootOptions = undefined时，shadowRoot取值为this，即元素自身，不使用ShadowDOM技术来构建元素。
// 当shadowRootOptions非空时，shadowRoot取值为Element.attachShadow(shadowRootOptions)的返回值。
export function customizeElement<T extends Constructor<HTMLElement>>(
    superClass = HTMLElement as T,
    shadowRootOptions?: ShadowRootInit,
    isReactive?: boolean
): new (...params: any[]) => CustomElement {
    class BaseElement extends superClass {
        static properties: { [key: string]: PropertyDefine<unknown> } = {}

        // 映射表<attribute-name, properyName>
        // a
        static __attributeToPropertyMap = new Map<string, PropertyKey>()

        // 获取propery对应的attribute名称。
        static __attributeNameForProperty(name: PropertyKey, options: PropertyDefine) {
            const attribute = options.attribute

            // 如果 attribute===undefined, 那么返回对应propName的短划线名称。
            return attribute === false
                ? undefined
                : typeof attribute === "string"
                ? attribute
                : typeof name === "string"
                ? toHyphen(name)
                : undefined
        }

        // 监听property对应的attribute的改变。
        static get observedAttributes() {
            const attributes: string[] = []

            for (const [p, opt] of Object.entries(this.properties)) {
                if (opt.attribute == false) {
                    continue
                }
                const attr = this.__attributeNameForProperty(p, opt)
                if (attr !== undefined) {
                    this.__attributeToPropertyMap.set(attr, p)
                    attributes.push(attr)
                }
            }
            return attributes
        }

        defineProperties() {
            for (const [p, propOpt] of Object.entries((this.constructor as typeof BaseElement).properties)) {
                // 可以在注解或者静态属性properties中提供实例property的初始值。
                // 否则，如果是通过class的声明语法提供初始值，那么只有在类装饰器中获取。
                const proto = (this.constructor as typeof BaseElement).prototype
                if (propOpt.initValue !== undefined) {
                    ;(this as BaseElement).props[p] = propOpt.initValue
                }

                // 说明：下述语句事实上永远不会执行，不论是否使用 useDefineForClassFields 来生成属性，执行defineProperties时还在基类的构造函数中，只有执行到子类的构造函数时才产生子类的自定义属性（两种方式都一样，一种是在构造中生成 this.xxx=vvvv语句，一种是在this实例中生成属性描述符）
                // else if (this[p] !== undefined ){
                //     (this as BaseElement).props[p] = this[p]
                // }

                const descriptor = this.getPropertyDescriptor(p, propOpt)
                if (descriptor !== undefined) {
                    Object.defineProperty(this, p, descriptor)
                }
            }
        }

        // 根据属性定义返回属性描述符
        getPropertyDescriptor(name: PropertyKey, options: PropertyDefine): PropertyDescriptor | undefined {
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                get(): any {
                    return (this as BaseElement).props[name as string]
                },
                set(this: BaseElement, value: unknown) {
                    const oldValue = (this as BaseElement).props[name as string]
                    // 第一次给属性赋值时，如果属性定义中尚未设置初始值，那么设为初始值，同时给没有设置的属性定义赋初始值。
                    if (oldValue == undefined && value != undefined) {
                        ;(this as BaseElement).props[name as string] = value
                        const opt = (this.constructor as typeof BaseElement).properties[name.toString()]
                        if (opt.initValue == undefined) {
                            if (opt.type == undefined) {
                                opt.type = typeof value
                            }
                            if (opt.attribute == undefined) {
                                opt.attribute = value instanceof Object ? false : true
                            }
                        }
                        return
                    }
                    const hasChanged = options.hasChanged || notEqual
                    if (hasChanged(value, oldValue)) {
                        ;(this as BaseElement).props[name as string] = value
                    }
                },
                configurable: true,
                enumerable: true,
            }
        }

        // 用实例方法方法属性的定义。
        getPropertyOptions(name: PropertyKey) {
            return (this.constructor as typeof BaseElement).properties[name.toString()]
        }

        /* See [using the lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)
         * on MDN for more information about the `attributeChangedCallback`.
         */
        // attribute改变时，同步设置对应的property的值。
        attributeChangedCallback(name: string, _old: string | null, value: string | null) {
            const ctor = this.constructor as typeof BaseElement
            // Note, hint this as an `AttributeMap` so closure clearly understands
            // the type; it has issues with tracking types through statics
            const propName = ctor.__attributeToPropertyMap.get(name)

            if (propName !== undefined) {
                const options = this.getPropertyOptions(propName)

                // ？？observedAttributes()是每次attribute发生变化时就调用，还是一次性调用？
                // 在静态方法observedAttributes()的返回值中指明的属性可能包含了options.attribute为false的property。
                if (options.attribute === false) return

                const fromAttr = options.fromAttribute ? options.fromAttribute : fromAttribute
                const newValue = fromAttr(
                    value,
                    options.type ? options.type : typeof this.props[propName]
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ) as any

                // !!重要：避免循环调用，要保证 value === fromAttr(toAttr(value))
                if (this.props[propName] != newValue) {
                    this.props[propName] = newValue
                }
            }
        }

        declare innateClasses: { add?: string; remove?: string }
        declare innateStyles: Record<string, string | number | undefined | null>
        #previousStyles?: Set<string>

        renderClasses() {
            if (this.innateClasses.add) {
                let addList = this.innateClasses.add.split(" ")
                for (const add of addList) {
                    if (add.trim().length == 0) continue
                    this.classList.toggle(add, true)
                }
            }

            if (this.innateClasses.remove) {
                let removeList = this.innateClasses.remove.split(" ")
                for (const remove of removeList) {
                    this.classList.toggle(remove, false)
                }
            }
        }

        renderStyles() {
            const important = "important"
            // The leading space is important
            const importantFlag = " !" + important
            // How many characters to remove from a value, as a negative number
            const flagTrim = 0 - importantFlag.length

            let isFirst = false
            if (this.#previousStyles === undefined) {
                this.#previousStyles = new Set(Object.keys(this.innateStyles))
                isFirst = true
            }

            // Remove old properties that no longer exist in styleInfo
            if (!isFirst) {
                for (const name of this.#previousStyles) {
                    // If the name isn't in styleInfo or it's null/undefined
                    if (this.innateStyles[name] == null) {
                        this.#previousStyles!.delete(name)
                        if (name.includes("--")) {
                            this.style.removeProperty(name)
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ;(this.style as any)[name] = null
                        }
                    }
                }
            }
            // Add or update properties
            for (const name in this.innateStyles) {
                const value = this.innateStyles[name]
                if (value != null) {
                    this.#previousStyles.add(name)
                    const isImportant = typeof value === "string" && value.endsWith(importantFlag)
                    if (name.includes("-") || isImportant) {
                        this.style.setProperty(
                            name,
                            isImportant ? (value as string).slice(0, flagTrim) : (value as string),
                            isImportant ? important : ""
                        )
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ;(this.style as any)[name] = value
                    }
                }
            }
        }

        // 更新attribute的值。
        updateAttribute(isFirst?: boolean) {
            const ctor = this.constructor as typeof BaseElement
            ctor.__attributeToPropertyMap.forEach((p, attr) => {
                if (attr !== undefined) {
                    const propOpt = this.getPropertyOptions(p)
                    const toAttr = propOpt.toAttribute ? propOpt.toAttribute : toAttribute
                    const newValue = toAttr(this.props[p.toString()])

                    if (this.getAttribute(attr) == newValue) {
                        return
                    }

                    if (newValue == null) {
                        this.removeAttribute(attr)
                    } else {
                        this.setAttribute(attr, newValue as string)
                    }
                }
            })

            this.renderClasses()
            this.renderStyles()
        }

        declare props: any

        constructor(...args: any[]) {
            super()
            this.props = reactive({})
            this.innateClasses = reactive({}) as {
                add?: string
                remove?: string
            }
            this.innateStyles = reactive({}) as Record<string, string | number | undefined | null>

            // 目前的实现必须在TSC编译时把defineProperties设置为false，否则，子类会把下述属性定义覆盖掉。
            // todo：解决的方法是同时使用属性和类的装饰器，在装饰器中，删除掉自动生成的ClassFields，同时把删除掉的ClassField中的初始值复制到props中。
            this.defineProperties()
        }

        /**
         * Node or ShadowRoot into which element DOM should be rendered. Defaults
         * to an open shadowRoot.
         */
        readonly renderRoot!: HTMLElement | ShadowRoot

        createRenderRoot(): Element | ShadowRoot {
            if (shadowRootOptions === undefined) {
                return this
            }
            const renderRoot = this.shadowRoot ?? this.attachShadow(shadowRootOptions)
            return renderRoot
        }

        // 子类中覆盖下述方法时，可以在supper.connectedCallback()之前加入代码，以便完成无法在构造函数中完成的初始化工作，
        // 比如，在构造中无法访问元素在html文本中声明的属性值。
        connectedCallback() {
            // create renderRoot before first update.
            if (this.renderRoot === undefined) {
                ;(
                    this as {
                        renderRoot: Element | DocumentFragment
                    }
                ).renderRoot = this.createRenderRoot()
            }

            const callRender = (isFirst?: boolean) => {
                this.__callBackhooks.get("BeforeRender")?.forEach((cb) => cb(isFirst))

                this.render(isFirst)

                this.__callBackhooks.get("AfterRender")?.forEach((cb) => cb(isFirst))
            }

            if (!isReactive) {
                callRender() // 不支持响应式更新DOM时，render仅在组件构建时执行一次。
            } else {
                // 组件支持响应式更新DOM时，当响应式数据发生变化时，自动生成异步任务来调用render()刷新视图。
                let isFirst = true
                asyncEffect(() => {
                    callRender(isFirst)
                    isFirst = false
                })
            }
            this.__callBackhooks.get("Connected")?.forEach((cb) => cb())
        }

        /**
         * Allows for `super.disconnectedCallback()` in extensions while
         * reserving the possibility of making non-breaking feature additions
         * when disconnecting at some point in the future.
         * @category lifecycle
         */
        disconnectedCallback() {
            this.__callBackhooks.get("Disconnected")?.forEach((cb) => cb())
        }

        // render()的默认实现是调用lit-html中的render方法实现挂载刷新视图的功能。
        render(isFirst?: boolean) {
            this.updateAttribute(isFirst)

            if (this.template) {
                render(this.template(), this.renderRoot, { host: this })
            }
        }

        template: (() => TemplateResult) | undefined

        __callBackhooks: Map<Hook, HookCallBack[]> = new Map()

        onCallback(hook: Hook, cb: () => void) {
            if (!this.__callBackhooks.has(hook)) {
                this.__callBackhooks.set(hook, [])
            }
            this.__callBackhooks.get(hook)!.push(cb)
        }
    } // end of class BaseElement

    return BaseElement
}

export const reactiveElement = <T extends Constructor<HTMLElement>>(
    superClass: T = HTMLElement as T,
    shadowRootOptions?: ShadowRootInit
) => customizeElement(superClass, shadowRootOptions, true)

export interface CustomElement extends HTMLElement {
    render(isFirst?: boolean): void
    innateClasses: { add?: string; remove?: string }
    innateStyles: Record<string, string | number | undefined | null>
    onCallback(hook: Hook, cb: () => void): void
    connectedCallback(): void
}
