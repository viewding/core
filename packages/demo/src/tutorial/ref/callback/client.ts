/** @format */

import { html, mount, ref } from "viewding/src"

const itemRef = [] as Element[]
function getItemRef(element?: Element) {
    if (element) itemRef.push(element)
}
function template() {
    return html`
        <ul>
            ${["aaa", "bbb", "ccc"].map(
              (item) => html` <li ${ref(getItemRef)}>${item}</li> `
            )}
            <li ${ref(getItemRef)}>other item...</li> 
            <li ${ref(getItemRef)}>other item...</li> 
        </ul>
        <button @click=${onClick}> Show list length</button>
    `
}

function onClick() {
    alert( "List lenth is: " + itemRef.length.toString())
}
mount("#app", template)
