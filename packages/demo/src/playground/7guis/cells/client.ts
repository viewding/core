import { html, value, reactive, mount, attachCss, css, range, map } from 'viewding';

import './cellsBox.js'
import { cells } from './store.js'

const cols = cells.map((_, i) => String.fromCharCode(65 + i))

const template = ()=> html`
  <table>
  <thead>
    <tr>
      <th></th>
      ${map(cols, (c)=>html`
        <th >${ c }</th>
      `)}
    </tr>
  </thead>
  <tbody>
  ${map( range(0, cells[0].length), (i)=>html`
      <tr>
        <th>${i}</th>
        ${map(cols, (c,j)=>html`
          <td >
            <cells-box r=${i} c=${j}></cells-box>
          </td>
        `)}
      </tr>
  `)}
  </tbody>
  </table>
`

attachCss(css`
    body {
      margin: 0;
    }

    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
    }

    th {
      background-color: #eee;
    }

    tr:first-of-type th {
      width: 100px;
    }

    tr:first-of-type th:first-of-type {
      width: 25px;
    }

    td {
      border: 1px solid #ccc;
      height: 1.5em;
      overflow: hidden;
    }
  `)

mount("#app", template)
