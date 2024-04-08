import { html, when, reactive, mount, attachCss, css,shallowReactive, svg, toRaw, map, on, value } from 'viewding';

type Circle = {
  cx: number,
  cy: number,
  r: number
}

const history = shallowReactive([[]])
const data = reactive({
  index: 0,
  circles: [] as Circle[],
  selected: null as Circle | null | undefined,
  adjusting: false
})

function onClick({ clientX: x, clientY: y }) {
  if (data.adjusting) {
    data.adjusting = false
    data.selected = null
    push()
    return
  }

  data.selected = [...data.circles].reverse().find(({ cx, cy, r }) => {
    const dx = cx - x
    const dy = cy - y
    return Math.sqrt(dx * dx + dy * dy) <= r
  })

  if (!data.selected) {
    data.circles.push({
      cx: x,
      cy: y,
      r: 50
    })
    push()
  }
}

function adjust(circle) {
  data.selected = circle
  data.adjusting = true
}

function push() {
  history.length = ++data.index
  history.push(clone(data.circles))
  console.log(toRaw(history))
}

function undo() {
  data.circles = clone(history[--data.index])
}

function redo() {
  data.circles = clone(history[++data.index])
}

function clone(circles) {
  return circles.map((c) => ({ ...c }))
}

const template = ()=> html`
    <svg @click=${onClick}>
    <foreignObject x="0" y="40%" width="100%" height="200">
      <p class="tip">
        Click on the canvas to draw a circle. Click on a circle to select it.
        Right-click on the canvas to adjust the radius of the selected circle.
      </p>
    </foreignObject>
    ${map(data.circles, (circle)=>svg`
        <circle
          cx=${circle.cx}
          cy=${circle.cy}
          r=${circle.r}
          fill=${circle === data.selected ? `#ccc` : `#fff`}
          @click=${()=>data.selected = circle}
          @contextmenu=${on(()=>adjust(circle), "prevent")}
        ></circle>
    `)}
    </svg>

    <div class="controls">
    <button @click=${undo} ?disabled=${data.index <= 0}>Undo</button>
    <button @click=${redo} ?disabled=${data.index >= history.length - 1}>Redo</button>
    </div>

    ${when(data.adjusting, ()=>html`
      <div class="dialog" @click.stop>
      <p>Adjust radius of circle at (${ data.selected!.cx }, ${ data.selected!.cy })</p>
      <input type="range" .value=${value([data.selected!,"r"])} min="1" max="300">
      </div>
    `)}
`

attachCss(css`
body {
  margin: 0;
  overflow: hidden;
}

svg {
  width: 100vw;
  height: 100vh;
  background-color: #eee;
}

circle {
  stroke: #000;
}

.controls {
  position: fixed;
  top: 10px;
  left: 0;
  right: 0;
  text-align: center;
}

.controls button + button {
  margin-left: 6px;
}

.dialog {
  position: fixed;
  top: calc(50% - 50px);
  left: calc(50% - 175px);
  background: #fff;
  width: 350px;
  height: 100px;
  padding: 5px 20px;
  box-sizing: border-box;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
}

.dialog input {
  display: block;
  width: 200px;
  margin: 0px auto;
}

.tip {
  text-align: center;
  padding: 0 50px;
  color: #bbb;
}

  `)

mount("#app", template)
