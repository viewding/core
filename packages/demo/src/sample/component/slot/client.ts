
import { defineElement, reactiveElement, watch, watchAttr, html, mount, ReactiveHTMLElement } from 'viewding/src';

@defineElement()
export class SlotContainer extends reactiveElement(HTMLElement, {mode:"closed"}) {

    template(){
        return html`
        <style>
            p{
                color:red;
            }

        </style>
        <div>
            <p>paragrap in shadowRoot</p>
            <slot>default slot text</slot>
        </div>`
    }

    static styles() {
        return `
            p{
                color:blue;
            }
        `
    }
}

const template = ()=>html`
		<slot-container>
            <h1>title</h1>
            <p>paragraph text ...</p>
        </slot-container>
`

mount("#app",template)
