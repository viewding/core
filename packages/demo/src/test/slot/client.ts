
import { defineElement, reactiveElement, watch, watchAttr, html, mount, ReactiveHTMLElement } from 'viewding/src';

@defineElement()
export class MyContainer extends ReactiveHTMLElement {

    template(){
        return html`<div>
        <p class="inner">paragrap in shadowRoot</p>
        <slot>default slot text</slot>
        </div>`
    }
    static styles() {
        return `
            div {
                & p{
                    color:blue;
                }
            }
        `
    }
}

@defineElement()
export class SlotContainer extends reactiveElement(HTMLElement, {mode:"closed"}) {

    template(){
        return html`
            <p class="inner">paragrap in shadowRoot</p>
        <div>
            <p class="inner">paragrap in shadowRoot</p>
            <slot>default slot text</slot>
        </div>`
    }

    static styles() {
        return `
            p.inner{
                color:red;
            }
        `
    }
}

// @defineElement()
// export class ValueButton extends ReactiveHTMLElement {
//     @watchAttr() value = 100

//     template(){
//         return html` ${this.value} <button @click=${()=>this.value++} >Value</button>`
//     }
// }

const template = ()=>html`
<style>
    p{
        color:green;
    }
</style>
		<my-container>
            <h1>title</h1>
            <p>paragraph text ...</p>
        </my-container>
		<slot-container>
            <h1>title</h1>
            <p>paragraph text ...</p>
        </slot-container>
`

mount("#app",template)

var a =5