import { attachCss, html, mount,css } from 'viewding';
import './treeItem'

const treeData = {
    name: 'My Tree',
    children: [
      { name: 'hello' },
      { name: 'world' },
      {
        name: 'child folder',
        children: [
          {
            name: 'child folder',
            children: [{ name: 'hello' }, { name: 'world' }]
          },
          { name: 'hello' },
          { name: 'world' },
          {
            name: 'child folder',
            children: [{ name: 'hello' }, { name: 'world' }]
          }
        ]
      }
    ]
  }
  

function template(){
    return html`
    <ul>
        <li is='tree-item' class="item" .model=${treeData}></li>
    </ul>
    `
}

attachCss(css`
  .item {
    cursor: pointer;
    line-height: 1.5;
  }
  .bold {
    font-weight: bold;
  }
`)

mount("#app",template)
