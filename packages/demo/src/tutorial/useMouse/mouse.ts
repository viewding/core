import {CustomElement, reactive} from "viewding"
import { useEventListener } from './event'

// 按照惯例，组合式函数名以“use”开头
export function useMouse(ce:CustomElement) {
  const point = reactive({x:0,y:0})

//   // 组合式函数可以随时更改其状态。
//   function update(event) {
//     point.x = event.pageX
//     point.y = event.pageY
//   }

//   // 一个组合式函数也可以挂靠在所属组件的生命周期上
//   // 来启动和卸载副作用
//   ce.onConnected(() => window.addEventListener('mousemove', update))
//   ce.onDisconnected(() => window.removeEventListener('mousemove', update))

    useEventListener(ce, window, 'mousemove', (event) => {
        point.x = event.pageX
        point.y = event.pageY
    })

  // 通过返回值暴露所管理的状态
  return point
}
