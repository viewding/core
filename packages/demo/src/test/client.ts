import { html, mount } from 'viewding';
import browserslist from 'browserslist';

import * as lcss from 'lightningcss-wasm'

await lcss.default("/lightningcss_node.wasm")

const message='Hello World!'
let targets = lcss.browserslistToTargets(browserslist());
  
let src=`.foo {
    color: blue;
  
    & & .bar {
      color: red;
    }
  }
  @custom-media --modern (color), (hover);

@media (--modern) and (width > 1024px) {
  .a { color: green; }
}
.logo {
    background: image-set(url(logo.png) 2x, url(logo.png) 1x);
  }
  
  `
  let { code, map } = lcss.transform({
    filename: 'style.css',
    code: new TextEncoder().encode(src),
    drafts: {
      nesting: true
    },
    minify:true,
    targets
  });
  
function template(){
    return html`<h1>${new TextDecoder().decode(code)}</h1>`
}

mount(document.body,template)
