import { html, reactive, defineElement, reactiveElement, mount } from 'viewding'

@defineElement('todo-item', 'li')
export class TodoItem extends reactiveElement(HTMLLIElement) {
    // 不需要作为元素的attribute，所以直接定义为reactive对象即可。
    todo = reactive({ text: '' })

    render() {
        this.textContent = this.todo.text
    }
}

const todoList = reactive([
    { id: 0, text: 'Vegetables' },
    { id: 1, text: 'Cheese' },
    { id: 2, text: 'Whatever else humans are supposed to eat' },
])

function template() {
    return html`
        ${todoList.map(
            (todo) => html`<li is="todo-item" .todo=${todo}></li>`
        )}
    `
}

mount(document.body,template)