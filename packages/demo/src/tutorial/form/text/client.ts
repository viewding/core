import { html, mount,reactive,bindValue, reactiveRef, bindChangeEvent } from 'viewding/src';

bindChangeEvent()
const text = reactiveRef('Input Ref Text ...')
const data = reactive({
  text: "Input Data Text ..."
})

function template(){
    return html`
    <h2>Text Input Binding to reactiveRef value</h2>
    <input ${bindValue(text)}> TEXT: ${text()}
    <textarea ${bindValue(text)}></textarea> TEXT: ${text()}

    <h2>Text Input Binding to reactive property</h2>
    <input ${bindValue(data, "text")}> TEXT: ${data.text}
    <textarea ${bindValue(data, "text")}></textarea> TEXT: ${data.text}
    `
}

mount("#app",template)
