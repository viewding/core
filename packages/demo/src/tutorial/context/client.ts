import { html,defineElement,reactive, reactiveElement } from 'viewding'

const contextKey ='context-demo'

window.document.body.addEventListener('context-request', () =>
    console.log('recieve event: context-request')
)
window.document.body.$provide(contextKey,{
    text: 'inject Context DATA is OK!',
})

@defineElement()
export class ContextDemo extends reactiveElement() {
    contextValue = reactive({ value: 'default' }) as any
    constructor(...args) {
        super(args)
        this.onCallback("Connected",()=>{
            this.contextValue.value = this.$inject(contextKey)
        })
        
    }

    template() {
        return html`<h2>Context: ${this.contextValue.value.text}</h2>`
    }
}

window.document.body.addEventListener('click', () =>
    console.log('recieve event: click')
)
