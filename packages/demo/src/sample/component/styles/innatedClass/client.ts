import {reactive,mount,html,bindValue} from 'viewding/src'
import './bsInput.js'

import "bootstrap/dist/css/bootstrap.css";

let state = reactive({
    isDisabled: false,
    isReadonly: false,
    isPlainText: false,
    controlSize: 'large'
})

const template = () => html`

    <div style="width:50%;margin-bottom:12px;">
        <label for="example1" class="form-label">Email address</label>
        <input is='bs-input' ?disabled=${state.isDisabled} ?readonly=${state.isReadonly} ?plain-text= ${state.isPlainText} size-style=${state.controlSize} type="email" placeholder="name@example.com"/>
    </div>
    <div>
        <select ${bindValue(state,"controlSize")} title="选择输入框的尺寸">
            <option value="default">default</option>
            <option value="small">small</option>
            <option value="large">large</option>
        </select>
        <input type="checkbox" title="是否禁用" checked ${bindValue(state,"isDisabled")} /> <label>disable</label>
        <input type="checkbox" title="是否只读" checked ${bindValue(state,"isReadonly")} /> <label>readonly</label>
        <input type="checkbox" title="显示为常规的文本，隐藏输入框外观" ${bindValue(state,"isPlainText")} /> <label>plain text</label>
    </div>

`

mount("#app",template)
