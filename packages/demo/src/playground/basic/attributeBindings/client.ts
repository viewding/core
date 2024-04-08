import { reactive, reactiveRef, mount, html, classMap, styleMap, attachCss, css } from 'viewding'

const message = reactiveRef('Hello World!')

const classes = reactive({
    red: true,
})
const styles = reactive({
    color: 'blue',
})

function toggleRed() {
    classes.red = !classes.red
}

function toggleColor() {
    styles.color = styles.color === 'green' ? 'blue' : 'green'
}

function template() {
    return html`
        <p>
            <span title=${message()}>
                Hover your mouse over me for a few seconds to see my dynamically
                bound title!
            </span>
        </p>

        <!--
        除了普通字符串之外，
        class 绑定还特别支持了对象和数组
        -->
        <p class=${classMap(classes)} @click=${toggleRed}>
            This should be red... but click me to toggle it.
        </p>

        <!-- 样式绑定也支持对象和数组 -->
        <p style=${styleMap(styles)} @click=${toggleColor}>
            This should be green, and should toggle between green and blue on
            click.
        </p>
    `
}

attachCss(css`
    .red {
        color: red;
    }
`)

mount("#app", template)
