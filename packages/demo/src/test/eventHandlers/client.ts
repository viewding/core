import { mount, html, createRef, ref } from 'viewding';

const one = ()=>{
    alert("ONE Click Handler")
}

const two = ()=>{
    alert("TWO Click Handler")
}

const buttonRef = createRef()


const onAfterRender = ()=>{
    buttonRef.value!.addEventListener("click",two)
    buttonRef.value!.addEventListener("click",one)
}

function template(){
    return html`<button ${ref(buttonRef)} @click=${one}  @click=${two}>CLICK ME...</button>`
}

mount("#app",template, onAfterRender)
