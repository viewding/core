import * as vd from "viewding"
import {useMouse} from "./mouse"

@vd.defineElement()
export class MouseTrack extends vd.reactiveElement() {
    private mouse = useMouse(this)

    template(){
        return vd.html`<h3 >MOUSE POSITION IS : ${this.mouse.x},${this.mouse.y}</h3>`
    }
}
