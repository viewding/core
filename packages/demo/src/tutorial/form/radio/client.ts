import { html, mount, bindValue, reactiveRef } from 'viewding/src';

const picked = reactiveRef('s')

function template(){
    return html`
  
    <h2>Radio</h2>
    <input type="radio" id="one" value="One" name='picked' ${bindValue(picked)}>
    <label for="one">One</label>
    <br>
    <input type="radio" id="two" value="Two" name='picked' ${bindValue(picked)}>
    <label for="two">Two</label>
    <br>
    <span>Picked: ${picked()}</span>

    `
}

mount("#app",template)
