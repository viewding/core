import { render, TemplateResult } from "@viewding/lit-html";
import { ReactiveEffect} from '@viewding/reactivity'

export function mount(
    element: string | HTMLElement,
    template: () => TemplateResult,
    afterRender?: (isfirst: boolean) => void,
    beforeRender?: (isfirst: boolean) => boolean
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
        if (beforeRender && !beforeRender(isFirst)) {
            return;
        }
        render(template(), container!);
        afterRender?.(isFirst);
        isFirst = false;
    });
}


export function asyncEffect(fn: (...args:any[])=>void){
    // 挂起，指微任务已经加入到js的任务队列，但是尚未运行。
    let isUpdatePending = false
    function scheduler() {
        // 如果有挂起的任务，那么直接返回，等待挂起任务的执行时一并运行更新。
        if (isUpdatePending ) return

        // 如果没有挂起的任务，那么添加更新任务到执行队列。
        window.queueMicrotask(()=>{
            // 更新任务一旦开始运行，状态就不再是挂起了，那么后续的更新就要启动新的更新任务。
            isUpdatePending = false
            fn()
        })
        // 添加任务到队列到任务尚未执行这段时间的状态是挂起。
        isUpdatePending = true
    }
    const effect = new ReactiveEffect(fn, scheduler)
    effect.run()
}
