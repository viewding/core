/**
 * @format
 * @license Copyright 2017 Google LLC SPDX-License-Identifier: BSD-3-Clause
 */

import { ChildPart, DirectiveParameters, noChange } from "@viewding/lit-html"
import { directive, Directive, PartInfo, PartType } from "@viewding/lit-html"
import {
    insertPart,
    getCommittedValue,
    removePart,
    setCommittedValue,
    setChildPartValue,
} from "@viewding/lit-html"
import {
    addTransitionClass,
    forceReflow,
    getTransitionInfo,
    removeTransitionClass,
    resolveTransitionHooks,
    Transition,
    TransitionElement,
    TransitionProps,
    TransitionState,
    UseTransitionFn,
} from "./transition"

export type KeyFn<T> = (item: T, index: number) => unknown
export type ItemTemplate<T> = (item: T, index: number) => unknown

function handleElementInPart(part: ChildPart, func: (el: TransitionElement) => void) {
    const el = part.startNode?.nextSibling as TransitionElement
    if (el && (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE)) {
        return func(el)
    }
}

function getElementInPart(part: ChildPart) {
    const el = part.startNode?.nextSibling as TransitionElement
    if (el && el.nodeType === Node.ELEMENT_NODE) {
        return el
    }
}

// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list: unknown[], start: number, end: number) => {
    const map = new Map<unknown, number>()
    for (let i = start; i <= end; i++) {
        map.set(list[i], i)
    }
    return map
}

function callPendingCbs(part: ChildPart) {
    handleElementInPart(part, (el) => {
        if (el._moveCb) {
            el._moveCb()
        }
        if (el._enterCb) {
            el._enterCb()
        }
    })
}

function hasCSSTransform(el: TransitionElement, root: Node, moveClass: string): boolean {
    // Detect whether an element with the move class applied has
    // CSS transitions. Since the element may be inside an entering
    // transition at this very moment, we make a clone of it and remove
    // all other transition classes applied to ensure only the move class
    // is applied.
    const clone = el.cloneNode() as HTMLElement
    if (el._vtc) {
        el._vtc.forEach((cls) => {
            cls.split(/\s+/).forEach((c) => c && clone.classList.remove(c))
        })
    }
    moveClass.split(/\s+/).forEach((c) => c && clone.classList.add(c))
    clone.style.display = "none"
    const container = (root.nodeType === Node.ELEMENT_NODE ? root : root.parentNode) as HTMLElement
    container.appendChild(clone)
    const { hasTransform } = getTransitionInfo(clone)
    container.removeChild(clone)
    return hasTransform
}

class ListDirective extends Directive {
    private _itemKeys?: unknown[]
    private transition!: Transition
    private state: TransitionState

    positionMap = new Map<HTMLElement, DOMRect>()
    newPositionMap = new Map<HTMLElement, DOMRect>()
    
