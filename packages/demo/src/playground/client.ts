import { mount, defineElement, reactiveElement, watch, html, createRef, ref, reactiveRef, attachCss, css } from 'viewding';
import 'playground-elements/playground-ide.js'


@defineElement()
export class DemoList extends reactiveElement() {

    play(demoId : string){
        return ()=> {
            const event = new CustomEvent('play', {bubbles: true, composed: true, detail: {demoId}});
            this.dispatchEvent(event);
        }
    }

    template(){
        return html`
        <ol>
            <li>
                <h3>Basic</h3>
                <ol>
                    <li @click=${this.play("./basic/helloWorld")}>hello world</li>
                    <li @click=${this.play("./basic/handingInput")}>处理输入</li>
                    <li @click=${this.play("./basic/attributeBindings")}>Attribute绑定</li>
                    <li @click=${this.play("./basic/conditionAndLoops")}>分支和重复</li>
                    <li @click=${this.play("./basic/formBindings")}>表单输入</li>
                    <li @click=${this.play("./basic/simpleComponent")}>简单组件</li>
                </ol>
            </li>
            <li>
                <h3>Practice</h3>
                <ol>
                    <li @click=${this.play("./practice/markdown")}>markdown编辑器</li>
                    <li @click=${this.play("./practice/fetchingData")}>查看数据</li>
                    <li @click=${this.play("./practice/grid")}>表格</li>
                    <li @click=${this.play("./practice/tree")}>树状视图</li>
                    <li @click=${this.play("./practice/svg")}>svg 图像</li>
                    <li @click=${this.play("./practice/todoMvc")}>todo mvc</li>
                </ol>
            </li>
            <li>
                <h3>7-Guis</h3>
                <ol>
                    <li @click=${this.play("./7guis/counter")}>计数器</li>
                    <li @click=${this.play("./7guis/temperatureConverter")}>温度转换器</li>
                    <li @click=${this.play("./7guis/flightBooker")}>机票预定</li>
                    <li @click=${this.play("./7guis/timer")}>计时器</li>
                    <li @click=${this.play("./7guis/crud")}>增删改查</li>
                    <li @click=${this.play("./7guis/circleDrawer")}>画圆</li>
                    <li @click=${this.play("./7guis/cells")}>单元格</li>
                </ol>
            </li>
        </ol>`
    }
}

let demoId = reactiveRef("")

function onplay(event) {
    demoId.value = event.detail.demoId + "/project.json"
}

const template = () => html`
<div class="playground--container">
    <demo-list @play=${onplay}></demo-list>    
    <playground-ide
        style = "height: 96vh;padding:0px;"
        project-src=${demoId.value}
        editable-file-system 
        line-numbers 
        resizable >
    </playground-ide>
</div>   
`
attachCss(css`
    div.playground--container{
        display: flex;
    }
    demo-list {
        flex: 0 0 250px;
        border: solid lightgray 1px;
    }
    playground-ide {
        flex: 1 0 auto;
        border: solid lightgray 1px;
    }
`)
mount("#app",template)
