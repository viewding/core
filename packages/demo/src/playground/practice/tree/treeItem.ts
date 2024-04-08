import { html,defineElement, reactiveElement, watch, classMap, when } from 'viewding'

@defineElement("tree-item","li")
export class TreeItem extends reactiveElement(HTMLLIElement) {
    @watch() model = {} as any
    @watch() isOpen = false

    // todo：装饰器 @computed
    get isFolder() {
        return this.model.children && this.model.children.length
    }

    toggle() {
        this.isOpen = !this.isOpen
    }

    changeType() {
        if (!this.isFolder) {
            this.model.children = []
            this.addChild()
            this.isOpen = true
        }
    }

    addChild() {
        this.model.children.push({ name: 'new stuff' })
    }

    template() {
        return html`
        <div
          class=${classMap({ bold: this.isFolder })}
          @click=${this.toggle}
          @dblclick=${this.changeType}>
          ${this.model.name}
          ${when(
              this.isFolder,
              () => html`<span>[${this.isOpen ? '-' : '+'}]</span>`
          )}
        </div>
        ${when(
            this.isOpen && this.isFolder,
            () => html`
            <ul>
            ${this.model.children.map((model)=>html`
                    <!-- 可以使用当前正在定义的元素 -->
                    <li is=tree-item
                        class="item"
                        .model=${model}
                    >
                    </li>
            `)}
            <li class="add" @click=${this.addChild}>+</li>
            </ul>
            `
        )}
        `
    }
}
