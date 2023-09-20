import { PropertyDefine } from "../customElement";

const legacyProperty = (
    options: PropertyDefine,
    proto: Object,
    name: PropertyKey
  ) => {
    (proto.constructor as any).properties[name] = options
  };
  
export function watch(options?: PropertyDefine) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (protoOrDescriptor: Object , name?: PropertyKey): any =>{
      if(options===undefined) options = {}
      if(options.attribute === undefined){ options.attribute = false }
      legacyProperty(options, protoOrDescriptor as Object, name!)
    }
  }

export function attr(options?: Omit<PropertyDefine,"attribute">) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (protoOrDescriptor: Object , name?: PropertyKey): any =>{
      legacyProperty({attribute:true, ...options}, protoOrDescriptor as Object, name!)
    }
}

