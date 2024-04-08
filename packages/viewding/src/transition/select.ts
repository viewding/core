/** @format */

import { AsyncDirective, ChildPart, DirectiveParameters, noChange } from "@viewding/lit-html"
import { directive, Directive, PartInfo, PartType, nothing } from "@viewding/lit-html"
import { insertPart, getCommittedValue, setCommittedValue, setChildPartValue } from "@viewding/lit-html"
import {
    Transition,
    UseTransitionFn,
    TransitionElement,
    resolveTransitionHooks,
    TransitionState,
} from "./transition"
import { isFunction } from "../utils"

const defaultKey = Symbol("defaultCase")

abstract class BaseSelectDirective extends AsyncDirective {
    private _caseKey?: unknown
    private transition!: Transition
    private state: TransitionState

    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.CHILD) {
            throw new Error("select or vif directive can only be used in text expressions")
        }
        this.state = {
            isStarting: true,
            isUnmounting: false,
        }
    }

    protected _update<T, V>(
        containerPart: ChildPart,
        value: T,
        cases: Array<[T, () => V]>,
        defaultCase?: (() => V) | UseTransitionFn,
        useTransition?: UseTransitionFn
    ) {
        if (defaultCase && typeof defaultCase !== "function") {
            useTransition = defaultCase
        }

        let renderValue: unknown
        let renderKey: unknown
        for (const c of cases) {
            const caseValue = c[0]
            if (caseValue === value) {
                const fn = c[1]
                renderValue = fn()
                renderKey = value
                break
            }
        }
        if (!renderKey) {
            renderKey = defaultKey
            if (isFunction(defaultCase)) {
                renderValue = defaultCase()
            }
        }

        // 没有设置过渡时，直接返回
        if (!useTransition) {
            return renderValue
        }

        this.transition = useTransition.get()
        const mode = this.transition.props.mode

        // Old part & key lists are retrieved from the last update (which may
        // be primed by hydration)
        const oldPart = getCommittedValue(containerPart)

        // 1. 初次渲染指令
        if (oldPart === nothing) {
            this._caseKey = renderKey
            // No old part for this value; create a new one and
            // insert it
            const newPart = insertPart(containerPart)
            setChildPartValue(newPart, renderValue)

            const el = newPart.startNode?.nextSibling as TransitionElement
            if (el && (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE)) {
                // 把元素添加到transition的过渡元素集合中。
                this.transition.addElement(el)
                // 首次挂载元素，执行beforeEnter钩子，mounted为假
                el._hooks = resolveTransitionHooks(
                    this._caseKey as string,
                    this.transition.props,
                    this.state
                )
                el._hooks.beforeEnter(el)
            }
            // Directly set part value, bypassing it's dirty-checking
            setCommittedValue(containerPart, newPart)
    
            this.state.isStarting = false
            return noChange
        } 
        
        // 2. 更新同一个case条件下的元素，不执行过渡钩子。
        if (this._caseKey === renderKey) {
            setChildPartValue(oldPart as ChildPart, renderValue)
            // Directly set part value, bypassing it's dirty-checking
            setCommittedValue(containerPart, oldPart)
        
            this.state.isStarting = false
            return noChange
        }        
        
        // 3. 切换显示不同的元素, 分三种模式。
        if(mode==="in-out") {
            // 1. in - 添加新元素
            this._caseKey = renderKey
            // No old part for this value; create a new one and
            // insert it
            const newPart = insertPart(containerPart)
            setChildPartValue(newPart, renderValue)
            const el = newPart.startNode?.nextSibling as TransitionElement
            if (el && (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE)) {
                // 把元素添加到transition的过渡元素集合中。
                this.transition.addElement(el)
                var enterHooks = resolveTransitionHooks(
                    this._caseKey as string,
                    this.transition.props,
                    this.state
                )
                el._hooks = enterHooks
                el._hooks.beforeEnter(el)
            }
            // Directly set part value, bypassing it's dirty-checking
            setCommittedValue(containerPart, newPart)
            
            // 1. out - 移除旧元素
            const oldEl = (oldPart as ChildPart).startNode?.nextSibling as TransitionElement
            if (oldEl && (oldEl.nodeType === Node.ELEMENT_NODE || oldEl.nodeType === Node.TEXT_NODE)) {
                const leavingHooks = resolveTransitionHooks(
                    this._caseKey as string,
                    this.transition.props,
                    this.state
                )
                const remove = () => {
                    containerPart.parentNode.removeChild((oldPart as ChildPart).startNode!)
                    containerPart.parentNode.removeChild((oldPart as ChildPart).endNode!)
                    containerPart.parentNode.removeChild(oldEl)
                }
                const performLeave = () => {
                    leavingHooks.leave(oldEl, () => {
                      remove()
                    })
                  }
          
                // early removal callback
                oldEl._leaveCb = () => {
                    remove()
                    el._leaveCb = undefined
                    delete enterHooks.delayedLeave
                }
                enterHooks!.delayedLeave = performLeave
            }
        }
        else if (mode==="out-in") {
            const afterLeave = () => {
                this._caseKey = renderKey

                //this.setValue( renderValue)
                const newPart = insertPart(containerPart)
                setChildPartValue(newPart, renderValue)
                const el = newPart.startNode?.nextSibling as TransitionElement
                if (el && (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE)) {
                    // 把元素添加到transition的过渡元素集合中。
                    this.transition.addElement(el)
                    var enterHooks = resolveTransitionHooks(
                        this._caseKey as string,
                        this.transition.props,
                        this.state
                    )
                    el._hooks = enterHooks
                    el._hooks.beforeEnter(el)
                    setTimeout(()=>{this.transition.update()},0)
                }
                setCommittedValue(containerPart, newPart)
            }

            const oldEl = (oldPart as ChildPart).startNode?.nextSibling as TransitionElement
            if (oldEl && (oldEl.nodeType === Node.ELEMENT_NODE || oldEl.nodeType === Node.TEXT_NODE)) {
                const leavingHooks = resolveTransitionHooks(
                    this._caseKey as string,
                    this.transition.props,
                    this.state
                )
                oldEl._hooks = leavingHooks
                // 对将要移除的元素执行leave钩子, 根据过渡模式执行可选的afterLeave钩子。
                oldEl._hooks.leave(oldEl, () => {
                    containerPart.parentNode.removeChild((oldPart as ChildPart).startNode!)
                    containerPart.parentNode.removeChild((oldPart as ChildPart).endNode!)
                    containerPart.parentNode.removeChild(oldEl)
                    afterLeave()
                })
            }
        }
        else{
            // 1. 移除旧元素
            const oldEl = (oldPart as ChildPart).startNode?.nextSibling as TransitionElement
            if (oldEl && (oldEl.nodeType === Node.ELEMENT_NODE || oldEl.nodeType === Node.TEXT_NODE)) {
                const leavingHooks = resolveTransitionHooks(
                    this._caseKey as string,
                    this.transition.props,
                    this.state
                )
                oldEl._hooks = leavingHooks
                const remove = () => {
                    containerPart.parentNode.removeChild((oldPart as ChildPart).startNode!)
                    containerPart.parentNode.removeChild((oldPart as ChildPart).endNode!)
                    containerPart.parentNode.removeChild(oldEl)
                }
                // 对将要移除的元素执行leave钩子, 根据过渡模式执行可选的afterLeave钩子。
                oldEl._hooks.leave(oldEl, remove)
            }

            // 2. 添加新元素
            this._caseKey = renderKey
            // No old part for this value; create a new one and
            // insert it
            const newPart = insertPart(containerPart)
            setChildPartValue(newPart, renderValue)
            const el = newPart.startNode?.nextSibling as TransitionElement
            if (el && (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE)) {
                // 把元素添加到transition的过渡元素集合中。
                this.transition.addElement(el)
                var enterHooks = resolveTransitionHooks(
                    this._caseKey as string,
                    this.transition.props,
                    this.state
                )
                el._hooks = enterHooks
                el._hooks.beforeEnter(el)
            }
            // Directly set part value, bypassing it's dirty-checking
            setCommittedValue(containerPart, newPart)
        }
        // 说明： enter钩子在transition中关联元素的afterRender回调中执行。
        this.state.isStarting = false
        return noChange
    }
}

