/** @format */

import { ReactiveElement } from "../reactiveElement"
import { isFunction, isPromise, isObject, toNumber } from "../utils"

const __DEV__ = true

type Hook<T = () => void> = T | T[]

export interface BaseTransitionParams {
    mode?: "in-out" | "out-in" | "default"
    appear?: boolean

    // If true, indicates this is a transition that doesn't actually insert/remove
    // the element, but toggles the show / hidden status instead.
    // The transition hooks are injected, but will be skipped by the renderer.
    // Instead, a custom directive can control the transition by calling the
    // injected hooks (e.g. v-show).
    persisted?: boolean

    // Hooks. Using camel case for easier usage in render functions & JSX.
    // In templates these can be written as @before-enter="xxx" as prop names
    // are camelized.
    onBeforeEnter?: Hook<(el: HTMLElement) => void>
    onEnter?: Hook<(el: HTMLElement, done: () => void) => void>
    onAfterEnter?: Hook<(el: HTMLElement) => void>
    onEnterCancelled?: Hook<(el: HTMLElement) => void>
    // leave
    onBeforeLeave?: Hook<(el: HTMLElement) => void>
    onLeave?: Hook<(el: HTMLElement, done: () => void) => void>
    onAfterLeave?: Hook<(el: HTMLElement) => void>
    onLeaveCancelled?: Hook<(el: HTMLElement) => void> // only fired in persisted mode
    // appear
    onBeforeAppear?: Hook<(el: HTMLElement) => void>
    onAppear?: Hook<(el: HTMLElement, done: () => void) => void>
    onAfterAppear?: Hook<(el: HTMLElement) => void>
    onAppearCancelled?: Hook<(el: HTMLElement) => void>
}

export interface TransitionHooks {
    mode: BaseTransitionParams["mode"]
    persisted: boolean
    beforeEnter(el: TransitionElement): void
    enter(el: TransitionElement): void
    leave(el: TransitionElement, remove: () => void): void

    // optional
    delayedLeave?(): void
}

export type TransitionHookCaller = <T extends any[] = [el: any]>(
    hook: Hook<(...args: T) => void> | undefined,
    args?: T
) => void

export type PendingCallback = (cancelled?: boolean) => void

export interface TransitionElement extends HTMLElement {
    // _vtc = Vue Transition Classes.
    // Store the temporarily-added transition classes on the element
    // so that we can avoid overwriting them if the element's class is patched
    // during the transition.
    _vtc?: Set<string>

    _hooks: TransitionHooks
    _isLeaving: boolean

    // in persisted mode (e.g. v-show), the same element is toggled, so the
    // pending enter/leave callbacks may need to be cancelled if the state is toggled
    // before it finishes.
    _enterCb?: PendingCallback
    _leaveCb?: PendingCallback
    _moveCb?: PendingCallback
}

export interface TransitionState {
    isStarting: boolean // 对应vue中的 !isMounted, 处理 appear 过渡选项。
    isUnmounting: boolean
  }
  
// The transition hooks are attached to the vnode as vnode.transition
    // and will be called at appropriate timing in the renderer.
    // 返回beforeEnter, enter, leave等3个钩子，不包括可选的afterLeave, delayLeave, delayedLeave和clone等4个钩子。
