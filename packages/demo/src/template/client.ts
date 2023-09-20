import {html, reactiveElement,defineElement,watch} from "viewding"
import {} from "./greetingMessage"

@defineElement()
export class ParentComponent extends reactiveElement() {
    @watch() hello = '你好'

    template(){
        const t = html`
            Defalut Template:<greeting-message></greeting-message>
            <br>
            Parameter Template:<greeting-message>
                <template name='default' is='parameter-template' .render=${(a)=>html`
                    ${this.hello}, ${a}
                `}
                ></template>
            </greeting-message>
        `
        return t
    }
}
