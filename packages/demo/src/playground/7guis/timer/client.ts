import { html, value, mount, attachCss, css, reactiveRef, computed } from 'viewding';

const duration = reactiveRef(15 * 1000)
const elapsed = reactiveRef(0)

let lastTime
let handle

const update = () => {
  elapsed.value = performance.now() - lastTime
  if (elapsed.value >= duration.value) {
    cancelAnimationFrame(handle)
  } else {
    handle = requestAnimationFrame(update)
  }
}

const reset = () => {
  elapsed.value = 0
  lastTime = performance.now()
  update()
}

const progressRate = computed(() =>
  Math.min(elapsed.value / duration.value, 1)
)

reset()

const template = ()=> html`
    <label
    >Elapsed Time: <progress .value=${progressRate.value}></progress
  ></label>

  <div>${ (elapsed.value / 1000).toFixed(1) }s</div>

  <div>
    Duration: <input type="range" .value=${value(duration)} min="1" max="30000">
    ${ (duration.value / 1000).toFixed(1) }s
  </div>

  <button @click=${reset}>Reset</button>
`

attachCss(css`
    .elapsed-container {
        width: 300px;
    }
    
    .elapsed-bar {
        background-color: red;
        height: 10px;
    }
`)

mount("#app", template)
