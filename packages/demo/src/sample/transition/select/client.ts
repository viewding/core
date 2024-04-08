import { html, defineElement, reactiveElement, watchAttr, useTransition, select, bindValue, watch } from 'viewding/src'
import { attachCss, mount } from 'viewding/src/mount'

@defineElement()
export class SayHello extends reactiveElement(HTMLElement) {
    @watch() current ="js"
    books = {
        js: "JavaScript Language",
        go: "GO Language",
        cpp: "C++ Language"
    }

    transition = useTransition(this,{appear:true})

    template(){
        return html`
            <select ${bindValue(this,"current")}>
                <option>js</option>
                <option>go</option>
                <option>cpp</option>
                <option>C#</option>
                <option>Java</option>
            </select>


            ${ select(this.current, [
                ["js", ()=>html`<h1>${this.books.js}</h1>`],
                ["go", ()=>html`<h1>${this.books.go}</h1>`],
                ["cpp", ()=>html`<h1>${this.books.cpp}</h1>`],
            ], this.transition)}
        `
    }
}

attachCss(`
    .v-enter-active,
    .v-leave-active {
        transition: opacity 2s ease;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
    }
`)

const template = () => html`<say-hello></say-hello>`

mount("#app",template)
