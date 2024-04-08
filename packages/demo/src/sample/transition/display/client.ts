import { html, defineElement, reactiveElement, watchAttr, useTransition, select, bindValue, watch, display } from 'viewding/src'
import { attachCss, mount } from 'viewding/src/mount'

@defineElement()
export class DisplayDemo extends reactiveElement(HTMLElement) {
    @watch() show = true

    transition = useTransition(this)

    template(){
        return html`
            <button @click=${()=>{this.show = !this.show}}> Display Toggle </button>

            <h1 ${display(this.show, this.transition)} > Display Demo</h1>
        `
    }
}

attachCss(`
    .v-enter-active,
    .v-leave-active {
        transition: opacity 3s ease;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
    }
`)

const template = () => html`<display-demo></display-demo>`

mount("#app",template)