export function resolveTransitionHooks(
    nodeKey: string,
    params: BaseTransitionParams,
    state: TransitionState,
    ) {
        const {
            appear,
            mode,
            persisted = false,
            onBeforeEnter,
            onEnter,
            onAfterEnter,
            onEnterCancelled,
            onBeforeLeave,
            onLeave,
            onAfterLeave,
            onLeaveCancelled,
            onBeforeAppear,
            onAppear,
            onAfterAppear,
            onAppearCancelled,
        } = params

        const callHook: TransitionHookCaller = (hook, args) => {
            hook && callWithAsyncErrorHandling(hook, args)
        }

        // 仅当hooks自身没有done函数参数时，才执行args中的第二个参数表示的done函数。
        const callAsyncHook = (
            hook: Hook<(el: any, done: () => void) => void>,
            args: [TransitionElement, () => void]
        ) => {
            const done = args[1]
            callHook(hook, args)
            if (Array.isArray(hook)) {
                if (hook.every((hook) => hook.length <= 1)) done()
            } else if (hook.length <= 1) {
                done()
            }
        }

        const hooks: TransitionHooks = {
            mode,
            persisted,
            beforeEnter(el) {
                let hook = onBeforeEnter
                if (state.isStarting) {
                    if (appear) {
                        hook = onBeforeAppear || onBeforeEnter
                    } else {
                        return
                    }
                }
                // for same element (v-show)
                if (el._leaveCb) {
                    el._leaveCb(true /* cancelled */)
                }
                callHook(hook, [el])
            },

            enter(el) {
                let hook = onEnter
                let afterHook = onAfterEnter
                let cancelHook = onEnterCancelled
                if (state.isStarting) {
                    if (appear) {
                        hook = onAppear || onEnter
                        afterHook = onAfterAppear || onAfterEnter
                        cancelHook = onAppearCancelled || onEnterCancelled
                    } else {
                        return
                    }
                }
                let called = false
                const done = (el._enterCb = (cancelled?) => {
                    if (called) return
                    called = true
                    if (cancelled) {
                        callHook(cancelHook, [el])
                    } else {
                        callHook(afterHook, [el])
                    }
                    if (hooks.delayedLeave) {
                        hooks.delayedLeave()
                    }
                    el._enterCb = undefined
                })
                // 如果有hook则执行，然后执行done.
                if (hook) {
                    callAsyncHook(hook, [el, done])
                } else {
                    done()
                }
            },

            leave(el, remove) {
                if (el._enterCb) {
                    el._enterCb(true /* cancelled */)
                }
                if (state.isUnmounting) {
                    return remove()
                }
                callHook(onBeforeLeave, [el])
                let called = false
                const done = (el._leaveCb = (cancelled?) => {
                    if (called) return
                    called = true
                    remove()
                    if (cancelled) {
                        callHook(onLeaveCancelled, [el])
                    } else {
                        callHook(onAfterLeave, [el])
                    }
                    el._leaveCb = undefined
                })
                if (onLeave) {
                    callAsyncHook(onLeave, [el, done])
                } else {
                    done()
                }
            },
        }
        return hooks
    }

export function callWithErrorHandling(fn: Function, args?: unknown[]) {
    let res
    try {
        res = args ? fn(...args) : fn()
    } catch (err) {
        console.log(err)
    }
    return res
}

export function callWithAsyncErrorHandling(fn: Function | Function[], args?: unknown[]): any[] {
    if (isFunction(fn)) {
        const res = callWithErrorHandling(fn, args)
        if (res && isPromise(res)) {
            res.catch((err) => {
                console.log(err)
            })
        }
        return res
    }

    const values = [] as any[]
    for (let i = 0; i < fn.length; i++) {
        values.push(callWithAsyncErrorHandling(fn[i], args))
    }
    return values
}
const TRANSITION = "transition"
const ANIMATION = "animation"

type AnimationTypes = typeof TRANSITION | typeof ANIMATION

export interface TransitionProps extends BaseTransitionParams {
    name?: string
    type?: AnimationTypes
    css?: boolean
    duration?: number | { enter: number; leave: number }
    // custom transition classes
    enterFromClass?: string
    enterActiveClass?: string
    enterToClass?: string
    appearFromClass?: string
    appearActiveClass?: string
    appearToClass?: string
    leaveFromClass?: string
    leaveActiveClass?: string
    leaveToClass?: string
    moveClass?: string
}

const DOMTransitionPropsValidators = {
    name: String,
    type: String,
    css: {
      type: Boolean,
      default: true
    },
    duration: [String, Number, Object],
    enterFromClass: String,
    enterActiveClass: String,
    enterToClass: String,
    appearFromClass: String,
    appearActiveClass: String,
    appearToClass: String,
    leaveFromClass: String,
    leaveActiveClass: String,
    leaveToClass: String,
    moveClass: String
  }

