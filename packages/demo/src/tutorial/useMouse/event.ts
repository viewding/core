// event.js
import {CustomElement} from "viewding"

export function useEventListener(ce:CustomElement,target, event, callback) {
  // 如果你想的话，
  // 也可以用字符串形式的 CSS 选择器来寻找目标 DOM 元素
  ce.onConnected(() => target.addEventListener(event, callback))
  ce.onDisconnected(() => target.removeEventListener(event, callback))
}