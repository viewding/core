import { TemplateResult } from '@viewding/lit-html'

// 渲染的结果是一个自定义的template元素，该元素可以承载一个参数化的渲染函数。
export class ParameterTemplate extends HTMLTemplateElement{
    public render: ((...params: unknown[])=>TemplateResult) | null;
    constructor(){
        super()
        this.render = null
    }
}

customElements.define('parameter-template', ParameterTemplate, {extends:'template'})