/**
 * #3227 Incoming hooks may be merged into arrays when wrapping Transition
 * with custom HOCs.
 */
const callHook = (hook: Function | Function[] | undefined, args: any[] = []) => {
    if (Array.isArray(hook)) {
        hook.forEach((h) => h(...args))
    } else if (hook) {
        hook(...args)
    }
}

/**
 * Check if a hook expects a callback (2nd arg), which means the user
 * intends to explicitly control the end of the transition.
 */
const hasExplicitCallback = (hook: Function | Function[] | undefined): boolean => {
    return hook ? (Array.isArray(hook) ? hook.some((h) => h.length > 1) : hook.length > 1) : false
}

export function resolveTransitionProps(props?: TransitionProps): BaseTransitionParams {
        const baseProps: BaseTransitionParams = {}
        if(!props) props = {}
        for (const key in props) {
            if (!(key in DOMTransitionPropsValidators)) {
                ;(baseProps as any)[key] = (props as any)[key]
            }
        }

        if (props.css === false) {
            return baseProps
        }

        const {
            name = "v",
            type,
            duration,
            enterFromClass = `${name}-enter-from`,
            enterActiveClass = `${name}-enter-active`,
            enterToClass = `${name}-enter-to`,
            appearFromClass = enterFromClass,
            appearActiveClass = enterActiveClass,
            appearToClass = enterToClass,
            leaveFromClass = `${name}-leave-from`,
            leaveActiveClass = `${name}-leave-active`,
            leaveToClass = `${name}-leave-to`,
        } = props

        const durations = normalizeDuration(duration)
        const enterDuration = durations && durations[0]
        const leaveDuration = durations && durations[1]
        const {
            onBeforeEnter,
            onEnter,
            onEnterCancelled,
            onLeave,
            onLeaveCancelled,
            onBeforeAppear = onBeforeEnter,
            onAppear = onEnter,
            onAppearCancelled = onEnterCancelled,
        } = baseProps

        const finishEnter = (el: Element, isAppear: boolean, done?: () => void) => {
            removeTransitionClass(el, isAppear ? appearToClass : enterToClass)
            removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass)
            done && done()
        }

        const finishLeave = (el: Element & { _isLeaving?: boolean }, done?: () => void) => {
            el._isLeaving = false
            removeTransitionClass(el, leaveFromClass)
            removeTransitionClass(el, leaveToClass)
            removeTransitionClass(el, leaveActiveClass)
            done && done()
        }

        const makeEnterHook = (isAppear: boolean) => {
            return (el: Element, done: () => void) => {
                const hook = isAppear ? onAppear : onEnter
                const resolve = () => finishEnter(el, isAppear, done)
                callHook(hook, [el, resolve])
                nextFrame(() => {
                    removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass)
                    addTransitionClass(el, isAppear ? appearToClass : enterToClass)
                    if (!hasExplicitCallback(hook)) {
                        whenTransitionEnds(el, type, enterDuration, resolve)
                    }
                })
            }
        }

        return Object.assign(baseProps, {
            onBeforeEnter(el:HTMLElement) {
                callHook(onBeforeEnter, [el])
                addTransitionClass(el, enterFromClass)
                addTransitionClass(el, enterActiveClass)
            },
            onBeforeAppear(el:HTMLElement) {
                callHook(onBeforeAppear, [el])
                addTransitionClass(el, appearFromClass)
                addTransitionClass(el, appearActiveClass)
            },
            onEnter: makeEnterHook(false),
            onAppear: makeEnterHook(true),
            onLeave(el: Element & { _isLeaving?: boolean }, done: (() => void) | undefined) {
                el._isLeaving = true
                const resolve = () => finishLeave(el, done)
                addTransitionClass(el, leaveFromClass)
                // force reflow so *-leave-from classes immediately take effect (#2593)
                forceReflow()
                addTransitionClass(el, leaveActiveClass)
                nextFrame(() => {
                    if (!el._isLeaving) {
                        // cancelled
                        return
                    }
                    removeTransitionClass(el, leaveFromClass)
                    addTransitionClass(el, leaveToClass)
                    if (!hasExplicitCallback(onLeave)) {
                        whenTransitionEnds(el, type, leaveDuration, resolve)
                    }
                })
                callHook(onLeave, [el, resolve])
            },
            onEnterCancelled(el:HTMLElement) {
                finishEnter(el, false)
                callHook(onEnterCancelled, [el])
            },
            onAppearCancelled(el:HTMLElement) {
                finishEnter(el, true)
                callHook(onAppearCancelled, [el])
            },
            onLeaveCancelled(el:HTMLElement) {
                finishLeave(el)
                callHook(onLeaveCancelled, [el])
            },
        }) as BaseTransitionParams
    }

