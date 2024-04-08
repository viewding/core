import { html, defineElement, reactiveElement, watchAttr, useTransition, select, bindValue, watch } from 'viewding/src'
import { attachCss, mount } from 'viewding/src/mount'

@defineElement()
export class SayHello extends reactiveElement(HTMLElement) {
    @watch() current ="Edit"
    transition = useTransition(this,{name:"slide-up"})

    template(){
        return html`
        <span style="margin-right: 20px">Click to cycle through states:</span>
        <div class="btn-container">
            ${ select(this.current, [
                ["Edit", ()=>html`<button @click=${()=>this.current="Save"}>Edit</button>`],
                ["Save", ()=>html`<button @click=${()=>this.current="Cancel"}>Save</button>`],
                ["Cancel", ()=>html`<button @click=${()=>this.current="Edit"}>Cancel</button>`],
            ], this.transition)}
        </div>
        `
    }
}

attachCss(`
.btn-container {
    display: inline-block;
    position: relative;
    height: 1em;
  }
  
  button {
    position: absolute;
  }
  
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 2s ease-out;
  }
  
  .slide-up-enter-from {
    opacity: 0;
    transform: translateY(30px);
  }
  
  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(-30px);
  }`)

const template = () => html`<say-hello></say-hello>`

mount("#app",template)
