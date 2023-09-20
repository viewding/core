import { when, map, html, mount,reactiveRef, reactive} from 'viewding';

const list = reactive([1,2,3])

const show = reactiveRef(true)

const template = ()=>{
    return html`  
    <button @click=${()=>show(!show())}>Toggle List</button>
    <button @click=${()=>list.push(list.length + 1)}>Push Number</button>
    <button @click=${()=>list.pop()}>Pop Number</button>
    <button @click=${()=>list.reverse()}>Reverse List</button>
    
    ${ when( show() && list.length,
        ()=>html`<ul>
            ${map(list,
                (item)=>html`<li>${item}</li>`)
            }
        </ul>`,
        ()=>when( list.length,
            ()=>html`<p>List is not empty, but hidden.</p>`,
            ()=>html`<p>List is empty.</p>`
        )
    )}
    `
}

mount(document.body,template)
