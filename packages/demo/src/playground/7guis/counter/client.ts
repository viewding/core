import { defineElement, reactiveElement, watch, html } from 'viewding';

@defineElement()
export class CounterButton extends reactiveElement() {
    @watch() counter = 0

    template(){
        return html` ${this.counter} <button @click=${()=>this.counter++} >Count</button>`
    }
}
