import { ChildPart, Directive, PartInfo, directive, DirectiveParameters,TemplateResult,html } from '@viewding/lit-html'

// 渲染的结果是一个自定义的template元素，该元素可以承载一个参数化的渲染函数。
export class ParameterTemplate extends HTMLTemplateElement{
    public render: ((...params: unknown[])=>TemplateResult) | null;
    constructor(){
        super()
        this.render = null
    }
}

customElements.define('parameter-template', ParameterTemplate, {extends:'template'})

// 在子元素位置使用的指令
class SlotRenderDirective extends Directive {
    parent?: HTMLElement;
    constructor(partInfo:PartInfo){
        super(partInfo)
        //this.parent = partInfo.parentNode as HTMLElement
    }

    // 把动态模板函数放到template元素的属性中。
    // todo: 
    // 1. 用parent来找出 template 可能不合适，需要直接指定包含slot的自定义元素本身。
    // 2. 自定义元素不使用template,直接包含元素作为default slot的元素时，如何区分自定义元素自己的子元素和default slot中的子元素？可以考虑：自定义元素支持一个 defaultTemplate 的自定义property，功能和template的render 一样，可以视作是自定义元素下直接包含名为default的template元素。
    render(name:string, defaultTemplate:(...params: unknown[])=>TemplateResult, ...params:unknown[] ){
        console.log("\n Render...")
        const template = Array.from(this.parent!.children).find((e)=>{
            if(e.tagName =='TEMPLATE'){
                return e
            }
        })
        this.parent!.children

        if (template){
            //return templateContent(template as HTMLTemplateElement)
            const t = (template as ParameterTemplate).render
            if(t!=null) return t(params)
        }
        else if( defaultTemplate ){
            return defaultTemplate(params)
        }
        else return html``
    }

    update(part:ChildPart, [name, defaultTemplate, ...params]: DirectiveParameters<this>){
        this.parent = part.parentNode as HTMLElement
        return this.render(name,defaultTemplate, ...params)
    }
}

export const slotRender = directive(SlotRenderDirective) 
