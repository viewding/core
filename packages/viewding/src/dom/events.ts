import {eventHandler} from '../eventHandler'

type EventCallback = (event: Event) => any

declare global {
    export interface Element {
        $on(event: string, callback: EventCallback, modifiers?: string): this
        $onChildren(selector: string, event: string, callback: EventCallback, modifiers?: string): this
        $triger(events:string):void
    }
}

Element.prototype.$on = function(
    this: Element,
    event: string,
    callback: EventCallback,
    modifiers?: string,
){
    const wrappedHandler = (e:Event) => {callback.call(this,e)}
    if(modifiers){
        this.addEventListener(event,eventHandler(wrappedHandler,modifiers))
    }
    else{
        this.addEventListener(event,wrappedHandler)
    }
    return this
}

// && 左边为真时返回右面的值
function matches(ele: any, selector: string): boolean {
    const matches =
        ele &&
        (ele['matches'] ||
            ele['webkitMatchesSelector'] ||
            ele['msMatchesSelector'])

    return !!matches && !!selector && matches.call(ele, selector)
}

Element.prototype.$onChildren = function(
    this: Element,
    selector: string,
    event: string,
    callback: EventCallback,
    modifiers?: string
) {
    const wrappedHandler = (e:Event) => {
        if (!e.target) return;
        if(matches(this,selector)){
            callback.call(this,e);
        }
    }
    return this.$on(event,wrappedHandler,modifiers)
}

Element.prototype.$triger = function (this:any, eventType:string){
    if (typeof eventType === 'string' && typeof this[eventType] === 'function') {
        this[eventType]();
      } else {
        const event =
          typeof eventType === 'string'
            ? new Event(eventType, {bubbles: true})
            : eventType;
        this.dispatchEvent(event);
      }
}
