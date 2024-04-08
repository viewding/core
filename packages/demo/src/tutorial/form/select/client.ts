import { html, mount, bindValue, reactive, reactiveRef } from 'viewding/src';

const selected = reactiveRef('B')
const multiSelected = reactiveRef(['B'])
const arrayValues = reactive(['B'])

function template(){
    return html`

    <h2>Select</h2>
    <select ${bindValue(selected)}>
      <option disabled value="">Please select one</option>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <span>Selected: ${selected()}</span>
  
    <h2>Multi Select</h2>
    <select ${bindValue(multiSelected)} multiple style="width:100px">
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <span>Selected: ${multiSelected()!.join(', ') }</span>
  
    <h2>Multi Select, direct binding to array</h2>
    <select ${bindValue(arrayValues)} multiple style="width:100px">
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <span>Selected: ${arrayValues.join(', ') }</span>
    `
}

mount("#app",template)
