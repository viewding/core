// event.js
import * as vd from "viewding"

export function useEventListener(ce:vd.ReactiveElement,target, event, callback) {
  ce.onCallback("Connecting",() => target.addEventListener(event, callback))
  ce.onCallback("Disconnected",() => target.removeEventListener(event, callback))
}