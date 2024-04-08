import { html, defineElement, reactiveElement, watchAttr, useTransition, select, bindValue, watch, reactive } from 'viewding/src'
import { attachCss, mount } from 'viewding/src/mount'
import { list } from 'viewding/src/transition/list'

function shuffle(array:any[]) {
    const length = array == null ? 0 : array.length;
    if (!length) {
        return [];
    }
    let index = -1;
    const lastIndex = length - 1;
    while (++index < length) {
        const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
        const value = array[rand];
        array[rand] = array[index];
        array[index] = value;
    }
}

@defineElement()
export class ListDemo extends reactiveElement(HTMLElement) {
    items = reactive([1,2,3,4,5])
    itemValue = 6

    transition = useTransition(this,{name:"fade",appear:true})

    insert() {
        const i = Math.round(Math.random() * this.items.length)
        this.items.splice(i, 0, this.itemValue++)
      }
      
    reset() {
        this.items.length = 0
        this.items.push(...[1,2,3,4,5])
      }
      
    shuffle() {
        shuffle(this.items)
    }
        
    removeItem(item:any) {
        return ()=>{
            const i = this.items.indexOf(item)
            if (i > -1) {
            this.items.splice(i, 1)
            }
        }
      }

    template(){
        return html`
        <button @click=${this.insert}>Insert</button>
        <button @click=${this.reset}>Reset</button>
        <button @click=${this.shuffle}>Shuffle</button>
      
        <ul class="container">
        ${list(
            this.items,
            (item)=>item,
            (item)=>html`<li class="item">${item} <span @click=${this.removeItem(item)}>x</span></li>`,
            this.transition
        )}
        </ul>
              `
    }
}

    // background-color: #f3f3f3;
    // border: 1px solid #666;
attachCss(`
.container {
    position: relative;
  }
  
  .item {
    width: 100%;
    height: 30px;
    box-sizing: border-box;
  }
  
  /* 1. 声明过渡效果 */
  .fade-move,
  .fade-enter-active,
  .fade-leave-active {
    transition: all 1s cubic-bezier(0.55, 0, 0.1, 1);
  }
  
  /* 2. 声明进入和离开的状态 */
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: scaleY(0.01) translate(30px, 0);
  }
  
  /* 3. 确保离开的项目被移除出了布局流
        以便正确地计算移动时的动画效果。 */
  .fade-leave-active {
    position: absolute;
  }
  `)

const template = () => html`<list-demo></list-demo>`

mount("#app",template)
