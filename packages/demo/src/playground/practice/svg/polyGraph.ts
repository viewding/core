import { svg } from 'viewding'
import { valueToPoint } from './util.js'
import { axisLabel, Stat } from './axisLabel.js'

export function polyGraph(stats: Stat[]) {
    const total = stats.length
    const points = () => {
        return stats
            .map((stat, i) => {
                const { x, y } = valueToPoint(stat.value, i, total)
                return `${x},${y}`
            })
            .join(' ')
    }

    return svg`
        <g>
        <polygon points=${points()}></polygon>
        <circle cx="100" cy="100" r="80"></circle>
        ${stats.map((stat, index) => axisLabel(stat, index, total))}
        </g>
      `
}
