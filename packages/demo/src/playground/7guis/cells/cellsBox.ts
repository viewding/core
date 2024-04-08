/** @format */

import {
    defineElement,
    reactiveElement,
    html,
    attachCss,
    css,
    attr,
    watch,
    when,
    ref,
    createRef,
    Hook,
} from "viewding"
import { cells, evalCell } from "./store.js"

@defineElement()
export class CellsBox extends reactiveElement() {
    @attr() r: number
    @attr() c: number
    @watch() editing = false

    update(e) {
        this.editing = false
        cells[this.c][this.r] = e.target.value.trim()
    }

    inputRef = createRef<HTMLInputElement>()

    render(isFirst?: boolean) {
        super.render(isFirst)
        if (this.inputRef.value) this.inputRef.value.focus()
    }

    template() {
        return html`
            <div class="cell" title=${cells[this.c][this.r]} @click=${() => (this.editing = true)}>
                ${when(
                    this.editing,
                    () => html`
                        <input
                            ${ref(this.inputRef)}
                            .value=${cells[this.c][this.r]}
                            @change=${this.update}
                            @blur=${this.update}
                        />
                    `,
                    () => html` <span>${evalCell(cells[this.c][this.r])}</span> `
                )}
            </div>
        `
    }
}

attachCss(css`
    .cell,
    .cell input {
        height: 1.5em;
        line-height: 1.5;
        font-size: 15px;
    }

    .cell span {
        padding: 0 6px;
    }

    .cell input {
        width: 100%;
        box-sizing: border-box;
    }
`)
