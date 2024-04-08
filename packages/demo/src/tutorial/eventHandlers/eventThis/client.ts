import { mount, html, createRef, ref } from 'viewding';

function onClick (this:object){
    alert("the THIS object is：" + this.toString())
}

const buttonRef = createRef()

function template(){
    return html`<button ${ref(buttonRef)} @click=${onClick}  >CLICK ME...</button>`
}

const hostObj = {
    toString(){
        return "HOST Object"
    }
}

mount("#app1",template)
mount("#app2",template,{host:hostObj})
