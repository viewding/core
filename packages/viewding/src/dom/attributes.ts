import { isNumeric } from "../utils";

declare global {
    export interface Element{
        $attr(attrs: string): string | null
        $attr(attrs: string, value: string): this
        $attr(attrs: Record<string, string>): Element
        $removeAttr(attrs: string): Element
        $toggleAttr(attrs: string, force?:boolean): Element

        $addClass(cls: string): Element
        $removeClass(classes?: string): Element
        $hasClass(cls: string): boolean
        $toggleClass(classes: string, force?: boolean): Element
    }
}

// 读取属性值，在HTML元素上调用时参数会先转换成小写形式，如果属性不存在那么返回null。
function attr(this: Element, attr: string): string | null

// 设置指定元素上的某个属性值。如果属性已经存在，则更新该值；否则，使用指定的名称和值添加一个新的属性。
// 当在 HTML 文档中的 HTML 元素上调用 setAttribute() 方法时，该方法会将其属性名称（attribute name）参数小写化。
// value只能取值字符串，不能取值null, 当要删除属性时应该使用removeAttr方法来代替e.setAttribute(attr,null)，由于setAttribute将指定的值转换为字符串，因此指定 null 不一定能删除属性或将其值设置为null，而是将属性的值设置为字符串“null”。
// Boolean attributes）只要出现在元素上就会被认为是 true ，无论它的值是什么; 一般来说，你应该将 value 设置为空字符串 ("") 。(一些人使用这个属性的名称作为值; 这不会出现什么问题，但这是不规范的).
function attr(this: Element, attr: string, value: string): Element

// 一次性设置多个attribute的值。
function attr(this: Element, attr: Record<string, string>): Element


// 仅仅是DOM Api中Element的getAttribute和setAttribute的封装，不对布尔类型的attribute做特殊处理。
// API摘要如下：
// getAttribute() 返回元素上一个指定的属性值。如果指定的属性不存在，则返回 null 或 "" （空字符串）。
// 当在被标记为 HTML 文档中的一个 HTML 元素上调用此方法时，getAttribute() 会先将其参数转换为小写形式。

// 当指定的属性不存在于元素上时，所有浏览器（Firefox、Internet Explorer、Opera 最新版本、Safari、Konqueror 以及 iCab 等等）都返回 null，这也是当前 DOM 规范草案规定的。然而，旧的 DOM 3 Core specification 认为此时正确的返回值应该是一个空字符串，一些 DOM 实现环境实现了该行为（behavior）。在 XUL (Gecko) 中，getAttribute 的实现遵从 DOM 3 Core specification，返回一个空字符串。因此，如果一个属性可能不存在于指定的元素上，在调用 getAttribute() 之前，你应该使用 element.hasAttribute() 来检测该属性是否存在。
function attr(
    this: Element,
    attr: string | Record<string, string>,
    value?: string
) {
    if (typeof attr === 'string') {
        // Get Attribute
        if (value === undefined) {
            return this.hasAttribute(attr)?this.getAttribute(attr):null
        }
        // Set Attribute
        this.setAttribute(attr, value)
        return this
    }

    for (const key in attr) {
        this.setAttribute(key, attr[key])
    }
    return this
}

Element.prototype.$attr = attr

// 移除指定的Attriute，用用空格分隔，一次可以指定多个Attribute名称。
// 如果指定的Attribute不存在，则自动忽略不会生成错误。
Element.prototype.$removeAttr = function (this: Element, attrs: string) {
    const attrArray = attrs.split(' ')
    for (const attr of attrArray) {
        this.removeAttribute(attr)
    }
    return this
}

// 仅仅是转调用dom api中的toggleAttribute(), 不过返回的是this。
Element.prototype.$toggleAttr = function(this:Element, attr:string, force?:boolean){
    this.toggleAttribute(attr,force)
    return this
}

Element.prototype.$addClass = function (this: Element, cls: string) {
    return this.$toggleClass(cls, true)
}

// Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
// 返回this对象。
Element.prototype.$removeClass = function (this: Element, cls: string) {
    return this.$toggleClass(cls, false)
}

