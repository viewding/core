import { render, TemplateResult, RootPart } from "@viewding/lit-html";
import { ReactiveEffect, effect, ReactiveEffectRunner} from '@viewding/reactivity'

export type MountOptions  = {
    host?:object,
    creationScope?: {importNode: (node: Node, deep?: boolean) => Node},
    isConnected?: boolean,
    renderBefore?: ChildNode | null;
    afterRender?: (rootPart: RootPart, isfirst: boolean) => void,
    beforeRender?: (isfirst: boolean) => boolean
}

// mount 是对lit-html的render的扩展，添加了响应式渲染的能力。
export function mount(
    element: string | HTMLElement,
    template: () => TemplateResult,
    options?: MountOptions
) {
    let container = null as HTMLElement | null
    if(typeof element=="string"){
        const selector =element.trim() 
        if( selector.startsWith("#")){
            container = document.getElementById(selector.substring(1))
        }
        if(!container){
            container = document.querySelector(selector)!
        } 
        
    }
    else container = element

    if(!container) return  // container maybe null

    let isFirst = true;

    asyncEffect(() => {
        if (options?.beforeRender && !options?.beforeRender(isFirst)) {
            return;
        }
        const rootPart = render(template(), container!,{
            host:   options?.host,
            creationScope:  options?.creationScope,
            isConnected:    options?.isConnected,
            renderBefore: options?.renderBefore
        });
        options?.afterRender?.(rootPart, isFirst);
        isFirst = false;
    });
}

export function asyncEffect(fn: (...args:any[])=>void){
    // 挂起，指微任务已经加入到js的任务队列，但是尚未运行。
    const effect = new ReactiveEffect(fn)
    let isUpdatePending = false
    function scheduler() {
        // 如果有挂起的任务，那么直接返回，等待挂起任务的执行时一并运行更新。
        if (isUpdatePending ) return

        // 如果没有挂起的任务，那么添加更新任务到执行队列。
        window.queueMicrotask(()=>{
            // 更新任务一旦开始运行，状态就不再是挂起了，那么后续的更新就要启动新的更新任务。
            isUpdatePending = false
            effect.run()
        })
        // 添加任务到队列到任务尚未执行这段时间的状态是挂起。
        isUpdatePending = true
    }
    //const effect = new ReactiveEffect(scheduler)
    effect.scheduler = scheduler
    effect.run()
}

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
    String.raw({ raw: strings }, ...values)

export function attachCss(styles: string) {
    document.head.insertAdjacentHTML(
        "beforeend",
        `<style>${styles}</style>`
    );
}
