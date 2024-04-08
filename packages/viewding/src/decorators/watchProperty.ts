import { PropertyDefine, reactiveElement } from "../reactiveElement";

export function watch(options?: Omit<PropertyDefine, "attribute">) {
    return (protoOrDescriptor: Object , name: string): any =>{
      const clazz = protoOrDescriptor.constructor as ReturnType<typeof reactiveElement>

      if (clazz.properties()[name] === undefined){
        clazz.properties()[name] = {attribute: false}
      }

      Object.assign(clazz.properties()[name], options)
    }
  }

// 默认设置Property关联Attribute，当Attribute改变时，自动修改Property的值。
export function watchAttr(options?: PropertyDefine) {
    return (protoOrDescriptor: Object , name: string): any =>{
      const clazz = protoOrDescriptor.constructor as ReturnType<typeof reactiveElement>

      if (clazz.properties()[name] === undefined){
        clazz.properties()[name] = {attribute: true}
      }

      Object.assign(clazz.properties()[name], options)
    }
}

