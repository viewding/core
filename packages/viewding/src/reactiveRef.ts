import { reactive} from '@viewding/reactivity'

export type ReactiveRef<T> = {
    (v?:T):T
    value:T
}

export function reactiveRef<T>(value:T){
    let _ref = reactive({value})
    function func (v?:T) {
        if(typeof v === 'undefined') return _ref.value
        else{
            return (_ref.value as T) = v
        }
    }

    class Proto extends Function {
        get value (){
            return (_ref.value as T)
        }
        set value(v:T){
            (_ref.value as T) = v
        }
		get ref(){
			return _ref
		}
    }
    Object.setPrototypeOf(func,new Proto())
    return func as  ReactiveRef<T>
}
