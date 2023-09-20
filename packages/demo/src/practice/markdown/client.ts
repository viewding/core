import {html, unsafeHTML, reactiveRef, mount } from 'viewding';
import { marked } from 'marked'
import { debounce } from 'lodash-es'

const input = reactiveRef('# Hello, MarkDown!')

const output = reactiveRef(marked(input())) 

const update = debounce((e) => {
  output(marked(e.target.value) )
}, 100)

function template(){
    return html`
        <div class="editor">
            <textarea class="input" .value=${input()}  @input=${update}></textarea>
            <div class="output"> ${unsafeHTML(output())}</div>
        </div>
        <style>
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
          font-family: 'Monaco', courier, monospace;
          padding: 20px;
        }
        
        code {
          color: #f66;
        }
    </style>
    `
}

mount(document.body,template)
