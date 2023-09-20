import {html, reactiveElement, defineElement} from "viewding"
import {useMouse} from "./mouse"

@defineElement()
export class MouseTrack extends reactiveElement() {
    private mouse = useMouse(this)

    template(){
        return html`<h3 >MOUSE POSITION IS : ${this.mouse.x},${this.mouse.y}</h3>`
    }
}