function normalizeDuration(duration: TransitionProps["duration"]): [number, number] | null {
    if (duration == null) {
        return null
    } else if (isObject(duration)) {
        return [NumberOf(duration.enter), NumberOf(duration.leave)]
    } else {
        const n = NumberOf(duration)
        return [n, n]
    }
}

function NumberOf(val: unknown): number {
    const res = toNumber(val)
    // if (__DEV__) {
    //     assertNumber(res, "<transition> explicit duration")
    // }
    return res
}

export function addTransitionClass(el: Element, cls: string) {
    cls.split(/\s+/).forEach((c) => c && el.classList.add(c))
    ;((el as TransitionElement)._vtc || ((el as TransitionElement)._vtc = new Set())).add(cls)
}

export function removeTransitionClass(el: Element, cls: string) {
    cls.split(/\s+/).forEach((c) => c && el.classList.remove(c))
    const { _vtc } = el as TransitionElement
    if (_vtc) {
        _vtc.delete(cls)
        if (!_vtc!.size) {
            ;(el as TransitionElement)._vtc = undefined
        }
    }
}

// 原来vue中为何不直接用下一帧，而是由下一帧的下一帧？
function nextFrame(cb: () => void) {
//     requestAnimationFrame(() => {
        requestAnimationFrame(cb)
//     })
}

let endId = 0

function whenTransitionEnds(
    el: Element & { _endId?: number },
    expectedType: TransitionProps["type"] | undefined,
    explicitTimeout: number | null,
    resolve: () => void
) {
    const id = (el._endId = ++endId)
    const resolveIfNotStale = () => {
        if (id === el._endId) {
            resolve()
        }
    }

    if (explicitTimeout) {
        return setTimeout(resolveIfNotStale, explicitTimeout)
    }

    const { type, timeout, propCount } = getTransitionInfo(el, expectedType)
    if (!type) {
        return resolve()
    }

    const endEvent = type + "end"
    let ended = 0
    const end = () => {
        el.removeEventListener(endEvent, onEnd)
        resolveIfNotStale()
    }
    const onEnd = (e: Event) => {
        if (e.target === el && ++ended >= propCount) {
            end()
        }
    }
    setTimeout(() => {
        if (ended < propCount) {
            end()
        }
    }, timeout + 1)
    el.addEventListener(endEvent, onEnd)
}

interface CSSTransitionInfo {
    type: AnimationTypes | null
    propCount: number
    timeout: number
    hasTransform: boolean
}

type AnimationProperties = "Delay" | "Duration"
type StylePropertiesKey = `${AnimationTypes}${AnimationProperties}` | `${typeof TRANSITION}Property`

