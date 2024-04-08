/** @format */

import { html, reactiveRef, ReactiveHTMLElement, defineElement } from "viewding"

@defineElement()
class SampleCounter extends ReactiveHTMLElement {
    counter = reactiveRef(0)

    template() {
        return html`
            <button @click=${() => this.counter(this.counter() + 1)}>CLICK Times: ${this.counter()}</button>
        `
    }
}