class SelectDirective extends BaseSelectDirective {
    render<T, V>(value: T, cases: Array<[T, () => V]>): unknown
    render<T, V>(value: T, cases: Array<[T, () => V]>, defaultCase: () => V): unknown
    render<T, V>(value: T, cases: Array<[T, () => V]>, transition: UseTransitionFn): unknown
    render<T, V>(
        value: T,
        cases: Array<[T, () => V]>,
        defaultCase: () => V,
        transition: UseTransitionFn
    ): unknown
    render<T, V>(
        value: T,
        cases: Array<[T, () => V]>,
        defaultCase?: (() => V) | UseTransitionFn,
        useTransition?: UseTransitionFn
    ) {
        return noChange
    }

    override update<T, V>(
        containerPart: ChildPart,
        [value, cases, defaultCase, useTransition]: DirectiveParameters<this>
    ) {
        return this._update(containerPart, value, cases, defaultCase, useTransition)
    }
}

export type SelectFn = {
    <T, V>(value: T, cases: Array<[T, () => V]>): unknown
    <T, V>(value: T, cases: Array<[T, () => V]>, defaultCase: () => V): unknown
    <T, V>(value: T, cases: Array<[T, () => V]>, transition: UseTransitionFn): unknown
    <T, V>(value: T, cases: Array<[T, () => V]>, defaultCase: () => V, transition: UseTransitionFn): unknown
}

export const select = directive(SelectDirective) as SelectFn

class VifDirective extends BaseSelectDirective {
    render<V>(condition: boolean, trueCase: () => V): unknown
    render<V>(condition: boolean, trueCase: () => V, falseCase: () => V): unknown
    render<V>(condition: boolean, trueCase: () => V, transition: UseTransitionFn): unknown
    render<V>(condition: boolean, trueCase: () => V, falseCase: () => V, transition: UseTransitionFn): unknown
    render<V>(
        condition: boolean,
        trueCase: () => V,
        falseCase?: (() => V) | UseTransitionFn,
        useTransition?: UseTransitionFn
    ) {
        return noChange
    }

    override update<V>(
        containerPart: ChildPart,
        [condition, trueCase, falseCase, useTransition]: DirectiveParameters<this>
    ) {
        const cases = [["trueCase", trueCase] as [string, () => V]]
        const value = condition ? "trueCase" : "falseCase"
        return this._update(containerPart, value, cases, falseCase, useTransition)
    }
}

export type VifFn = {
    <V>(condition: boolean, trueCase: () => V): unknown
    <V>(condition: boolean, trueCase: () => V, falseCase: () => V): unknown
    <V>(condition: boolean, trueCase: () => V, transition: UseTransitionFn): unknown
    <V>(condition: boolean, trueCase: () => V, falseCase: () => V, transition: UseTransitionFn): unknown
}

export const vif = directive(VifDirective) as VifFn
