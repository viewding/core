import {reactive,mount,html} from 'viewding'
import './bsInput.js'
import './bsInputDing.js'

import '../styles.scss'

let state = reactive({
    isDisabled: false,
    isReadonly: false,
    isPlainText: false,
    controlSize: 'default'
})

const template = () => html`
<h1>BootStrap Input CustomElement Demo</h1>
    <h2>by hand made:</h2>
    <div style="width:50%;margin-bottom:12px;">
        <label for="example1" class="form-label">Email address</label>
        <input is='bs-input' ?disabled=${state.isDisabled} ?readonly=${state.isReadonly} ?plain-text= ${state.isPlainText} size-style=${state.controlSize} type="email" placeholder="name@example.com"/>
    </div>

    <h2>by Ding BaseElement:</h2>
    <div style="width:50%;margin-bottom:12px;">
        <label for="example1" class="form-label">Email address</label>
        <input is='bs-input-ding' ?disabled=${state.isDisabled} ?readonly=${state.isReadonly} ?plain-text= ${state.isPlainText} size-style=${state.controlSize} type="email" placeholder="name@example.com"/>
    </div>
    <div>
        <select .value=${state.controlSize} title="选择输入框的尺寸"  @change=${setValueTo('controlSize')}>
            <option value="default">default</option>
            <option value="small">small</option>
            <option value="large">large</option>
        </select>
        <input type="checkbox" title="是否禁用" checked @change=${setCheckedTo('isDisabled')}/> <label>disable</label>
        <input type="checkbox" title="是否只读" checked @change=${setCheckedTo('isReadonly')}/> <label>readonly</label>
        <input type="checkbox" title="显示为常规的文本，隐藏输入框外观"  @change=${setCheckedTo('isPlainText')} /> <label>plain text</label>
    </div>

`
function setCheckedTo(prop:string){
    return (event: Event) => {
        state[prop] = (event.target as HTMLInputElement).checked;
    }
}

function setValueTo(prop:string){
    return (event: Event) => {
        state[prop] = (event.target as HTMLInputElement).value;
    }
}

mount(document.body,template)
