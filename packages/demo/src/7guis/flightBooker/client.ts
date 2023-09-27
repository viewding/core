import { defineElement, reactiveElement, watch, html, computed, attachCss, css, value, reactiveRef } from 'viewding';


function calGetter(getter:()=>any){
  const ref = reactiveRef(getter())
}

@defineElement()
export class FlightBooker extends reactiveElement() {
  @watch() flightType = 'one-way flight'
  @watch() departureDate = this.dateToString(new Date())
  @watch() returnDate = this.departureDate
  
  isReturn = computed( ()=> {
     return this.flightType === 'return flight'
  } )
  
  canBook = computed (()=>{
      const validData = this.stringToDate(this.returnDate) > this.stringToDate(this.departureDate)
      return !this.isReturn.value || validData
      //this.stringToDate(this.returnDate) > this.stringToDate(this.departureDate)
  })
  
  book() {
    alert(
      this.isReturn.value
        ? `You have booked a return flight leaving on ${this.departureDate} and returning on ${this.returnDate}.`
        : `You have booked a one-way flight leaving on ${this.departureDate}.`
    )
  }
  
  stringToDate(str) {
    const [y, m, d] = str.split('-')
    return new Date(+y, m - 1, +d)
  }
  
  dateToString(date) {
    return (
      date.getFullYear() +
      '-' +
      this.pad(date.getMonth() + 1) +
      '-' +
      this.pad(date.getDate())
    )
  }
  
  pad(n, s = String(n)) {
    return s.length < 2 ? `0${s}` : s
  }

  template(){ 
        return html` 
      <select .value=${value([this,"flightType"])}>
        <option value="one-way flight">One-way Flight</option>
        <option value="return flight">Return Flight</option>
      </select>
    
      <input type="date" .value=${value([this,"departureDate"])} @change=${(e)=>this.departureDate = e.target.value }>
      <input type="date" .value=${value([this,"returnDate"])} .disabled=${!this.isReturn.value}>
    
      <button .disabled=${!this.canBook.value} @click=${this.book}>Book</button>
    
      <p>${ this.canBook.value ? '' : 'Return date must be after departure date.' }</p>
    `}
}

attachCss(css`
  select,
  input,
  button {
    display: block;
    margin: 0.5em 0;
    font-size: 15px;
  }

  input[disabled] {
    color: #999;
  }

  p {
    color: red;
  }
`)