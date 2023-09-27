import { html,reactive, classMap, defineElement,reactiveElement,watch, attachCss, css} from 'viewding';

@defineElement()
export class DemoGrid extends reactiveElement(HTMLElement) {
    @watch() filterKey = ''
    @watch() sortKey = ''
    @watch() data = []
    @watch() columns = []
    sortOrders = reactive({}) // 1 正序， -1 倒序

    connectedCallback(){
        this.columns.reduce((o, key) => (((o[key] as unknown as number) = 1), o), this.sortOrders)
        super.connectedCallback()
    }

    // todo：装饰器 @computed
    get filteredData() {
        let { data, filterKey } = this
        if (filterKey) {
            filterKey = filterKey.toLowerCase()
            data = data.filter((row) => {
                return Object.keys(row).some((key) => {
                    return (
                        String(row[key]).toLowerCase().indexOf(filterKey) > -1
                    )
                })
            })
        }
        const key = this.sortKey
        if (key) {
            const order = this.sortOrders[key]
            data = data.slice().sort((a, b) => {
                a = a[key]
                b = b[key]
                return (a === b ? 0 : a > b ? 1 : -1) * order
            })
        }
        return data
    }

    sortBy(key: string) {
        this.sortKey=key
        this.sortOrders[key] *= -1
    }

    capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    template() {
        if (this.filteredData.length == 0) {
            return html`<p>No matches found.</p>`
        }
        return html`
            <table>
                <thead>
                    <tr>
                        ${this.columns.map(
                            (key) => html`
                                <th
                                    @click=${() => this.sortBy(key)}
                                    class=${classMap({
                                        active: this.sortKey == key,
                                    })}
                                >
                                    ${this.capitalize(key)}
                                    <span
                                        class="arrow ${this.sortOrders[key] >
                                        0
                                            ? 'asc'
                                            : 'dsc'}"
                                    >
                                    </span>
                                </th>
                            `
                        )}
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredData.map(
                        (entry) => html`
                            <tr>
                                ${this.columns.map(
                                    (key) => html`
                                        <td v-for="key in columns">
                                            ${entry[key]}
                                        </td>
                                    `
                                )}
                            </tr>
                        `
                    )}
                </tbody>
            </table>

        `
    }
}

attachCss(css`
    table {
        border: 2px solid #42b983;
        border-radius: 3px;
        background-color: #fff;
    }

    th {
        background-color: #42b983;
        color: rgba(255, 255, 255, 0.66);
        cursor: pointer;
        user-select: none;
    }

    td {
        background-color: #f9f9f9;
    }

    th,
    td {
        min-width: 120px;
        padding: 10px 20px;
    }

    th.active {
        color: #fff;
    }

    th.active .arrow {
        opacity: 1;
    }

    .arrow {
        display: inline-block;
        vertical-align: middle;
        width: 0;
        height: 0;
        margin-left: 5px;
        opacity: 0.66;
    }

    .arrow.asc {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 4px solid #fff;
    }

    .arrow.dsc {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #fff;
    }
`)