// Dom中只要有一个元素包含指定的class名称就返回true，不特定第一个元素或者要求所有Dom中的元素。
Element.prototype.$hasClass = function (this: Element, cls: string) {
    return this.classList.contains(cls)
}

// Add or remove one or more classes from each element in the set of matched elements,
// depending on either the class's presence or the value of the state argument.
// cls:
// force: 强制,取值为 undefined，true false。
Element.prototype.$toggleClass = function (this: Element, cls: string, force?: boolean) {
    const classes = cls.split(' ')
    for (const c of classes) {
        this.classList.toggle(c, force)
    }
    return this
}

declare global {
    interface HTMLElement {
        $css(prop: string): string;
        $css(prop: string, value: number | string): this;
        $css(props: Record<string, number | string>): this;
        $computeCss(): CSSStyleDeclaration;
        $computeCss(prop: string, pseudoElt?: string | null): string;

        $width(): number;
        $width(value: number | string): this;
        $height(): number;
        $height(value: number | string): this;

        $innerWidth(): number;
        $innerHeight(): number;
        $outerWidth(includeMargins?: boolean): number;
        $outerHeight(includeMargins?: boolean): number;
    }
}

const dashAlphaRe = /-([a-z])/g

export function camelCase(str: string): string {
    return str.replace(dashAlphaRe, (match: string, letter: string) =>
        letter.toUpperCase()
    )
}

// 存放浏览器的本地化css属性名称，如wekit- moz-和ms-等前缀。
const prefixedProps: { [prop: string]: string } = {}
const vendorsPrefixes = ['webkit', 'moz', 'ms']
const { style: divStyle } = document.createElement('div')

// 获取带前缀的浏览器本地化css属性名称。
export function getPrefixedSytle(prop: string): string {
    if (prop.startsWith('--')) return prop

    // 如果没有带前缀的浏览器本地化css属性名称，那么生成并缓存本地化名称
    if (!prefixedProps[prop]) {
        const propCC = camelCase(prop)
        const propUC = `${propCC[0].toUpperCase()}${propCC.slice(1)}`
        // 如果 propCC='abc',则propUC='Abc', props='abc webkitAbc mozAbc msAbc'.split(' ')
        const props = `${propCC} ${vendorsPrefixes.join(
            `${propUC} `
        )}${propUC}`.split(' ')

        for (const p of props) {
            if (p in divStyle) {
                prefixedProps[prop] = p
                break
            }
        }
    }
    return prefixedProps[prop]
}

// 不是长度的数值属性，如果是长度属性而且不带后缀那么表示单位是px。
const numericProps: { [prop: string]: true | undefined } = {
    animationIterationCount: true,
    columnCount: true,
    flexGrow: true,
    flexShrink: true,
    fontWeight: true,
    gridArea: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnStart: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowStart: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    widows: true,
    zIndex: true,
};

function getSuffixedValue(prop: string, value: number | string): string {
    return !prop.startsWith("--") && !numericProps[prop] && isNumeric(value)
        ? `${value}px`
        : value.toString();
}

function css(this: HTMLElement, prop: string): string;
function css(
    this: HTMLElement,
    prop: string,
    value: number | string
): HTMLElement;
function css(
    this: HTMLElement,
    prop: Record<string, number | string>
): HTMLElement;
function css(
    this: HTMLElement,
    prop: string | Record<string, number | string>,
    value?: number | string
) {
    if (typeof prop === "string") {
        // Get
        prop = getPrefixedSytle(prop);
        if (value === undefined) return this.style.getPropertyValue(prop);

        // Set
        value = getSuffixedValue(prop, value);
        this.style.setProperty(prop, value);
    } else {
        for (const key of Object.keys(prop)) {
            value = getSuffixedValue(key, prop[key]);
            this.style.setProperty(key, value);
        }
    }
    return this;
}

HTMLElement.prototype.$css = css;

