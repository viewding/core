import html, * as vd  from "viewding/src"

const contextKey ='context-demo'

window.document.body.addEventListener('context-request', () =>
    console.log('recieve event: context-request')
)
window.document.body.$provide(contextKey,{
    text: 'inject Context DATA is OK!',
})

@vd.defineElement()
export class ContextDemo extends vd.ReactiveHTMLElement {
    contextValue = vd.reactive({ value: 'default' }) as any
    // constructor(...args) {
    //     super(args)
    //     this.onCallback("Connected",()=>{
    //         this.contextValue.value = this.$inject(contextKey)
    //     })
        
    // }
    // connectedCallback(): void {
    //     this.contextValue.value = this.$inject(contextKey)
    //     super.connectedCallback()
    // }
    init(){
        this.contextValue.value = this.$inject(contextKey)
    }

    template() {
        return html`<h2>Context: ${this.contextValue.value.text}</h2>`
    }
}

window.document.body.addEventListener('click', () =>
    console.log('recieve event: click')
)
