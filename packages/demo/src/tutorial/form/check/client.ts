import { html, mount,reactive,bindValue, reactiveRef } from 'viewding/src';

const checked = reactiveRef(true)
const checkedNames =reactive(['John'])

function template(){
    return html`
    <h2>Checkbox</h2>
    <input type="checkbox" id="checkbox" ${bindValue(checked)}>
    <label for="checkbox">Checked: ${checked()}</label>
  
    <!--
      多个复选框可以绑定到数组
    -->
    <h2>Multi Checkbox</h2>
    <input type="checkbox" id="jack" value="Jack" ${bindValue(checkedNames)}>
    <label for="jack">Jack</label>
    <input type="checkbox" id="john" value="John" ${bindValue(checkedNames)}>
    <label for="john">John</label>
    <input type="checkbox" id="mike" value="Mike" ${bindValue(checkedNames)}>
    <label for="mike">Mike</label>
    <p> Checked names: <pre> ${checkedNames.join(',')}</pre> </p>
  
    `
}

mount("#app",template)
