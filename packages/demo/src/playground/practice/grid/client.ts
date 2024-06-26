import { html, mount, reactiveRef, value } from 'viewding'
import './demoGrid.js'

const searchQuery = reactiveRef('')
const gridColumns = ['name', 'power']
const gridData = [
    { name: 'Chuck Norris', power: Infinity },
    { name: 'Bruce Lee', power: 9000 },
    { name: 'Jackie Chan', power: 7000 },
    { name: 'Jet Li', power: 8000 },
]

function template() {
    return html`
        <form id="search">
            Search <input name="query" .value=${value(searchQuery)} />
        </form>
        <demo-grid
            .data=${gridData}
            .columns=${gridColumns}
            .filterKey=${searchQuery()}
        >
        </demo-grid>
    `
}

mount("#app", template)
