import { defineElement, reactiveElement, watch, html } from 'viewding';

@defineElement()
export class TemperatureConverter extends reactiveElement() {
    @watch() c = 0
    @watch() f = 32
    
    setC(e) {
      this.c = e.target.value
      this.f = e.target.value * (9 / 5) + 32
    }
    
    setF(e) {
      this.f = e.target.value
      this.c = (e.target.value - 32) * (5 / 9)
    }

    template(){ 
        return html` 
        <input type="number" .value=${this.c} @change=${this.setC}> Celsius =
        <input type="number" .value=${this.f} @change=${this.setF}> Fahrenheit
    `}
}
