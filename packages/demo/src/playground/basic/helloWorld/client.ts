import { reactiveRef, html, mount } from 'viewding';

const message = reactiveRef('Hello World!')

function template(){
    return html`<h1>${message.value}</h1>`
}

mount("#app", template)
