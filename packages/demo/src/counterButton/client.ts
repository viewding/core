import { defineElement, reactiveElement, watch } from 'viewding';
import {html } from 'lit-html'

@defineElement()
export class CounterButton extends reactiveElement() {
    @watch() counter = 5

    private clickHandler(){
        this.counter++
        this.counter++
    }

    template(){
        return html`<button @click=${this.clickHandler} >CLICK Times: ${this.counter}</button>`
    }
}
