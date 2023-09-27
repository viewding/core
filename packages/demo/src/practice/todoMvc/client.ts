import { html, mount, reactiveRef, effect, on, classMap, value, when, computed, ref, createRef } from 'viewding';

const STORAGE_KEY = 'vue-todomvc'

const filters = {
  all: (todos:any[]) => todos,
  active: (todos:any[]) => todos.filter((todo) => !todo.completed),
  completed: (todos:any[]) => todos.filter((todo) => todo.completed)
}

// 状态
const todos = reactiveRef(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
const visibility = reactiveRef('all')
const editedTodo = reactiveRef<any>(null)

// 获取的状态

const filteredTodos = computed(
    () : any[] => filters[visibility.value](todos.value)
)
const remaining = computed (
    () => filters.active(todos.value).length
)

// 处理路由
window.addEventListener('hashchange', onHashChange)
onHashChange()

// 状态持久化
effect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
})

function toggleAll(e) {
  todos.value.forEach((todo) => (todo.completed = e.target.checked))
}

function addTodo(e) {
  const value = e.target.value.trim()
  if (value) {
    todos.value.push({
      id: Date.now(),
      title: value,
      completed: false
    })
    e.target.value = ''
  }
}

function removeTodo(todo) {
  todos.value.splice(todos.value.indexOf(todo), 1)
}

let beforeEditCache = ''
function editTodo(todo) {
  beforeEditCache = todo.title
  editedTodo.value = todo
}

const inputRef = createRef()

const onAfterRender = () => {
  if(inputRef.value) (inputRef.value as HTMLElement).focus();
}

function cancelEdit(todo) {
  editedTodo.value = null
  todo.title = beforeEditCache
}

function doneEdit(todo) {
  if (editedTodo.value) {
    editedTodo.value = null
    todo.title = todo.title.trim()
    if (!todo.title) removeTodo(todo)
  }
}

const onKeyup = (todo) => {
  return (e) => {
    on(()=>doneEdit(todo), "enter").handleEvent(e)
    on(()=>cancelEdit(todo), "escape").handleEvent(e)
  }
}

function removeCompleted() {
  todos.value = filters.active(todos.value)
}

function onHashChange() {
  const route = window.location.hash.replace(/#\/?/, '')
  if (filters[route]) {
    visibility.value = route
  } else {
    window.location.hash = ''
    visibility.value = 'all'
  }
}

const template = () => html`${todos==null? "" : ""}
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        autofocus
        placeholder="What needs to be done?"
        @keyup = ${on(addTodo, "enter")}
      >
    </header>
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        :checked="remaining === 0"
        @change=${toggleAll}
      >
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
      ${ filteredTodos.value.map((todo)=>html`
        <li
          class="todo ${classMap({ completed: todo.completed, editing: todo === editedTodo.value })}"
        >
          <div class="view">
            <input class="toggle" type="checkbox" .checked=${value([todo,"completed"])}>
            <label @dblclick=${()=>editTodo(todo)}>${ todo.title }</label>
            <button class="destroy" @click=${()=>removeTodo(todo)}></button>
          </div>
          ${when( todo === editedTodo.value, ()=> html`
          <input ${ref(inputRef)}
            class="edit"
            type="text"
            .value=${value([todo,"title"])}
            @blur=${()=>doneEdit(todo)}
            @keyup=${onKeyup(todo)}
          >
          `)}
        </li>
      `)
      }
      </ul>
    </section>
    <footer class="footer" >
      <span class="todo-count">
        <strong>${ remaining.value }</strong>
        <span>${ remaining.value === 1 ? ' item' : ' items' } left</span>
      </span>
      <ul class="filters">
        <li>
          <a href="#/all" class="${classMap({ selected: visibility() === 'all' })}">All</a>
        </li>
        <li>
          <a href="#/active" class="${classMap({ selected: visibility() === 'active' })}">Active</a>
        </li>
        <li>
          <a href="#/completed" class="${classMap({ selected: visibility() === 'completed' })}">Completed</a>
        </li>
      </ul>
      ${when(todos.value.length > remaining.value, ()=>html`
      <button class="clear-completed" @click=${removeCompleted} >
        Clear completed
      </button>`
      )}
    </footer>
  </section>
`

mount("#app", template, onAfterRender)