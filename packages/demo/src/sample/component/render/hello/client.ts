import { html, defineElement, reactiveElement, watchAttr } from 'viewding'

@defineElement()
export class SayHello extends reactiveElement() {
    @watchAttr() hello = "hello"
    template(){
        return html`<p>${this.hello}, viewding!</p>`
    }
}