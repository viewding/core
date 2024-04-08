import { mount, html, reactiveRef } from 'viewding';

const counter = reactiveRef(0)
let renderCounter = 0

const onAfterRender = () => {
    renderCounter = renderCounter + 1
    console.log(renderCounter)
}

const onClick = () => {
    counter.value++
    counter.value++
    counter.value++
}

const template = ()=>{
    return html` ${counter.value} <button @click=${onClick} >Count</button>, Render Counter: renderCounter.value`
}

mount("#app",template, onAfterRender)