    #prevPartList: ChildPart[] = []
    #partList: ChildPart[] = []

    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.CHILD) {
            throw new Error("list() can only be used in text expressions")
        }
        this.state = {
            isStarting: true,
            isUnmounting: false,
        }
    }

    private _getValuesAndKeys<T>(items: Iterable<T>, keyFn: KeyFn<T>, template: ItemTemplate<T>) {
        const keys = [] as unknown[]
        const values = [] as unknown[]
        let index = 0
        for (const item of items) {
            keys[index] = keyFn ? keyFn(item, index) : index
            values[index] = template!(item, index)
            index++
        }
        return {
            values,
            keys,
        }
    }

    render<T>(
        items: Iterable<T>,
        keyFn: KeyFn<T>,
        template: ItemTemplate<T>,
        useTransition?: UseTransitionFn
    ) {
        return this._getValuesAndKeys(items, keyFn, template).values
    }

    removeOld(oldPart: ChildPart, itemKey: string) {
        if (!this.transition) return
        handleElementInPart(oldPart, (el) => {
            const leavingHooks = resolveTransitionHooks(itemKey, this.transition.props, this.state)
            el._hooks = leavingHooks
            const remove = () => {
                removePart(oldPart)
            }
            // 对将要移除的元素执行leave钩子, 根据过渡模式执行可选的afterLeave钩子。
            el._hooks.leave(el, remove)
        })
    }

    insertNew(newPart: ChildPart, itemKey: string) {
        if (!this.transition) return
        handleElementInPart(newPart, (el) => {
            el = el as TransitionElement
            this.transition.addElement(el)
            var enterHooks = resolveTransitionHooks(itemKey, this.transition.props, this.state)
            el._hooks = enterHooks
            el._hooks.beforeEnter(el)
        })
    }
    recordPosition(part: ChildPart) {
        handleElementInPart(part, (el) => {
            this.newPositionMap.set(el, el.getBoundingClientRect())
        })
    }
    
    applyTranslation(part: ChildPart) {
        const el = getElementInPart(part)
        if(el) {
            const oldPos = this.positionMap.get(el)!
            const newPos = this.newPositionMap.get(el)!
            const dx = oldPos.left - newPos.left
            const dy = oldPos.top - newPos.top
            if (dx || dy) {
                const s = el.style
                s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`
                s.transitionDuration = "0s"
                return el
            }
        }
    }
    
    
    override update<T>(containerPart, [items, keyFn, template, useTransition]: DirectiveParameters<this>) {
        if (useTransition) this.transition = useTransition.get()

        // Old part & key lists are retrieved from the last update (which may
        // be primed by hydration)
        const prev = getCommittedValue(containerPart) as Array<ChildPart | null>
        const oldParts = Array.isArray(prev) ? prev : []

        // In SSR hydration it's possible for oldParts to be an array but for us
        // to not have item keys because the update() hasn't run yet. We set the
        // keys to an empty array. This will cause all oldKey/newKey comparisons
        // to fail and execution to fall to the last nested brach below which
        // reuses the oldPart.
        const oldKeys = (this._itemKeys ??= [])

        const { values: newValues, keys: newKeys } = this._getValuesAndKeys(items, keyFn, template)

        this.#prevPartList = [...this.#partList]
        this.positionMap = new Map<HTMLElement, DOMRect>()
        for (let i = 0; i < this.#prevPartList.length; i++) {
            const part = this.#prevPartList[i]
            handleElementInPart(part, (el) => {
                // this.transition.addElement(el)
                this.positionMap.set(el, el.getBoundingClientRect())
            })
        }

        // New part list will be built up as we go (either reused from
        // old parts or created for new keys in this update). This is
        // saved in the above cache at the end of the update.
        const newParts: ChildPart[] = []

        // Maps from key to index for current and previous update; these
        // are generated lazily only when needed as a performance
        // optimization, since they are only required for multiple
        // non-contiguous changes in the list, which are less common.
        let newKeyToIndexMap!: Map<unknown, number>
        let oldKeyToIndexMap!: Map<unknown, number>

        // Head and tail pointers to old parts and new values
        let oldHead = 0
        let oldTail = oldParts.length - 1
        let newHead = 0
        let newTail = newValues.length - 1

        while (oldHead <= oldTail && newHead <= newTail) {
            if (oldParts[oldHead] === null) {
                // `null` means old part at head has already been used
                // below; skip
                oldHead++
            } else if (oldParts[oldTail] === null) {
                // `null` means old part at tail has already been used
                // below; skip
                oldTail--
            } else if (oldKeys[oldHead] === newKeys[newHead]) {
                // Old head matches new head; update in place
                newParts[newHead] = setChildPartValue(oldParts[oldHead]!, newValues[newHead])
                oldHead++
                newHead++
            } else if (oldKeys[oldTail] === newKeys[newTail]) {
                // Old tail matches new tail; update in place
                newParts[newTail] = setChildPartValue(oldParts[oldTail]!, newValues[newTail])
                oldTail--
                newTail--
            } else if (oldKeys[oldHead] === newKeys[newTail]) {
                // Old head matches new tail; update and move to new tail
                newParts[newTail] = setChildPartValue(oldParts[oldHead]!, newValues[newTail])
                insertPart(containerPart, newParts[newTail + 1], oldParts[oldHead]!)
                this.insertNew(oldParts[oldHead]!, oldKeys[oldHead] as string)
                oldHead++
                newTail--
            } else if (oldKeys[oldTail] === newKeys[newHead]) {
                // Old tail matches new head; update and move to new head
                newParts[newHead] = setChildPartValue(oldParts[oldTail]!, newValues[newHead])
                insertPart(containerPart, oldParts[oldHead]!, oldParts[oldTail]!)
                this.insertNew(oldParts[oldTail]!, oldKeys[oldTail] as string)
                oldTail--
                newHead++
            } else {
                if (newKeyToIndexMap === undefined) {
                    // Lazily generate key-to-index maps, used for removals &
                    // moves below
                    newKeyToIndexMap = generateMap(newKeys, newHead, newTail)
                    oldKeyToIndexMap = generateMap(oldKeys, oldHead, oldTail)
                }
                if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
                    // Old head is no longer in new list; remove
                    //removePart(oldParts[oldHead]!)
                    this.removeOld(oldParts[oldHead]!, oldKeys[oldHead] as string)
                    oldHead++
                } else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
                    // Old tail is no longer in new list; remove
                    //removePart(oldParts[oldTail]!)
                    this.removeOld(oldParts[oldTail]!, oldKeys[oldTail] as string)
                    oldTail--
                } else {
                    // Any mismatches at this point are due to additions or
                    // moves; see if we have an old part we can reuse and move
                    // into place
                    const oldIndex = oldKeyToIndexMap.get(newKeys[newHead])
                    const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null
                    if (oldPart === null) {
                        // No old part for this value; create a new one and
                        // insert it
                        const newPart = insertPart(containerPart, oldParts[oldHead]!)
                        setChildPartValue(newPart, newValues[newHead])
                        this.insertNew(newPart, newKeys[newHead] as string)
                        newParts[newHead] = newPart
                    } else {
                        // Reuse old part
                        newParts[newHead] = setChildPartValue(oldPart, newValues[newHead])
                        insertPart(containerPart, oldParts[oldHead]!, oldPart)
                        this.insertNew(oldPart, newKeys[newHead] as string)
                        // This marks the old part as having been used, so that
                        // it will be skipped in the first two checks above
                        oldParts[oldIndex as number] = null
                    }
                    newHead++
                }
            }
        }
        // Add parts for any remaining new values
        while (newHead <= newTail) {
            // For all remaining additions, we insert before last new
            // tail, since old pointers are no longer valid
            const newPart = insertPart(containerPart, newParts[newTail + 1])
            setChildPartValue(newPart, newValues[newHead])
            this.insertNew(newPart, newKeys[newHead] as string)
            newParts[newHead++] = newPart
        }
        // Remove any remaining unused old parts
        while (oldHead <= oldTail) {
            const oldPart = oldParts[oldHead++]
            //removePart(oldPart!)
            if (oldPart !== null) {
                this.removeOld(oldPart, oldKeys[oldHead] as string)
            }
        }

        // Save order of new parts for next round
        this._itemKeys = newKeys
        // Directly set part value, bypassing it's dirty-checking
        setCommittedValue(containerPart, newParts)

        this.#partList = newParts

        // 如果是初次渲染，不需要平滑移动元素，因此结束update()直接返回。
        if (!this.#prevPartList.length) return noChange

        const moveClass = this.transition.props.moveClass || `${this.transition.props.name || "v"}-move`

        const testEl = getElementInPart(this.#prevPartList[0])
        if (!testEl) return
        if (!hasCSSTransform(testEl, this.#prevPartList[0].parentNode, moveClass)) {
            return
        }

        this.transition.mountHost.onCallback("AfterRender", () =>{
            // we divide the work into three loops to avoid mixing DOM reads and writes
            // in each iteration - which helps prevent layout thrashing.
            this.#prevPartList.forEach(callPendingCbs)
            this.newPositionMap = new Map<HTMLElement, DOMRect>()
            this.#prevPartList.forEach(this.recordPosition.bind(this))
            const movedChildren = this.#prevPartList.filter(this.applyTranslation.bind(this))

            // force reflow to put everything in position
            forceReflow()

            movedChildren.forEach((c) => {
                handleElementInPart(c, (el) => {
                    const style = el.style
                    addTransitionClass(el, moveClass)
                    style.transform = style.webkitTransform = style.transitionDuration = ""
                    const cb = ((el as any)._moveCb = (e: TransitionEvent) => {
                        if (e && e.target !== el) {
                            return
                        }
                        if (!e || /transform$/.test(e.propertyName)) {
                            el.removeEventListener("transitionend", cb)
                            ;(el as any)._moveCb = null
                            removeTransitionClass(el, moveClass)
                        }
                    })
                    el.addEventListener("transitionend", cb)
                })
            })
        })

        //setTimeout(moveUpdate, 1000)
        return noChange
    }
}

export interface ListDirectiveFn {
    <T>(
        items: Iterable<T>,
        keyFn: KeyFn<T> | ItemTemplate<T>,
        template: ItemTemplate<T>,
        useTransition?: UseTransitionFn
    ): unknown
}

export const list = directive(ListDirective) as ListDirectiveFn

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { ListDirective }
