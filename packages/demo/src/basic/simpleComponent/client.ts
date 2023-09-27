import { html, reactive, defineElement, reactiveElement, mount } from 'viewding'

@defineElement('todo-item', 'li')
export class TodoItem extends reactiveElement(HTMLLIElement) {
    todo = reactive({ text: '' })

    render() {
        this.textContent = this.todo.text
    }
}

@defineElement('todo-list', 'ol')
export class TodoList extends reactiveElement(HTMLOListElement) {
    todoList = reactive([
        { id: 0, text: 'Vegetables' },
        { id: 1, text: 'Cheese' },
        { id: 2, text: 'Whatever else humans are supposed to eat' },
    ])

    template() {
        return html`
            ${this.todoList.map(
                (todo) => html`<li is="todo-item" .todo=${todo}></li>`
            )}
        `
    }
}
