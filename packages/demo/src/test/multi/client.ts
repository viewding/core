import { defineElement, reactiveElement, watch, watchAttr, html, mount, ReactiveHTMLElement } from 'viewding/src';

@defineElement()
export class CounterButton extends ReactiveHTMLElement {
    @watch() counter = 0

    template(){
        return html` ${this.counter} <button @click=${()=>this.counter++} >Count</button>`
    }
}

@defineElement()
export class ValueButton extends ReactiveHTMLElement {
    @watchAttr() value = 100

    template(){
        return html` ${this.value} <button @click=${()=>this.value++} >Value</button>`
    }
}

const template = ()=>html`
		<counter-button ></counter-button>
		<value-button ></value-button>
`

mount("#app",template)

var a =5