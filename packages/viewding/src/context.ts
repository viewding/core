/** @format */

declare global {
    interface HTMLElementEventMap {
        /**
         * A 'context-request' event can be emitted by any element
         */
        "context-request": ContextRequestEvent<unknown>
    }
    interface HTMLElement {
        $provide<T>(context: string | symbol, contextValue: T): void
        $inject<T>(context: string | symbol): T
    }
}

export class ContextRequestEvent<T> extends Event {
    /**
     *
     * @param context the context key to request
     * @param callback the callback that should be invoked when the context with the specified key is available
     */
    public constructor(public readonly context: string | symbol, readonly callback: (value: T) => void) {
        super("context-request", { bubbles: true, composed: true })
    }
}

export function inject<T>(this: HTMLElement, context: string | symbol) {
    let contextValue: T
    let event = new ContextRequestEvent(context, (value: T) => {
        contextValue = value
    })
    // 和经由浏览器触发，并通过事件循环异步调用事件处理程序的“原生”事件不同，dispatchEvent() 会同步调用事件处理函数。在 dispatchEvent() 返回之前，所有监听该事件的事件处理程序将在代码继续前执行并返回。
    this.dispatchEvent(event)
    return contextValue!
}

export function provide<T>(this: HTMLElement, context: string | symbol, contextValue: T) {
    const onContextRequest = (ev: ContextRequestEvent<T>): void => {
        // Only call the callback if the context matches.
        // Also, in case an element is a consumer AND a provider
        // of the same context, we want to avoid the element to self-register.
        // The check on composedPath (as opposed to ev.target) is to cover cases
        // where the consumer is in the shadowDom of the provider (in which case,
        // event.target === this.host because of event retargeting).
        if (ev.context !== context || ev.composedPath()[0] === this) {
            return
        }
        ev.stopPropagation()
        ev.callback(contextValue)
    }

    this.addEventListener("context-request", onContextRequest)
}

HTMLElement.prototype.$provide = provide
HTMLElement.prototype.$inject = inject
