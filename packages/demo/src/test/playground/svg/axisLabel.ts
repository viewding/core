import { svg } from 'viewding'
import { valueToPoint } from './util.js'


export type Stat = {
    label:string,
    value:number
}

export function axisLabel(stat:Stat,index:number,total:number){
    const point = valueToPoint(+stat.value + 10, index, total)

    return svg`
        <text x=${point.x} y=${point.y}>${stat.label}</text>
    `
}
