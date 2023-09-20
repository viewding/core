/** @format */

import {
    html,
    unsafeHTML,
    reactiveRef,
    mount,
    css,
    attachStyles,
    defineElement,
    reactiveElement,
    HTMLTemplateResult,
    watch,
} from "viewding";
import { marked } from "marked";
import { debounce } from "lodash-es";

const input = reactiveRef("# Hello, MarkDown!");
const output = reactiveRef(marked(input()));

const update = debounce((e) => {
    output(marked(e.target.value));
}, 100);

const template = () => {
    return html`
        <div class="editor">
            <textarea
                class="input"
                .value=${input()}
                @input=${update}
            ></textarea>
            <div class="output">${unsafeHTML(output())}</div>
        </div>
    `;
};

function getTemplate() {
    const input = reactiveRef("# Hello, MarkDown!");
    const output = reactiveRef(marked(input()));

    const update = debounce((e) => {
        output(marked(e.target.value));
    }, 100);

    return () => {
        return html`
            <div class="editor">
                <textarea
                    class="input"
                    .value=${input()}
                    @input=${update}
                ></textarea>
                <div class="output">${unsafeHTML(output())}</div>
            </div>
        `;
    };
}

@defineElement()
export class MarkdownView extends reactiveElement() {
    template = getTemplate();
}

export class MarkdownView2 extends reactiveElement() {
    declare template: () => HTMLTemplateResult;
    constructor() {
        super();

        const input = reactiveRef("# Hello, MarkDown!");
        const output = reactiveRef(marked(input()));

        const update = debounce((e) => {
            output(marked(e.target.value));
        }, 100);

        this.template = () => {
            return html`
                <div class="editor">
                    <textarea
                        class="input"
                        .value=${input()}
                        @input=${update}
                    ></textarea>
                    <div class="output">${unsafeHTML(output())}</div>
                </div>
            `;
        };
    }
}

export class MarkdownView3 extends reactiveElement() {
    @watch() input = "# Hello, MarkDown!";
    @watch() output = marked(input());

    update = debounce((e) => {
        output(marked(e.target.value));
    }, 100);

    template = () => {
        return html`
            <div class="editor">
                <textarea
                    class="input"
                    .value=${this.input}
                    @input=${this.update}
                ></textarea>
                <div class="output">${unsafeHTML(this.output)}</div>
            </div>
        `;
    };
}

attachStyles(css`
    body {
        margin: 0;
    }

    .editor {
        height: 100vh;
        display: flex;
    }

    .input,
    .output {
        overflow: auto;
        width: 50%;
        height: 100%;
        box-sizing: border-box;
        padding: 0 20px;
    }

    .input {
        border: none;
        border-right: 1px solid #ccc;
        resize: none;
        outline: none;
        background-color: #f6f6f6;
        font-size: 14px;
        font-family: "Monaco", courier, monospace;
        padding: 20px;
    }

    code {
        color: #f66;
    }
`);

mount(document.body, template);
mount(document.body, () => html`<markdown-view></markdown-view>`);
mount(document.body, () => html`<markdown-view2></markdown-view2>`);
