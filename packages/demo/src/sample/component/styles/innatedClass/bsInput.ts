import {defineElement, reactiveElement,watch,watchAttr} from "viewding/src"

@defineElement('bs-input','input')
export class BsInputDing extends reactiveElement(HTMLInputElement) {
    @watchAttr() sizeStyle = ""
    @watchAttr() plainText = false

    getInnateClasses(){
        return {
            "form-control-plaintext": this.plainText,
            "form-control": !this.plainText,
            "form-control-lg": this.sizeStyle == "large",
            "form-control-sm": this.sizeStyle == "small",
        }
    }
}
