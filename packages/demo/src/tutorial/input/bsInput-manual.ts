
class BsInput extends HTMLInputElement {
    static get observedAttributes() {
        return ['size-style', 'plain-text'];
    }

    constructor(){
        super();
        this.classList.add("form-control");
        if(this.type=="color"){
            this.classList.add("form-control-color");
        }
    }

    get sizeStyle(){
        const style = this.getAttribute("size-style") 
        return style ? style : "default"
    }

    set sizeStyle(value:string){
        if(value == "default"){
            this.removeAttribute("size-style");
        }
        else {
            this.setAttribute("size-style", value)
        }
    }

    get plainText():boolean{
        if (this.getAttribute("plain-text")==null){
            return false;
        }
        else return true;
    }

    set plainText(value:boolean){
        if(value){
            this.setAttribute("plain-text", "")
        }
        else{
            this.removeAttribute("plain-text")
        }
    }

    attributeChangedCallback(name:string, oldValue:any, newValue:any) {
        switch(name){
            case "plain-text":
                if(newValue==null){
                    this.classList.remove("form-control-plaintext");
                    this.classList.add("form-control");     
                }
                else {
                    this.classList.remove("form-control");
                    this.classList.add("form-control-plaintext");
                }
                break;
            case "size-style":
                switch (newValue){
                    case "large":
                        this.classList.remove("form-control-sm");
                        this.classList.add("form-control-lg");
                        break;
                    case "small":
                        this.classList.remove("form-control-lg");
                        this.classList.add("form-control-sm");
                        break;
                    default:
                        this.classList.remove("form-control-lg","form-control-sm");
                        break;
                }
            default:
                break;
        }
    }
}

customElements.define('bs-input', BsInput, {extends:"input"})
