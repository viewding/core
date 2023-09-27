import { html, reactiveElement, renderTemplate, defineElement,watch } from "viewding";

@defineElement('greeting-message')
export class GreetingMessage extends reactiveElement(HTMLElement){
    @watch() text = 'View Ding'

    template(){
        return html`
                ${ renderTemplate( "default", (a)=>{ return html`
                    Defalult Hello: ${a}
                `}, this.text) }
        `
    }
}
