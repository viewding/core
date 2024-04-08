import {html, reactiveElement,defineElement,watchAttr} from "viewding/src"

@defineElement('greeting-message')
export class GreetingMessage extends reactiveElement(HTMLElement){
    @watchAttr() text = 'View Ding'

    template(){
        return html`
                ${ this.templateContent( "default", (a)=>{ return html`
                    Hello: ${a}!
                `}, this.text) }
        `
    }
}

@defineElement()
export class ParentComponent extends reactiveElement() {
    @watchAttr() hello = '你好'

    template(){
        const t = html`
            Defalut Template:<greeting-message></greeting-message>
            <br>
            Parameter Template:<greeting-message text="视钉">
                <template slot='default' is='parameter-template' .render=${(a)=>html`
                    ${this.hello}, ${a}!
                `}></template>
                
            </greeting-message>
        `
        return t
    }
}
