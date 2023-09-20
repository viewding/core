import { mount } from 'viewding';
import { html } from '@viewding/lit-html';

const message='Hello World!'

function template(){
    return html`<h1>${message}</h1>`
}

mount(document.body,template)
