import { html,mount, reactiveRef, value, attachCss, css, reactive } from 'viewding'

import { polyGraph } from './polyGraph.js'

const newLabel = reactiveRef('')
const stats = reactive([
    { label: 'A', value: 100 },
    { label: 'B', value: 100 },
    { label: 'C', value: 100 },
    { label: 'D', value: 100 },
    { label: 'E', value: 100 },
    { label: 'F', value: 100 },
])

function add(e) {
    e.preventDefault()
    if (!newLabel()) return
    stats.push({
        label: newLabel(),
        value: 100,
    })
    newLabel('')
}

function remove(stat) {
    if (stats.length > 3) {
        stats.splice(stats.indexOf(stat), 1)
    } else {
        alert("Can't delete more!")
    }
}

function template() {
    return html`
        <svg width="200" height="200">${polyGraph(stats)}</svg>

        <!-- 控件 -->
        ${stats.map(
            (stat) =>html`
                <div>
                    <label>${stat.label}</label>
                    <input
                        type="range"
                        .value=${value([stat,"value"])}
                        min="0"
                        max="100"
                    />
                    <span>${stat.value}</span>
                    <button @click=${() => remove(stat)} class="remove">
                        X
                    </button>
                </div>
            `
        )}

        <form id="add">
            <input name="newlabel" .value=${value(newLabel)} />
            <button @click=${add}>Add a Stat</button>
        </form>

    `
}

attachCss(css`
    polygon {
        fill: #42b983;
        opacity: 0.75;
    }

    circle {
        fill: transparent;
        stroke: #999;
    }

    text {
        font-size: 10px;
        fill: #666;
    }

    label {
        display: inline-block;
        margin-left: 10px;
        width: 20px;
    }

    #raw {
        position: absolute;
        top: 0;
        left: 300px;
    }
`)

mount("#app", template)
