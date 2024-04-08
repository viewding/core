import {
    ElementPart,
    Directive,
    PartInfo,
    PartType,
    noChange,
    directive,
    DirectiveParameters,
} from "@viewding/lit-html"

import {resolveTransitionHooks, Transition, TransitionElement, TransitionState, UseTransitionFn} from './transition'

class DisplayDirective extends Directive {
    private display!: string
    private state: TransitionState
    private oldCondition: unknown
    private transition!: Transition

    constructor(partInfo: PartInfo) {
        super(partInfo)
        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error("display directive can only be used in elemant")
        }
        this.state = {
            isStarting: true,
            isUnmounting: false,
            leavingNodesCache: {} as Record<string, TransitionElement>
        }
    }

    render(condition: unknown, transition?: UseTransitionFn) {
        return noChange
    }

    update(part: ElementPart, [condition, transition]: DirectiveParameters<this>) {
        const el = part.element as TransitionElement

        if(this.oldCondition === condition) return
        this.oldCondition = condition

        if(!transition){
            if(this.state.isStarting) {
                this.display = el.style.display === 'none' ? '' : el.style.display
            }
            this.setDisplay(el, condition)
            this.state.isStarting = false
            return noChange
        }

        // 仅当有过渡参数时，执行下述代码。

        // 初始挂载
        if (this.state.isStarting){
            this.display = el.style.display === 'none' ? '' : el.style.display
            this.transition = transition.get()
            this.transition.props.persisted = true
            // 把元素添加到transition的过渡元素集合中。
            this.transition.addElement(el)
            el._hooks = resolveTransitionHooks( "display", this.transition.props, this.state)

            if(condition){
                el._hooks.beforeEnter(el)
            }
            this.state.isStarting = false
        }
        else{
            if(condition){
                el._hooks.beforeEnter(el)
                this.setDisplay(el, condition)
            }
            else {
                el._hooks.leave(el, () => {
                    this.setDisplay(el, false)
                })
            }
            this.transition.addElement(el)
        }
        return noChange
    }

    setDisplay(el: HTMLElement, value: unknown): void {
        el.style.display = value ? this.display : 'none'
    }
    
}

export const display = directive(DisplayDirective)
