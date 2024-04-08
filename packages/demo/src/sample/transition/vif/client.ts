import { html, defineElement, reactiveElement, useTransition, watch, vif } from 'viewding/src'
import { attachCss, mount } from 'viewding/src/mount'

@defineElement()
export class DisplayDemo extends reactiveElement(HTMLElement) {
    @watch() show = true

    transition = useTransition(this, {appear:true})

    template(){
        return html`
            <button @click=${()=>{this.show = !this.show}}> Vif Toggle </button>

            ${ vif(this.show,
                ()=>html`<h1> True True Ture Ture</h1>`,
                this.transition
            )}
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
