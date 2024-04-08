/** @format */

import { html, mount, createRef, ref } from "viewding/src"

const inputRef = createRef<HTMLInputElement>()
function template() {
    return html`
        Name: <input ${ref(inputRef)} value="input name ..." />
    `
}

function afterRender() {
    if (inputRef.value) inputRef.value.focus()
}
mount("#app", template, { afterRender })
