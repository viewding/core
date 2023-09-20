const systemModifiers = ['ctrl', 'shift', 'alt', 'meta']

type KeyedEvent = KeyboardEvent | MouseEvent | TouchEvent

const modifierGuards: Record<
    string,
    (e: Event, modifiers: string[]) => void | boolean
> = {
    stop: (e) => e.stopPropagation(),
    prevent: (e) => e.preventDefault(),
    self: (e) => e.target !== e.currentTarget,
    ctrl: (e) => !(e as KeyedEvent).ctrlKey,
    shift: (e) => !(e as KeyedEvent).shiftKey,
    alt: (e) => !(e as KeyedEvent).altKey,
    meta: (e) => !(e as KeyedEvent).metaKey,
    left: (e) => 'button' in e && (e as MouseEvent).button !== 0,
    middle: (e) => 'button' in e && (e as MouseEvent).button !== 1,
    right: (e) => 'button' in e && (e as MouseEvent).button !== 2,
    exact: (e, modifiers) =>
        systemModifiers.some(
            (m) => (e as any)[`${m}Key`] && !modifiers.includes(m)
        ),
}

// Kept for 2.x compat.
// Note: IE11 compat for `spacebar` and `del` is removed for now.
const keyNames: Record<string, string | string[]> = {
    esc: 'escape',
    space: ' ',
    up: 'arrow-up',
    left: 'arrow-left',
    right: 'arrow-right',
    down: 'arrow-down',
    delete: 'backspace',
}

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
    const cache: Record<string, string> = Object.create(null)
    return ((str: string) => {
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    }) as T
}

const hyphenateRE = /\B([A-Z])/g

const hyphenate = cacheStringFunction((str: string) =>
    str.replace(hyphenateRE, '-$1').toLowerCase()
)

// 可以直接使用 KeyboardEvent.key (https://cn.vuejs.org/guide/essentials/event-handling.html#key-modifiers) 暴露的按键名称作为修饰符，但需要转为 kebab-case 形式。
const withKeys = (fn: Function, modifiers: string[]) => {
    return (event: Event) => {
        if (!('key' in event)) {
            return
        }

        const eventKey = hyphenate((event as KeyboardEvent).key)
        if (modifiers.some((k) => k === eventKey || keyNames[k] === eventKey)) {
            return fn(event)
        }
    }
}

const listenerOptions=['once','passive','capture']

export function eventHandler (fn: Function, modifiers: string){
    const options = {}
    const guardModifiers:string[] = []
    const keyOptions:string[] = []
    const guards = Object.keys(modifierGuards)
    for( const str of modifiers.trim().split(/\s+/)){
        if(guards.includes(str)){
            guardModifiers.push(str)
        }
        else if(listenerOptions.includes(str)){
            (options as any)[str] = true
        }
        else{
            keyOptions.push(str)
        }
    }
    // 如果guard(event, modifiers)返回真值，那么原始的提供的事件处理程序将不会被执行。
    let handler = (event: Event, ...args: unknown[]) => {
        for(const mod of guardModifiers){
            const guard = modifierGuards[mod]
            // guard为stop和prevent时，guard(...)返回值为假（void）, 所以不会导致return。
            if (guard && guard(event, guardModifiers)) return
        }
        return fn(event, args)
    }

    // 如果设置了keyOptions, 那么event.key必须有值，且event.key包含在指定的keyOptions中，否则不触发事件。
    if(keyOptions.length>0){
        handler = withKeys(handler,keyOptions)
    }

    return {handleEvent:handler,options}
}
