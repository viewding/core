import { PropertyDefine } from "../customElement";

export function watch(options?: Omit<PropertyDefine,"isWatched">) {
    return (protoOrDescriptor: Object , name: PropertyKey): any =>{
      const properties = (protoOrDescriptor.constructor as any).properties

      if (properties[name] === undefined){
        properties[name] = {attribute: false}
      }

      Object.assign(properties[name], options)
    }
  }

// 设置Property的关联Attribute，当Attribute改变时，自动修改Property的值。但是，当Property改变时不影响Attribute的值。
export function watchAttr(attribute?:boolean|string) {
    return (protoOrDescriptor: Object , name: PropertyKey): any =>{
      const properties = (protoOrDescriptor.constructor as any).properties

      if (properties[name] === undefined){
        properties[name] = {attribute: true}
      }

      if(attribute!==undefined){
        properties[name].attribute = attribute
      }
    }
}

