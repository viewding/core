import { html, reactiveRef, mount, on } from 'viewding'

const message = reactiveRef('Hello World!')

function reverseMessage() {
    message(message().split('').reverse().join(''))
}


function notify () {
    alert('navigation was prevented.')
}

function template() {
    return html`
        <h1>${message()}</h1>
        <button @click=${reverseMessage}>Reverse Message</button>

        <!-- 也可以写成一个内联表达式语句 -->
        <button @click=${() => message(message() + '!')}>Append "!"</button>

        <!--
            由于使用了once修饰符，第一次点击时显示aler，第二次点击时打开超链接。
        -->
        <a href="https://vuejs.org" @click=${on(notify,'prevent', 'once')}>
            A link with e.preventDefault()
        </a>

        <style>
            button,
            a {
                display: block;
                margin-bottom: 1em;
            }
        </style>
    `
}

mount(document.body, template)
