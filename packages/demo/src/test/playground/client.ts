import { mount, html, createRef, ref } from 'viewding';

const template = () => html`
    <playground-ide
        project-src="./svg/project.json"
        editable-file-system 
        line-numbers 
        resizable >
    </playground-ide>
`

mount("#app",template)