function computeCss(this: HTMLElement): CSSStyleDeclaration;
function computeCss(
    this: HTMLElement,
    prop: string,
    pseudoElt?: string | null
): string;
function computeCss(
    this: HTMLElement,
    prop?: string,
    pseudoElt?: string | null
) {
    const style = window.getComputedStyle(this, pseudoElt);
    if (prop === undefined) return style;
    return style.getPropertyValue(getPrefixedSytle(prop));
}

HTMLElement.prototype.$computeCss = computeCss;

function getExtraSpace(ele: HTMLElement, xAxis?: boolean): number {
    return (
        parseInt(ele.$computeCss(`border${xAxis ? "Left" : "Top"}Width`), 10) +
        parseInt(ele.$computeCss(`padding${xAxis ? "Left" : "Top"}`), 10) +
        parseInt(ele.$computeCss(`padding${xAxis ? "Right" : "Bottom"}`), 10) +
        parseInt(
            ele.$computeCss(`border${xAxis ? "Right" : "Bottom"}Width`),
            10
        )
    );
}

function dimension(
    this: HTMLElement,
    prop: "Width" | "Height",
    value?: number | string
): HTMLElement | number;
function dimension(
    this: HTMLElement,
    prop: "Width" | "Height",
    value?: number | string
) {
    const propLC =  prop === "Width" ? "width" : "height";
    const xAxis = prop === "Width" ? true : false;

    // Get, 当value为undefined时读取宽高
    if (value === undefined) {
        return this.getBoundingClientRect()[propLC] - getExtraSpace(this, xAxis);
    }

    // Set，当提供了value参数时，设置元素的宽高。
    const valueNumber = typeof value === "string" ? parseInt(value, 10) : value;
    const boxSizing = this.$computeCss("boxSizing");
    this.style[propLC] = getSuffixedValue(
        propLC,
        valueNumber +
            (boxSizing === "border-box" ? getExtraSpace(this, xAxis) : 0)
    )

    return this;
}

function width(this: HTMLElement): number;
function width(this: HTMLElement, value: number | string): HTMLElement;
function width(
    this: HTMLElement,
    value?: number | string
): number | HTMLElement {
    if (typeof value === "string") {
        dimension.call(this, "Width", value);
    }
    return dimension.call(this, "Width");
}

HTMLElement.prototype.$width = width;

function height(this: HTMLElement): number;
function height(this: HTMLElement, value: number | string): HTMLElement;
function height(
    this: HTMLElement,
    value?: number | string
): number | HTMLElement {
    if (typeof value === "string") {
        dimension.call(this, "Height", value);
    }
    return dimension.call(this, "Height");
}

HTMLElement.prototype.$height = height;

function dimensionBox(prop: "Width" | "Height", outer?: boolean) {
    const name = `${outer ? "outer" : "inner"}${prop}`;
    return function (this: HTMLElement, includeMargins?: boolean) {
        return (
            this[`${outer ? "offset" : "client"}${prop}`] +
            (includeMargins && outer
                ? parseInt(
                      this.$computeCss(
                          `margin${prop === "Height" ? "Top" : "Left"}`
                      ),
                      10
                  ) +
                  parseInt(
                      this.$computeCss(
                          `margin${prop === "Height" ? "Bottom" : "Right"}`
                      ),
                      10
                  )
                : 0)
        );
    };
}

HTMLElement.prototype.$innerWidth = dimensionBox("Width");
HTMLElement.prototype.$outerWidth = dimensionBox("Width", true);
HTMLElement.prototype.$innerHeight = dimensionBox("Height");
HTMLElement.prototype.$outerHeight = dimensionBox("Height", true);

// 关于位置、尺寸和滚动，dom api中已经提供了丰富的接口：
// e.offsetParent, e.offsetTop, e.offsetLeft, e.offsetWidth, e.offsetHeight
// e.getClientRects(), e.getBoundingClientRect()
// e.scroll()或e.scrollTo(),  e.scrollBy(), e.scrollIntoView()
// e.clientLeft, e.clientTop, e.clientWidth, e.clientHeight
// window: scrollX或pageXOffset, scrollY或pageYOffset
// window: scroll()或scrollTo(), scrollBy()

// 非标准化的：documentHTMLElement.scroll..., document.body.scroll...
