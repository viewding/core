import { html, mount,reactive,value, check, radio, reactiveRef } from 'viewding';

const text = reactiveRef('Edit...')
const checked = reactiveRef(true)
const checkedNames =reactive(['John'])
const picked = reactiveRef('Two')
const selected = reactiveRef('A')
const multiSelected = reactiveRef(['B'])

function template(){
    return html`
    <h2>Text Input</h2>
    <input .value=${value(text)}> TEXT: ${text()}
    <textarea .value=${value(text)}></textarea> TEXT: ${text()}

    <h2>Checkbox</h2>
    <input type="checkbox" id="checkbox" .checked=${value(checked)}>
    <label for="checkbox">Checked: ${checked()}</label>
  
    <!--
      多个复选框可以绑定到数组
    -->
    <h2>Multi Checkbox</h2>
    <input type="checkbox" id="jack" value="Jack" .checked=${check(checkedNames)}>
    <label for="jack">Jack</label>
    <input type="checkbox" id="john" value="John" .checked=${check(checkedNames)}>
    <label for="john">John</label>
    <input type="checkbox" id="mike" value="Mike" .checked=${check(checkedNames)}>
    <label for="mike">Mike</label>
    <p>Checked names: <pre>${checkedNames.join(',')}</pre></p>
  
    <h2>Radio</h2>
    <input type="radio" id="one" value="One" name='picked' .checked=${radio(picked)}>
    <label for="one">One</label>
    <br>
    <input type="radio" id="two" value="Two" name='picked' .checked=${radio(picked)}>
    <label for="two">Two</label>
    <br>
    <span>Picked: ${picked()}</span>

    <h2>Select</h2>
    <select .value=${value(selected)}>
      <option disabled value="">Please select one</option>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <span>Selected: ${selected()}</span>
  
    <h2>Multi Select</h2>
    <select .$values = ${value(multiSelected)} multiple style="width:100px">
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <span>Selected: ${multiSelected()!.join(', ') }</span>
    `
}

mount("#app",template)
