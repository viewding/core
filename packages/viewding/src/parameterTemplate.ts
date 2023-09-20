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
class RenderTemplateDirective extends Directive {
    parent?: HTMLElement;
    constructor(partInfo:PartInfo){
        super(partInfo)
        //this.parent = partInfo.parentNode as HTMLElement
    }

    // 把动态模板函数放到template元素的属性中。
    // todo：
    // 自动同一个父元素下兄弟元素中带同样slot属性名的template元素（如果不是参数化的模板，普通的template元素也可以）。
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

export const renderTemplate = directive(RenderTemplateDirective) 
