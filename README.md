### 什么是viewding?

**浏览器原生的声明式、响应性和组件化的开发工具库。**

- **浏览器原生**。viewding仅仅使用浏览器内置的js/html/css所提供的功能来操作DOM。
  - 直接使用HTML DOM API。不引入虚拟DOM等技术。
  - 不引入特殊的语法规范和文件格式。免去编译和转换，不需要特殊的第三方语法，如JSX，不需要特殊格式的文件，如.vue、.svelte等。
  - 直接使用WebComponent。不引入专用的组件技术。
- **声明式、响应性和组件化**。viewding完整支持声明式、响应性和组件化的开发范式。
- **开发工具库**。viewding不谋求构建一个前端开发的框架，进而让开发者遵从框架的约定来填充代码。viewding只是在现代Web规范和标准的基础上，借鉴和整合已经成功使用的技术，以代码库的形式提供给程序员使用。相比开发框架，程序员按需调用代码库中的代码是最简单直观和明了的方式，可以获得最大的灵活度和可控性。

> viewding，发音为 /vju:diŋ/，取意为一颗组装页面视图（英文page**view**）的螺丝钉（汉语拼音luosi**ding**）。

### Hello，Viewding！

下面是一个基本的示例：

```js
import { html, mount, reactiveRef } from 'viewding'

const counter = reactiveRef(0)

function template(){
    return html`<button @click=${()=>counter.value = counter.value + 1} >CLICK Times: ${counter.value}</button>`
}

mount("#app",template)
```

在这个示例中展示了viewding的核心功能：

- 声明式渲染：用js的字面量模板语法声明了html，在声明的html \<button>标签中用表达式声明了button上要显示的文本，以及点击时要执行的函数。
- 响应性：viewding自动跟踪counter中数据的变化，当数据变化时自动更新DOM。

### 动机

前端开发框架已经有了react，vue，svelte，lit, angular等等众多的选择，为什么还要编写viewding？

一个直接的原因就是我觉得这些框架还是太复杂了，虽然一些框架都号称简单、轻量，但是或许是编写helloworld是简单的，实际在项目中用起来，总是要学习不少东西。

另外，不考虑IE兼容性后，现在react、vue等开发框架为了提供声明式、响应性和组件化开发能力，毫无例外的都引入了各种技术和概念，然而，真的需要这么做吗？

借助chrome、edge等现代浏览器中js、css和html5的新特性，似乎应该有更简单的实现方式，为什么不试一试呢？

#### 站在巨人的肩膀上

viewding没有从头发明轮子，而是整合了vue中的响应式系统、lit中的lit-html模板渲染以及WebCompnent自定义元素等技术，如下：

**1. @viewding/reactivity**

基于@vue/reactivity构建了一个仅包含部分功能的版本，https://www.npmjs.com/package/@viewding/reactivity https://github.com/viewding/vuejs-core。去掉了@vue/reactvivty中ref.ts, computed.ts和deferredComputed.ts等文件。

> npm package: https://www.npmjs.com/package/@vue/reactivity
> source code: https://github.com/vuejs/core/tree/main/packages/reactivity

**2. @viewding/lit-html**

https://www.npmjs.com/package/@viewding/lit-html

**3. webcomponent**

https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components

