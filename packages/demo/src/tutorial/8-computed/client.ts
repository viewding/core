import { html, mount, reactive, classMap, reactiveRef, value, on } from 'viewding'

let id = 0

const newTodo = reactiveRef('message')
const hideCompleted = reactiveRef(false)
const todos = reactive([
    { id: id++, text: 'Learn HTML', done: true },
    { id: id++, text: 'Learn JavaScript', done: true },
    { id: id++, text: 'Learn Vue', done: false },
])

// const filteredTodos = cached(() => {
//     return hideCompleted.value
//       ? todos.filter((t) => !t.done)
//       : todos
//   })
const filteredTodos = () => {
    return hideCompleted.value ? todos.filter((t) => !t.done) : todos
}

function addTodo() {
    todos.push({ id: id++, text: newTodo.value, done: false })
    newTodo.value = 'new todo'
}

function removeTodo(todo) {
    todos.filter((t, index, arr) => {
        if (t === todo) arr.splice(index, 1)
        else return true
    })
}

function template() {
    return html`
        <form @submit=${on(addTodo, 'prevent')}>
            <input .value=${value(newTodo)} />
            <button>Add Todo</button>${newTodo()}
        </form>
        <ul>
            ${filteredTodos().map(
                (todo) => html`
                    <li>
                        ${todo.id}.
                        <input
                            type="checkbox"
                            .checked=${value(['done', todo])}
                        />${todo.done}
                        <span class=${classMap({ done: todo.done })}
                            >${todo.text}</span
                        >
                        <button @click=${() => removeTodo(todo)}>X</button>
                    </li>
                `
            )}
        </ul>

        <button @click=${() => hideCompleted(!hideCompleted())}>
            ${hideCompleted() ? 'Show all' : 'Hide completed'}
        </button>

        <style>
            .done {
                text-decoration: line-through;
            }
        </style>
    `
}

mount(document.body, template)
