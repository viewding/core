import { mount, reactiveRef } from 'viewding';
import {html} from '@viewding/lit-html'

const counter = reactiveRef(0)

function template(){
    return html`<button @click=${()=>counter.value = counter.value + 1} >CLICK Times: ${counter.value}</button>`
}

mount("#app",template)
