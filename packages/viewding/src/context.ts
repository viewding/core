/** @format */

declare global {
    interface HTMLElementEventMap {
        /**
         * A 'context-request' event can be emitted by any element
         */
        "context-request": ContextRequestEvent;
    }
    interface HTMLElement {
        $provide(context: string | symbol, contextValue: unknown): void;
        $inject(context: string | symbol): unknown;
    }
}

export class ContextRequestEvent extends Event {
    /**
     *
     * @param context the context key to request
     * @param callback the callback that should be invoked when the context with the specified key is available
     */
    public constructor(
        public readonly context: string | symbol,
        readonly callback: (value: unknown) => void
    ) {
        super("context-request", { bubbles: true, composed: true });
    }
}

export function inject(this: HTMLElement, context: string | symbol) {
    let contextValue: unknown;
    let event = new ContextRequestEvent(context, (value) => {
        contextValue = value;
    });
    this.dispatchEvent(event);
    return contextValue;
}

export function provide(
    this: HTMLElement,
    context: string | symbol,
    contextValue: unknown
) {
    const onContextRequest = (ev: ContextRequestEvent): void => {
        // Only call the callback if the context matches.
        // Also, in case an element is a consumer AND a provider
        // of the same context, we want to avoid the element to self-register.
        // The check on composedPath (as opposed to ev.target) is to cover cases
        // where the consumer is in the shadowDom of the provider (in which case,
        // event.target === this.host because of event retargeting).
        if (ev.context !== context || ev.composedPath()[0] === this) {
            return;
        }
        ev.stopPropagation();
        ev.callback(contextValue);
    };

    this.addEventListener("context-request", onContextRequest);
}

HTMLElement.prototype.$provide = provide;
HTMLElement.prototype.$inject = inject;
