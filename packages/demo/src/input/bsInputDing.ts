import {defineElement, reactiveElement,watch} from "viewding"

export enum SizeStyle {
    large = "large",
    small = "small",
    default = "default"
}

@defineElement('bs-input-ding','input')
export class BsInputDing extends reactiveElement(HTMLInputElement) {
    @watch() sizeStyle = SizeStyle.default
    @watch() plainText = false

    render(){
        if(this.plainText){
            this.classList.remove("form-control","form-control-lg","form-control-sm")
            this.classList.add("form-control-plaintext");
        }
        else{
            this.classList.remove("form-control-plaintext","form-control","form-control-sm","form-control-lg");
            switch (this.sizeStyle){
                case SizeStyle.large:
                    this.classList.add("form-control-lg");
                    break;
                case SizeStyle.small:
                    this.classList.add("form-control-sm");
                    break;
                default:
                    this.classList.add("form-control");
                    break;
            }
        }
    }
}
