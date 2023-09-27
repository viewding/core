import { html, value, reactive, mount, attachCss, css, computed } from 'viewding';

// const names = reactive()
// const selected = ref('')
// const prefix = ref('')
// const first = ref('')
// const last = ref('')
const data = reactive({
    names:['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'],
    selected: '',
    prefix: '',
    first: '',
    last: ''
})

const filteredNames = computed(() =>
  data.names.filter((n) =>
    n.toLowerCase().startsWith(data.prefix.toLowerCase())
  )
)

const select= ()=>{
    [data.last, data.first] = data.selected.split(', ')
}

function create() {
  if (hasValidInput()) {
    const fullName = `${data.last}, ${data.first}`
    if (!data.names.includes(fullName)) {
      data.names.push(fullName)
      data.first = data.last = ''
    }
  }
}

function update() {
  if (hasValidInput() && data.selected) {
    const i = data.names.indexOf(data.selected)
    data.names[i] = data.selected = `${data.last}, ${data.first}`
  }
}

function del() {
  if (data.selected) {
    const i = data.names.indexOf(data.selected)
    data.names.splice(i, 1)
    data.selected = data.first = data.last = ''
  }
}

function hasValidInput() {
  return data.first.trim() && data.last.trim()
}

const template = ()=> html`
<div><input .value=${value([data,"prefix"])} placeholder="Filter prefix"></div>

<select size="5" .value=${value([data,"selected"])} @change=${select}>
    ${ filteredNames.value.map((name)=>html`
        <option>${ name }</option>
    `)}
  
</select>

<label>Name: <input .value=${value([data,"first"])}></label>
<label>Surname: <input .value=${value([data,"last"])}></label>

<div class="buttons">
  <button @click=${create}>Create</button>
  <button @click=${update}>Update</button>
  <button @click=${del}>Delete</button>
</div>
`

attachCss(css`
    * {
        font-size: inherit;
    }
    
    input {
        display: block;
        margin-bottom: 10px;
    }
    
    select {
        float: left;
        margin: 0 1em 1em 0;
        width: 14em;
    }
    
    .buttons {
        clear: both;
    }
    
    button + button {
        margin-left: 5px;
    }
  `)

mount("#app", template)
