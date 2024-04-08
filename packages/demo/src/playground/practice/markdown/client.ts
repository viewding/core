import {html, unsafeHTML, reactiveElement, watch, css, defineElement, bindValue } from 'viewding';
import { marked } from 'marked'

@defineElement()
export class MarkdownView extends reactiveElement() {
  @watch() input = "# Hello, MarkDown!";

  template = () => {
      return html`
          <div class="editor">
              <textarea
                  class="input"
                  ${bindValue([this,"input"])}
              ></textarea>
              <div class="output">${unsafeHTML(marked(this.input))}</div>
          </div>
      `;
  };

  static styles = css`
    body  {
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
  `
}


