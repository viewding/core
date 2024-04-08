/** @format */

import { render, TemplateResult, templateContent } from "@viewding/lit-html"

import { reactive, ReactiveEffect } from "@viewding/reactivity"
import { toHyphen } from "./utils.js"
import { asyncEffect, CssResult} from "./mount"
import { ParameterTemplate } from "./parameterTemplate.js"

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
    attribute: boolean | string

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

// 获取propery对应的attribute名称。
function attributeNameForProperty(name: PropertyKey, options: PropertyDefine) {
    const attribute = options.attribute

    // 如果 attribute===true, 那么返回对应propName的短划线名称。
    return attribute === false
        ? undefined
        : typeof attribute === "string"
        ? attribute
        : typeof name === "string"
        ? toHyphen(name)
        : undefined
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

export type Hook = "BeforeRender" | "AfterRender" | "Connecting" | "Connected" | "Disconnected"
export type HookCallBack = (el?: ReactiveElement) => void

// shadowRootOptions取值如下：
// 取值undefined时，this.renderRoot为this，即元素自身，不使用ShadowDOM技术来构建元素。
// 取值ShadowRootInit，this.renderRoot为Element.attachShadow(shadowRootOptions)的返回值。
export function reactiveElement<T extends Constructor<HTMLElement>>(
    superClass = HTMLElement as T,
    shadowRootOptions?: ShadowRootInit,
){
    class BaseElement extends superClass {
        // 从基类扩展子类时，子类的原型指向基类，所以能继承静态成员。
        // 在子类执行基类的静态函数时，自动创建子类自己的数据成员。
        static properties(){
            if(!(this as any).propdefines){
                (this as any).propdefines = {} 
            }
            return (this as any).propdefines as { [key: string]: PropertyDefine<unknown> }
        }

        // 映射表<attribute-name, properyName>
        static attributeToPropertyMap(){
            if(!(this as any).attrToProp){
                (this as any).attrToProp = new Map<string, PropertyKey>()
            }
            return (this as any).attrToProp as Map<string, PropertyKey>
            
        }

        // 覆蓋web components规范中的observedAttributes静态方法，监视绑定了property的attribute。
        // 返回绑定了property的attribute 名称数组，当这些attribute改变时，在attributeChangeCallback中更新property。
        static get observedAttributes() {
            const attributes: string[] = []

            // 静态方法中的this不是实例，而是class本身，下述语句中的this,BaseElement的子类中执行时，就是对应的子类本身。
            for (const [p, opt] of Object.entries(this.properties())) {
                if (opt.attribute == false) {
                    continue
                }
                const attr = attributeNameForProperty(p, opt)
                if (attr !== undefined) {
                    this.attributeToPropertyMap().set(attr, p)
                    attributes.push(attr)
                }
            }
            return attributes
        }

        defineProperties() {

            this.props = reactive({}) 

            for (const [p, propOpt] of Object.entries((this.constructor as typeof BaseElement).properties())) {

                // 如果设置了propOpt.initValue, 那么赋值给 props。
                if (propOpt.initValue !== undefined) {
                    ;(this as BaseElement).props[p] = propOpt.initValue
                }

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
                    // 如果props[name]没有值，那么在set时完成props中初始值的设置和propertyDefine中type的设置。
                    // 这个行为一般发生在子类定义中 this.xxxxx = vvvv语句执行时。          
                    if (oldValue == undefined && value != undefined) {
                        ;(this as BaseElement).props[name as string] = value
                        const opt = (this.constructor as typeof BaseElement).properties()[name.toString()]
                        if (opt.initValue == undefined) {
                            opt.initValue = value
                        }
                        if (opt.type == undefined) {
                            opt.type = typeof value
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

        // 用实例方法获取属性的定义。
        getPropertyOptions(name: PropertyKey) {
            return (this.constructor as typeof BaseElement).properties()[name.toString()]
        }

        /* See [using the lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)
         * on MDN for more information about the `attributeChangedCallback`.
         */
        // attribute改变时，同步设置对应的property的值。
        attributeChangedCallback(name: string, _old: string | null, value: string | null) {
            const ctor = this.constructor as typeof BaseElement
            // Note, hint this as an `AttributeMap` so closure clearly understands
            // the type; it has issues with tracking types through statics
            const propName = ctor.attributeToPropertyMap().get(name)

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

                // 出于性能的考虑，避免不必要的赋值。
                if (this.props[propName] != newValue) {
                    this.props[propName] = newValue
                }
                const hasChanged = options.hasChanged || notEqual
                if (hasChanged(newValue, this.props[propName])) {
                    ;(this as BaseElement).props[name as string] = value
                }

            }
        }

        getInnateClasses(): Record<string, boolean | undefined | null>{
            return {}
        }
        getInnateStyles(): Record<string, string | number | undefined | null>{
            return {}
        }
        #previousStyles?: Set<string>

        #updateInnateClasses() {
            const classes = this.getInnateClasses()
            for (const name in classes) {
                const value = classes[name]
                if(value){
                    this.classList.toggle(name, true)
                }
                else {
                    this.classList.toggle(name, false)
                }
            }
        }

        #updateInnateStyles() {
            const important = "important"
            // The leading space is important
            const importantFlag = " !" + important
            // How many characters to remove from a value, as a negative number
            const flagTrim = 0 - importantFlag.length
            const styles = this.getInnateStyles()
            if (this.#previousStyles === undefined) {
                this.#previousStyles = new Set(Object.keys(styles))
            }
            else{
                // Remove old properties that no longer exist in styleInfo
                for (const name of this.#previousStyles) {
                    // If the name isn't in styleInfo or it's null/undefined
                    if (styles[name] == null) {
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
            for (const name in styles) {
                const value = styles[name]
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
        #updateAttribute(isFirst?: boolean) {
            const ctor = this.constructor as typeof BaseElement
            ctor.attributeToPropertyMap().forEach((p, attr) => {
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
        }

        declare props: any
        declare firstRender: boolean   // renderCounter: 0, 1, 2, 3, ...  0 相当于 isFirst
        declare effect: ReactiveEffect

        //当从reactiveElement派生子类时，由于defineProperties是在reactiveElement的构造函数中执行，而不是在子类中执行，所以**必须在TSC编译时把defineProperties设置为false**，此时，在子类中会生成如下语句, 否则，TSC生成的子类会把defineProperties()中定义的属性覆盖掉。
        // this.xxx = vvvv
        // 在该语句执行时，会调用defineProperties()中定义的属性的set方法，从而完成props中初始值的设置的设置。

        //除非强制派生子类时在构造函数中调用`this.defineProperties()`，否则，解决的方案是在使用属性装饰器的同时使用类的装饰器，在类装饰器中，添加初始化器来实现响应式属性的逻辑。
        constructor(...args: any[]) {
            super()
            this.firstRender = true
            this.defineProperties()
        }

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
            this.init()
            this.#callBackhooks.get("Connecting")?.forEach((cb) => cb(this))

            // create renderRoot before first update.
            if (this.renderRoot === undefined) {
                ;(
                    this as {
                        renderRoot: Element | DocumentFragment
                    }
                ).renderRoot = this.createRenderRoot()
            }

            // 响应式更新DOM：当响应式数据发生变化时，自动生成异步任务来调用render()刷新视图。
            this.effect = asyncEffect(() => {
                this.callRender()
                this.firstRender = false
            })
            this.#callBackhooks.get("Connected")?.forEach((cb) => cb(this))
        }

        disconnectedCallback() {
            this.#callBackhooks.get("Disconnected")?.forEach((cb) => cb(this))
        }

         callRender ()  {
            this.#callBackhooks.get("BeforeRender")?.forEach((cb) => cb(this))

            this.#updateAttribute()
            this.#updateInnateClasses()
            this.#updateInnateStyles()

            this.render()

            this.#callBackhooks.get("AfterRender")?.forEach((cb) => cb(this))
        }

        // render()的默认实现是调用lit-html中的render方法实现挂载刷新视图的功能。
        render() {
            const tmp = this.template()
            if (tmp) {
                render(tmp, this.renderRoot, { host: this })
            }
        }

        init(){}
        template ():TemplateResult | void{}
        #callBackhooks: Map<Hook, HookCallBack[]> = new Map()

        onCallback(hook: Hook, cb: HookCallBack) {
            if (!this.#callBackhooks.has(hook)) {
                this.#callBackhooks.set(hook, [])
            }
            this.#callBackhooks.get(hook)!.push(cb)
        }
    
        templateContent(name:string="default", defaultTemplate?:(...params: unknown[])=>TemplateResult, ...params:unknown[] ){
            console.log("\n Render...")
            const template = this.querySelector(`template[slot="${name}"]`)
            if (template){
                if(template.getAttribute("is")=="parameter-template"){
                    const t = (template as ParameterTemplate).render
                    if(t!=null) return t(params)
                }
                else return templateContent(template as HTMLTemplateElement)
            }
            else if( defaultTemplate ){
                return defaultTemplate(params)
            }
            else return ""
        }
    
        static styles(): CssResult {return "" as CssResult }
    } // end of class BaseElement

    return BaseElement
}

export type ReactiveElement = InstanceType<ReturnType<typeof reactiveElement>>

// 每次调用reactiveElement时返回不同的BaseElement，直接使用以下预先生成的基类，既简明又可以避免重复执行函数的开销。
export const ReactiveHTMLElement = reactiveElement(HTMLElement)
export const ReactiveHTMLButtonElement = reactiveElement(HTMLButtonElement)