export function getTransitionInfo(el: Element, expectedType?: TransitionProps["type"]): CSSTransitionInfo {
    const styles = window.getComputedStyle(el) as Pick<CSSStyleDeclaration, StylePropertiesKey>
    // JSDOM may return undefined for transition properties
    const getStyleProperties = (key: StylePropertiesKey) => (styles[key] || "").split(", ")
    const transitionDelays = getStyleProperties(`${TRANSITION}Delay`)
    const transitionDurations = getStyleProperties(`${TRANSITION}Duration`)
    const transitionTimeout = getTimeout(transitionDelays, transitionDurations)
    const animationDelays = getStyleProperties(`${ANIMATION}Delay`)
    const animationDurations = getStyleProperties(`${ANIMATION}Duration`)
    const animationTimeout = getTimeout(animationDelays, animationDurations)

    let type: CSSTransitionInfo["type"] = null
    let timeout = 0
    let propCount = 0
    /* istanbul ignore if */
    if (expectedType === TRANSITION) {
        if (transitionTimeout > 0) {
            type = TRANSITION
            timeout = transitionTimeout
            propCount = transitionDurations.length
        }
    } else if (expectedType === ANIMATION) {
        if (animationTimeout > 0) {
            type = ANIMATION
            timeout = animationTimeout
            propCount = animationDurations.length
        }
    } else {
        timeout = Math.max(transitionTimeout, animationTimeout)
        type = timeout > 0 ? (transitionTimeout > animationTimeout ? TRANSITION : ANIMATION) : null
        propCount = type ? (type === TRANSITION ? transitionDurations.length : animationDurations.length) : 0
    }
    const hasTransform =
        type === TRANSITION &&
        /\b(transform|all)(,|$)/.test(getStyleProperties(`${TRANSITION}Property`).toString())
    return {
        type,
        timeout,
        propCount,
        hasTransform,
    }
}

function getTimeout(delays: string[], durations: string[]): number {
    while (delays.length < durations.length) {
        delays = delays.concat(delays)
    }
    return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])))
}

// Old versions of Chromium (below 61.0.3163.100) formats floating pointer
// numbers in a locale-dependent way, using a comma instead of a dot.
// If comma is not replaced with a dot, the input will be rounded down
// (i.e. acting as a floor function) causing unexpected behaviors
function toMs(s: string): number {
    return Number(s.slice(0, -1).replace(",", ".")) * 1000
}

// synchronously force layout to put elements into a certain state
export function forceReflow() {
    return document.body.offsetHeight
}

// 可以扩展出自己的过渡对象
// 维护过度设置和参与过渡的元素，同时在renader的生命周期中回调过渡的钩子。
// 再带过渡参数的指令如vif, vcase, vfor中，推送参与过渡的元素给elements。
export class Transition {
    props: TransitionProps
    mountHost: ReactiveElement
    elements = new Set<TransitionElement>()

    public constructor(host: ReactiveElement,  props?: TransitionProps) {
        this.props = Object.assign({}, props, resolveTransitionProps(props))
        this.mountHost = host
        host.onCallback("AfterRender", () => {
            for (const el of this.elements) {
                if(!el._isLeaving)
                el._hooks.enter(el)
            }
            this.elements.clear()
        })
    }
    public addElement(el: TransitionElement) {
        this.elements.add(el)
    }
    public removeElement(e1: TransitionElement) {
        this.elements.delete(e1)
    }
    public update(){
        this.mountHost.callRender()
    }

}

// 在同一个host模板环境中，用一个useTransition()返回对象中的get()方法，可以在每个支持transition的指令中得到不同过渡对象。
export function useTransition (host: ReactiveElement, transition?: (typeof Transition) | TransitionProps, props?: TransitionProps){
        // 参数不全
        if(!props){
            // 只有一个参数
            if(!transition){
                transition = Transition 
            }
            // 有两个参数时，如果第二个参数不是函数，那么用作props。
            else{
                if(!isFunction(transition)){
                    props = transition as TransitionProps
                    transition = Transition
                }
            }
        }
        return {
            get(){
                return new (transition as typeof Transition)(host, props )
            }
        }
}

export type UseTransitionFn = ReturnType<typeof useTransition>