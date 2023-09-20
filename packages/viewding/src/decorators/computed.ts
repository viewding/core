// 不能使用reactive中的effect异步更新逻辑，因为依赖值改变后触发的render和compute的顺序不可控，可能会导致render在compute之前，那么就会产生render结果是失效数据的错误结果。

// 需要实现一个同步而非异步的effect机制：
// 1. 被compute包裹的函数中监控reactive数据
// 2. 如果reactive数据发生变化，那么置缓存数据失效。
// 3. 数据失效后，需要取值时自然就会重新计算。

import { ReactiveEffect } from '@viewding/reactivity'

export type Computer<T> = (...args: any[]) => T

export function computed<T>(getter: Computer<T>) {
    let _value: T
    let _dirty = true
    const effect = new ReactiveEffect(getter, () => {
        if (!_dirty) {
            _dirty = true
        }
    })

    return () => {
        if (_dirty) {
            _dirty = false
            _value = effect.run()!
        }
        return _value
    }
}
