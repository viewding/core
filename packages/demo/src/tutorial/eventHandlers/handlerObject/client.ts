import { mount, html, createRef, ref } from 'viewding';

const handler = {
    toString(){
        return "HANDLER OBJECT Demo, this event only fires once."
    },
    handleEvent (this:object){
        alert("the THIS object  is：" + this.toString())
    },
    once: true
}

function template(){
    return html`<button @click=${handler}  >CLICK ME...</button>`
}

mount("#app",template)
