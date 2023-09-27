/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// Allows minifiers to rename references to globalThis
const global = globalThis;
/**
 * Useful for visualizing and logging insights into what the Lit template system is doing.
 *
 * Compiled out of prod mode builds.
 */
const debugLogEvent = (event) => {
        const shouldEmit = global
            .emitLitDebugLogEvents;
        if (!shouldEmit) {
            return;
        }
        global.dispatchEvent(new CustomEvent('lit-debug', {
            detail: event,
        }));
    }
    ;
// Used for connecting beginRender and endRender events when there are nested
// renders when errors are thrown preventing an endRender event from being
// called.
let debugLogRenderId = 0;
let issueWarning;
{
    global.litIssuedWarnings ??= new Set();
    // Issue a warning, if we haven't already.
    issueWarning = (code, warning) => {
        warning += code
            ? ` See https://lit.dev/msg/${code} for more information.`
            : '';
        if (!global.litIssuedWarnings.has(warning)) {
            console.warn(warning);
            global.litIssuedWarnings.add(warning);
        }
    };
    issueWarning('dev-mode', `Lit is in dev mode. Not recommended for production!`);
}
// const wrap =
//   ENABLE_SHADYDOM_NOPATCH &&
//   global.ShadyDOM?.inUse &&
//   global.ShadyDOM?.noPatch === true
//     ? (global.ShadyDOM!.wrap as <T extends Node>(node: T) => T)
//     : <T extends Node>(node: T) => node;
const wrap$1 = (node) => node; // viewding不再支持shadydom的兼容性。
const trustedTypes = global.trustedTypes;
/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = trustedTypes
    ? trustedTypes.createPolicy('lit-html', {
        createHTML: (s) => s,
    })
    : undefined;
const identityFunction = (value) => value;
const noopSanitizer = (_node, _name, _type) => identityFunction;
/** Sets the global sanitizer factory. */
const setSanitizer = (newSanitizer) => {
    if (sanitizerFactoryInternal !== noopSanitizer) {
        throw new Error(`Attempted to overwrite existing lit-html security policy.` +
            ` setSanitizeDOMValueFactory should be called at most once.`);
    }
    sanitizerFactoryInternal = newSanitizer;
};
/**
 * Only used in internal tests, not a part of the public API.
 */
const _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
    sanitizerFactoryInternal = noopSanitizer;
};
const createSanitizer = (node, name, type) => {
    return sanitizerFactoryInternal(node, name, type);
};
// Added to an attribute name to mark the attribute as bound so we can find
// it easily.
const boundAttributeSuffix = '$lit$';
// This marker is used in many syntactic positions in HTML, so it must be
// a valid element name and attribute name. We don't support dynamic names (yet)
// but this at least ensures that the parse tree is closer to the template
// intention.
const marker = `lit$${String(Math.random()).slice(9)}$`;
// String used to tell if a comment is a marker comment
const markerMatch = '?' + marker;
// Text used to insert a comment marker node. We use processing instruction
// syntax because it's slightly smaller, but parses as a comment node.
const nodeMarker = `<${markerMatch}>`;
const d$1 = document;
// Creates a dynamic marker. We never have to search for these in the DOM.
const createMarker$1 = () => d$1.createComment('');
const isPrimitive$1 = (value) => value === null || (typeof value != 'object' && typeof value != 'function');
const isArray = Array.isArray;
const isIterable = (value) => isArray(value) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof value?.[Symbol.iterator] === 'function';
const SPACE_CHAR = `[ \t\n\f\r]`;
const ATTR_VALUE_CHAR = `[^ \t\n\f\r"'\`<>=]`;
const NAME_CHAR = `[^\\s"'>=/]`;
// These regexes represent the five parsing states that we care about in the
// Template's HTML scanner. They match the *end* of the state they're named
// after.
// Depending on the match, we transition to a new state. If there's no match,
// we stay in the same state.
// Note that the regexes are stateful. We utilize lastIndex and sync it
// across the multiple regexes used. In addition to the five regexes below
// we also dynamically create a regex to find the matching end tags for raw
// text elements.
/**
 * End of text is: `<` followed by:
 *   (comment start) or (tag) or (dynamic tag binding)
 */
const textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
const COMMENT_START = 1;
const TAG_NAME = 2;
const DYNAMIC_TAG_NAME = 3;
const commentEndRegex = /-->/g;
/**
 * Comments not started with <!--, like </{, can be ended by a single `>`
 */
const comment2EndRegex = />/g;
/**
 * The tagEnd regex matches the end of the "inside an opening" tag syntax
 * position. It either matches a `>`, an attribute-like sequence, or the end
 * of the string after a space (attribute-name position ending).
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \t\n\f\r" are HTML space characters:
 * https://infra.spec.whatwg.org/#ascii-whitespace
 *
 * So an attribute is:
 *  * The name: any character except a whitespace character, ("), ('), ">",
 *    "=", or "/". Note: this is different from the HTML spec which also excludes control characters.
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const tagEndRegex = new RegExp(`>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`, 'g');
const ENTIRE_MATCH = 0;
const ATTRIBUTE_NAME = 1;
const SPACES_AND_EQUALS = 2;
const QUOTE_CHAR = 3;
const singleQuoteAttrEndRegex = /'/g;
const doubleQuoteAttrEndRegex = /"/g;
/**
 * Matches the raw text elements.
 *
 * Comments are not parsed within raw text elements, so we need to search their
 * text content for marker strings.
 */
const rawTextElement = /^(?:script|style|textarea|title)$/i;
/** TemplateResult types */
const HTML_RESULT$1 = 1;
const SVG_RESULT$1 = 2;
// TemplatePart types
// IMPORTANT: these must match the values in PartType
const ATTRIBUTE_PART = 1;
const CHILD_PART = 2;
const PROPERTY_PART = 3;
const BOOLEAN_ATTRIBUTE_PART = 4;
const EVENT_PART = 5;
const ELEMENT_PART = 6;
const COMMENT_PART = 7;
/**
 * Generates a template literal tag function that returns a TemplateResult with
 * the given result type.
 */
const tag = (type) => (strings, ...values) => {
    // Warn against templates octal escape sequences
    // We do this here rather than in render so that the warning is closer to the
    // template definition.
    if (strings.some((s) => s === undefined)) {
        console.warn('Some template strings are undefined.\n' +
            'This is probably caused by illegal octal escape sequences.');
    }
    return {
        // This property needs to remain unminified.
        ['_$litType$']: type,
        strings,
        values,
    };
};
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * ```ts
 * const header = (title: string) => html`<h1>${title}</h1>`;
 * ```
 *
 * The `html` tag returns a description of the DOM to render as a value. It is
 * lazy, meaning no work is done until the template is rendered. When rendering,
 * if a template comes from the same expression as a previously rendered result,
 * it's efficiently updated instead of replaced.
 */
const html = tag(HTML_RESULT$1);
/**
 * Interprets a template literal as an SVG fragment that can efficiently
 * render to and update a container.
 *
 * ```ts
 * const rect = svg`<rect width="10" height="10"></rect>`;
 *
 * const myImage = html`
 *   <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
 *     ${rect}
 *   </svg>`;
 * ```
 *
 * The `svg` *tag function* should only be used for SVG fragments, or elements
 * that would be contained **inside** an `<svg>` HTML element. A common error is
 * placing an `<svg>` *element* in a template tagged with the `svg` tag
 * function. The `<svg>` element is an HTML element and should be used within a
 * template tagged with the {@linkcode html} tag function.
 *
 * In LitElement usage, it's invalid to return an SVG fragment from the
 * `render()` method, as the SVG fragment will be contained within the element's
 * shadow root and thus cannot be used within an `<svg>` HTML element.
 */
const svg = tag(SVG_RESULT$1);
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = Symbol.for('lit-noChange');
/**
 * A sentinel value that signals a ChildPart to fully clear its content.
 *
 * ```ts
 * const button = html`${
 *  user.isAdmin
 *    ? html`<button>DELETE</button>`
 *    : nothing
 * }`;
 * ```
 *
 * Prefer using `nothing` over other falsy values as it provides a consistent
 * behavior between various expression binding contexts.
 *
 * In child expressions, `undefined`, `null`, `''`, and `nothing` all behave the
 * same and render no nodes. In attribute expressions, `nothing` _removes_ the
 * attribute, while `undefined` and `null` will render an empty string. In
 * property expressions `nothing` becomes `undefined`.
 */
const nothing = Symbol.for('lit-nothing');
/**
 * The cache of prepared templates, keyed by the tagged TemplateStringsArray
 * and _not_ accounting for the specific template tag used. This means that
 * template tags cannot be dynamic - the must statically be one of html, svg,
 * or attr. This restriction simplifies the cache lookup, which is on the hot
 * path for rendering.
 */
const templateCache = new WeakMap();
const walker = d$1.createTreeWalker(d$1, 129 /* NodeFilter.SHOW_{ELEMENT|COMMENT} */);
let sanitizerFactoryInternal = noopSanitizer;
/**
 * Returns an HTML string for the given TemplateStringsArray and result type
 * (HTML or SVG), along with the case-sensitive bound attribute names in
 * template order. The HTML contains comment markers denoting the `ChildPart`s
 * and suffixes on bound attributes denoting the `AttributeParts`.
 *
 * @param strings template strings array
 * @param type HTML or SVG
 * @return Array containing `[html, attrNames]` (array returned for terseness,
 *     to avoid object fields since this code is shared with non-minified SSR
 *     code)
 */
const getTemplateHtml = (strings, type) => {
    // Insert makers into the template HTML to represent the position of
    // bindings. The following code scans the template strings to determine the
    // syntactic position of the bindings. They can be in text position, where
    // we insert an HTML comment, attribute value position, where we insert a
    // sentinel string and re-write the attribute name, or inside a tag where
    // we insert the sentinel string.
    const l = strings.length - 1;
    // Stores the case-sensitive bound attribute names in the order of their
    // parts. ElementParts are also reflected in this array as undefined
    // rather than a string, to disambiguate from attribute bindings.
    const attrNames = [];
    let html = type === SVG_RESULT$1 ? '<svg>' : '';
    // When we're inside a raw text tag (not it's text content), the regex
    // will still be tagRegex so we can find attributes, but will switch to
    // this regex when the tag ends.
    let rawTextEndRegex;
    // The current parsing state, represented as a reference to one of the
    // regexes
    let regex = textEndRegex;
    for (let i = 0; i < l; i++) {
        const s = strings[i];
        // The index of the end of the last attribute name. When this is
        // positive at end of a string, it means we're in an attribute value
        // position and need to rewrite the attribute name.
        // We also use a special value of -2 to indicate that we encountered
        // the end of a string in attribute name position.
        let attrNameEndIndex = -1;
        let attrName;
        let lastIndex = 0;
        let match;
        // The conditions in this loop handle the current parse state, and the
        // assignments to the `regex` variable are the state transitions.
        while (lastIndex < s.length) {
            // Make sure we start searching from where we previously left off
            regex.lastIndex = lastIndex;
            match = regex.exec(s);
            if (match === null) {
                break;
            }
            lastIndex = regex.lastIndex;
            if (regex === textEndRegex) {
                if (match[COMMENT_START] === '!--') {
                    regex = commentEndRegex;
                }
                else if (match[COMMENT_START] !== undefined) {
                    // We started a weird comment, like </{
                    regex = comment2EndRegex;
                }
                else if (match[TAG_NAME] !== undefined) {
                    if (rawTextElement.test(match[TAG_NAME])) {
                        // Record if we encounter a raw-text element. We'll switch to
                        // this regex at the end of the tag.
                        rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, 'g');
                    }
                    regex = tagEndRegex;
                }
                else if (match[DYNAMIC_TAG_NAME] !== undefined) {
                    {
                        throw new Error('Bindings in tag names are not supported. Please use static templates instead. ' +
                            'See https://lit.dev/docs/templates/expressions/#static-expressions');
                    }
                }
            }
            else if (regex === tagEndRegex) {
                if (match[ENTIRE_MATCH] === '>') {
                    // End of a tag. If we had started a raw-text element, use that
                    // regex
                    regex = rawTextEndRegex ?? textEndRegex;
                    // We may be ending an unquoted attribute value, so make sure we
                    // clear any pending attrNameEndIndex
                    attrNameEndIndex = -1;
                }
                else if (match[ATTRIBUTE_NAME] === undefined) {
                    // Attribute name position
                    attrNameEndIndex = -2;
                }
                else {
                    attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length;
                    attrName = match[ATTRIBUTE_NAME];
                    regex =
                        match[QUOTE_CHAR] === undefined
                            ? tagEndRegex
                            : match[QUOTE_CHAR] === '"'
                                ? doubleQuoteAttrEndRegex
                                : singleQuoteAttrEndRegex;
                }
            }
            else if (regex === doubleQuoteAttrEndRegex ||
                regex === singleQuoteAttrEndRegex) {
                regex = tagEndRegex;
            }
            else if (regex === commentEndRegex || regex === comment2EndRegex) {
                regex = textEndRegex;
            }
            else {
                // Not one of the five state regexes, so it must be the dynamically
                // created raw text regex and we're at the close of that element.
                regex = tagEndRegex;
                rawTextEndRegex = undefined;
            }
        }
        {
            // If we have a attrNameEndIndex, which indicates that we should
            // rewrite the attribute name, assert that we're in a valid attribute
            // position - either in a tag, or a quoted attribute value.
            console.assert(attrNameEndIndex === -1 ||
                regex === tagEndRegex ||
                regex === singleQuoteAttrEndRegex ||
                regex === doubleQuoteAttrEndRegex, 'unexpected parse state B');
        }
        // We have four cases:
        //  1. We're in text position, and not in a raw text element
        //     (regex === textEndRegex): insert a comment marker.
        //  2. We have a non-negative attrNameEndIndex which means we need to
        //     rewrite the attribute name to add a bound attribute suffix.
        //  3. We're at the non-first binding in a multi-binding attribute, use a
        //     plain marker.
        //  4. We're somewhere else inside the tag. If we're in attribute name
        //     position (attrNameEndIndex === -2), add a sequential suffix to
        //     generate a unique attribute name.
        // Detect a binding next to self-closing tag end and insert a space to
        // separate the marker from the tag end:
        const end = regex === tagEndRegex && strings[i + 1].startsWith('/>') ? ' ' : '';
        html +=
            regex === textEndRegex
                ? s + nodeMarker
                : attrNameEndIndex >= 0
                    ? (attrNames.push(attrName),
                        s.slice(0, attrNameEndIndex) +
                            boundAttributeSuffix +
                            s.slice(attrNameEndIndex)) +
                        marker +
                        end
                    : s + marker + (attrNameEndIndex === -2 ? i : end);
    }
    const htmlResult = html + (strings[l] || '<?>') + (type === SVG_RESULT$1 ? '</svg>' : '');
    // A security check to prevent spoofing of Lit template results.
    // In the future, we may be able to replace this with Array.isTemplateObject,
    // though we might need to make that check inside of the html and svg
    // functions, because precompiled templates don't come in as
    // TemplateStringArray objects.
    if (!Array.isArray(strings) || !strings.hasOwnProperty('raw')) {
        let message = 'invalid template strings array';
        {
            message = `
          Internal Error: expected template strings to be an array
          with a 'raw' field. Faking a template strings array by
          calling html or svg like an ordinary function is effectively
          the same as calling unsafeHtml and can lead to major security
          issues, e.g. opening your code up to XSS attacks.

          If you're using the html or svg tagged template functions normally
          and still seeing this error, please file a bug at
          https://github.com/lit/lit/issues/new?template=bug_report.md
          and include information about your build tooling, if any.
        `
                .trim()
                .replace(/\n */g, '\n');
        }
        throw new Error(message);
    }
    // Returned as an array for terseness
    return [
        policy !== undefined
            ? policy.createHTML(htmlResult)
            : htmlResult,
        attrNames,
    ];
};
class Template {
    constructor(
    // This property needs to remain unminified.
    { strings, ['_$litType$']: type }, options) {
        this.parts = [];
        let node;
        let nodeIndex = 0;
        let attrNameIndex = 0;
        const partCount = strings.length - 1;
        const parts = this.parts;
        // Create template element
        const [html, attrNames] = getTemplateHtml(strings, type);
        this.el = Template.createElement(html, options);
        walker.currentNode = this.el.content;
        // Re-parent SVG nodes into template root
        if (type === SVG_RESULT$1) {
            const svgElement = this.el.content.firstChild;
            svgElement.replaceWith(...svgElement.childNodes);
        }
        // Walk the template to find binding markers and create TemplateParts
        while ((node = walker.nextNode()) !== null && parts.length < partCount) {
            if (node.nodeType === 1) {
                {
                    const tag = node.localName;
                    // Warn if `textarea` includes an expression and throw if `template`
                    // does since these are not supported. We do this by checking
                    // innerHTML for anything that looks like a marker. This catches
                    // cases like bindings in textarea there markers turn into text nodes.
                    if (/^(?:textarea|template)$/i.test(tag) &&
                        node.innerHTML.includes(marker)) {
                        const m = `Expressions are not supported inside \`${tag}\` ` +
                            `elements. See https://lit.dev/msg/expression-in-${tag} for more ` +
                            `information.`;
                        if (tag === 'template') {
                            throw new Error(m);
                        }
                        else
                            issueWarning('', m);
                    }
                }
                // TODO (justinfagnani): for attempted dynamic tag names, we don't
                // increment the bindingIndex, and it'll be off by 1 in the element
                // and off by two after it.
                if (node.hasAttributes()) {
                    for (const name of node.getAttributeNames()) {
                        if (name.endsWith(boundAttributeSuffix)) {
                            const realName = attrNames[attrNameIndex++];
                            const value = node.getAttribute(name);
                            const statics = value.split(marker);
                            const m = /([.?@])?(.*)/.exec(realName);
                            parts.push({
                                type: ATTRIBUTE_PART,
                                index: nodeIndex,
                                name: m[2],
                                strings: statics,
                                ctor: m[1] === '.'
                                    ? PropertyPart
                                    : m[1] === '?'
                                        ? BooleanAttributePart
                                        : m[1] === '@'
                                            ? EventPart
                                            : AttributePart,
                            });
                            node.removeAttribute(name);
                        }
                        else if (name.startsWith(marker)) {
                            parts.push({
                                type: ELEMENT_PART,
                                index: nodeIndex,
                            });
                            node.removeAttribute(name);
                        }
                    }
                }
                // TODO (justinfagnani): benchmark the regex against testing for each
                // of the 3 raw text element names.
                if (rawTextElement.test(node.tagName)) {
                    // For raw text elements we need to split the text content on
                    // markers, create a Text node for each segment, and create
                    // a TemplatePart for each marker.
                    const strings = node.textContent.split(marker);
                    const lastIndex = strings.length - 1;
                    if (lastIndex > 0) {
                        node.textContent = trustedTypes
                            ? trustedTypes.emptyScript
                            : '';
                        // Generate a new text node for each literal section
                        // These nodes are also used as the markers for node parts
                        // We can't use empty text nodes as markers because they're
                        // normalized when cloning in IE (could simplify when
                        // IE is no longer supported)
                        for (let i = 0; i < lastIndex; i++) {
                            node.append(strings[i], createMarker$1());
                            // Walk past the marker node we just added
                            walker.nextNode();
                            parts.push({ type: CHILD_PART, index: ++nodeIndex });
                        }
                        // Note because this marker is added after the walker's current
                        // node, it will be walked to in the outer loop (and ignored), so
                        // we don't need to adjust nodeIndex here
                        node.append(strings[lastIndex], createMarker$1());
                    }
                }
            }
            else if (node.nodeType === 8) {
                const data = node.data;
                if (data === markerMatch) {
                    parts.push({ type: CHILD_PART, index: nodeIndex });
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        parts.push({ type: COMMENT_PART, index: nodeIndex });
                        // Move to the end of the match
                        i += marker.length - 1;
                    }
                }
            }
            nodeIndex++;
        }
        // We could set walker.currentNode to another node here to prevent a memory
        // leak, but every time we prepare a template, we immediately render it
        // and re-use the walker in new TemplateInstance._clone().
        debugLogEvent?.({
            kind: 'template prep',
            template: this,
            clonableTemplate: this.el,
            parts: this.parts,
            strings,
        });
    }
    // Overridden via `litHtmlPolyfillSupport` to provide platform support.
    /** @nocollapse */
    static createElement(html, _options) {
        const el = d$1.createElement('template');
        el.innerHTML = html;
        return el;
    }
}
function resolveDirective(part, value, parent = part, attributeIndex) {
    // Bail early if the value is explicitly noChange. Note, this means any
    // nested directive is still attached and is not run.
    if (value === noChange) {
        return value;
    }
    let currentDirective = attributeIndex !== undefined
        ? parent.__directives?.[attributeIndex]
        : parent.__directive;
    const nextDirectiveConstructor = isPrimitive$1(value)
        ? undefined
        : // This property needs to remain unminified.
            value['_$litDirective$'];
    if (currentDirective?.constructor !== nextDirectiveConstructor) {
        // This property needs to remain unminified.
        currentDirective?.['_$notifyDirectiveConnectionChanged']?.(false);
        if (nextDirectiveConstructor === undefined) {
            currentDirective = undefined;
        }
        else {
            currentDirective = new nextDirectiveConstructor(part);
            currentDirective._$initialize(part, parent, attributeIndex);
        }
        if (attributeIndex !== undefined) {
            (parent.__directives ??= [])[attributeIndex] =
                currentDirective;
        }
        else {
            parent.__directive = currentDirective;
        }
    }
    if (currentDirective !== undefined) {
        value = resolveDirective(part, currentDirective._$resolve(part, value.values), currentDirective, attributeIndex);
    }
    return value;
}
/**
 * An updateable instance of a Template. Holds references to the Parts used to
 * update the template instance.
 */
class TemplateInstance {
    constructor(template, parent) {
        this._$parts = [];
        /** @internal */
        this._$disconnectableChildren = undefined;
        this._$template = template;
        this._$parent = parent;
    }
    // Called by ChildPart parentNode getter
    get parentNode() {
        return this._$parent.parentNode;
    }
    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }
    // This method is separate from the constructor because we need to return a
    // DocumentFragment and we don't want to hold onto it with an instance field.
    _clone(options) {
        const { el: { content }, parts: parts, } = this._$template;
        const fragment = (options?.creationScope ?? d$1).importNode(content, true);
        walker.currentNode = fragment;
        let node = walker.nextNode();
        let nodeIndex = 0;
        let partIndex = 0;
        let templatePart = parts[0];
        while (templatePart !== undefined) {
            if (nodeIndex === templatePart.index) {
                let part;
                if (templatePart.type === CHILD_PART) {
                    part = new ChildPart$1(node, node.nextSibling, this, options);
                }
                else if (templatePart.type === ATTRIBUTE_PART) {
                    part = new templatePart.ctor(node, templatePart.name, templatePart.strings, this, options);
                }
                else if (templatePart.type === ELEMENT_PART) {
                    part = new ElementPart(node, this, options);
                }
                this._$parts.push(part);
                templatePart = parts[++partIndex];
            }
            if (nodeIndex !== templatePart?.index) {
                node = walker.nextNode();
                nodeIndex++;
            }
        }
        // We need to set the currentNode away from the cloned tree so that we
        // don't hold onto the tree even if the tree is detached and should be
        // freed.
        walker.currentNode = d$1;
        return fragment;
    }
    _update(values) {
        let i = 0;
        for (const part of this._$parts) {
            if (part !== undefined) {
                debugLogEvent?.({
                    kind: 'set part',
                    part,
                    value: values[i],
                    valueIndex: i,
                    values,
                    templateInstance: this,
                });
                if (part.strings !== undefined) {
                    part._$setValue(values, part, i);
                    // The number of values the part consumes is part.strings.length - 1
                    // since values are in between template spans. We increment i by 1
                    // later in the loop, so increment it by part.strings.length - 2 here
                    i += part.strings.length - 2;
                }
                else {
                    part._$setValue(values[i]);
                }
            }
            i++;
        }
    }
}
let ChildPart$1 = class ChildPart {
    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        // ChildParts that are not at the root should always be created with a
        // parent; only RootChildNode's won't, so they return the local isConnected
        // state
        return this._$parent?._$isConnected ?? this.__isConnected;
    }
    constructor(startNode, endNode, parent, options) {
        this.type = CHILD_PART;
        this._$committedValue = nothing;
        // The following fields will be patched onto ChildParts when required by
        // AsyncDirective
        /** @internal */
        this._$disconnectableChildren = undefined;
        this._$startNode = startNode;
        this._$endNode = endNode;
        this._$parent = parent;
        this.options = options;
        // Note __isConnected is only ever accessed on RootParts (i.e. when there is
        // no _$parent); the value on a non-root-part is "don't care", but checking
        // for parent would be more code
        this.__isConnected = options?.isConnected ?? true;
        {
            // Explicitly initialize for consistent class shape.
            this._textSanitizer = undefined;
        }
    }
    /**
     * The parent node into which the part renders its content.
     *
     * A ChildPart's content consists of a range of adjacent child nodes of
     * `.parentNode`, possibly bordered by 'marker nodes' (`.startNode` and
     * `.endNode`).
     *
     * - If both `.startNode` and `.endNode` are non-null, then the part's content
     * consists of all siblings between `.startNode` and `.endNode`, exclusively.
     *
     * - If `.startNode` is non-null but `.endNode` is null, then the part's
     * content consists of all siblings following `.startNode`, up to and
     * including the last child of `.parentNode`. If `.endNode` is non-null, then
     * `.startNode` will always be non-null.
     *
     * - If both `.endNode` and `.startNode` are null, then the part's content
     * consists of all child nodes of `.parentNode`.
     */
    get parentNode() {
        let parentNode = wrap$1(this._$startNode).parentNode;
        const parent = this._$parent;
        if (parent !== undefined &&
            parentNode?.nodeType === 11 /* Node.DOCUMENT_FRAGMENT */) {
            // If the parentNode is a DocumentFragment, it may be because the DOM is
            // still in the cloned fragment during initial render; if so, get the real
            // parentNode the part will be committed into by asking the parent.
            parentNode = parent.parentNode;
        }
        return parentNode;
    }
    /**
     * The part's leading marker node, if any. See `.parentNode` for more
     * information.
     */
    get startNode() {
        return this._$startNode;
    }
    /**
     * The part's trailing marker node, if any. See `.parentNode` for more
     * information.
     */
    get endNode() {
        return this._$endNode;
    }
    _$setValue(value, directiveParent = this) {
        if (this.parentNode === null) {
            throw new Error(`This \`ChildPart\` has no \`parentNode\` and therefore cannot accept a value. This likely means the element containing the part was manipulated in an unsupported way outside of Lit's control such that the part's marker nodes were ejected from DOM. For example, setting the element's \`innerHTML\` or \`textContent\` can do this.`);
        }
        value = resolveDirective(this, value, directiveParent);
        if (isPrimitive$1(value)) {
            // Non-rendering child values. It's important that these do not render
            // empty text nodes to avoid issues with preventing default <slot>
            // fallback content.
            if (value === nothing || value == null || value === '') {
                if (this._$committedValue !== nothing) {
                    debugLogEvent?.({
                        kind: 'commit nothing to child',
                        start: this._$startNode,
                        end: this._$endNode,
                        parent: this._$parent,
                        options: this.options,
                    });
                    this._$clear();
                }
                this._$committedValue = nothing;
            }
            else if (value !== this._$committedValue && value !== noChange) {
                this._commitText(value);
            }
            // This property needs to remain unminified.
        }
        else if (value['_$litType$'] !== undefined) {
            this._commitTemplateResult(value);
        }
        else if (value.nodeType !== undefined) {
            if (this.options?.host === value) {
                this._commitText(`[probable mistake: rendered a template's host in itself ` +
                    `(commonly caused by writing \${this} in a template]`);
                console.warn(`Attempted to render the template host`, value, `inside itself. This is almost always a mistake, and in dev mode `, `we render some warning text. In production however, we'll `, `render it, which will usually result in an error, and sometimes `, `in the element disappearing from the DOM.`);
                return;
            }
            this._commitNode(value);
        }
        else if (isIterable(value)) {
            this._commitIterable(value);
        }
        else {
            // Fallback, will render the string representation
            this._commitText(value);
        }
    }
    _insert(node) {
        return wrap$1(wrap$1(this._$startNode).parentNode).insertBefore(node, this._$endNode);
    }
    _commitNode(value) {
        if (this._$committedValue !== value) {
            this._$clear();
            if (sanitizerFactoryInternal !== noopSanitizer) {
                const parentNodeName = this._$startNode.parentNode?.nodeName;
                if (parentNodeName === 'STYLE' || parentNodeName === 'SCRIPT') {
                    let message = 'Forbidden';
                    {
                        if (parentNodeName === 'STYLE') {
                            message =
                                `Lit does not support binding inside style nodes. ` +
                                    `This is a security risk, as style injection attacks can ` +
                                    `exfiltrate data and spoof UIs. ` +
                                    `Consider instead using css\`...\` literals ` +
                                    `to compose styles, and make do dynamic styling with ` +
                                    `css custom properties, ::parts, <slot>s, ` +
                                    `and by mutating the DOM rather than stylesheets.`;
                        }
                        else {
                            message =
                                `Lit does not support binding inside script nodes. ` +
                                    `This is a security risk, as it could allow arbitrary ` +
                                    `code execution.`;
                        }
                    }
                    throw new Error(message);
                }
            }
            debugLogEvent?.({
                kind: 'commit node',
                start: this._$startNode,
                parent: this._$parent,
                value: value,
                options: this.options,
            });
            this._$committedValue = this._insert(value);
        }
    }
    _commitText(value) {
        // If the committed value is a primitive it means we called _commitText on
        // the previous render, and we know that this._$startNode.nextSibling is a
        // Text node. We can now just replace the text content (.data) of the node.
        if (this._$committedValue !== nothing &&
            isPrimitive$1(this._$committedValue)) {
            const node = wrap$1(this._$startNode).nextSibling;
            {
                if (this._textSanitizer === undefined) {
                    this._textSanitizer = createSanitizer(node, 'data', 'property');
                }
                value = this._textSanitizer(value);
            }
            debugLogEvent?.({
                kind: 'commit text',
                node,
                value,
                options: this.options,
            });
            node.data = value;
        }
        else {
            {
                const textNode = d$1.createTextNode('');
                this._commitNode(textNode);
                // When setting text content, for security purposes it matters a lot
                // what the parent is. For example, <style> and <script> need to be
                // handled with care, while <span> does not. So first we need to put a
                // text node into the document, then we can sanitize its content.
                if (this._textSanitizer === undefined) {
                    this._textSanitizer = createSanitizer(textNode, 'data', 'property');
                }
                value = this._textSanitizer(value);
                debugLogEvent?.({
                    kind: 'commit text',
                    node: textNode,
                    value,
                    options: this.options,
                });
                textNode.data = value;
            }
        }
        this._$committedValue = value;
    }
    _commitTemplateResult(result) {
        // This property needs to remain unminified.
        const { values, ['_$litType$']: type } = result;
        // If $litType$ is a number, result is a plain TemplateResult and we get
        // the template from the template cache. If not, result is a
        // CompiledTemplateResult and _$litType$ is a CompiledTemplate and we need
        // to create the <template> element the first time we see it.
        const template = typeof type === 'number'
            ? this._$getTemplate(result)
            : (type.el === undefined &&
                (type.el = Template.createElement(type.h, this.options)),
                type);
        if (this._$committedValue?._$template === template) {
            debugLogEvent?.({
                kind: 'template updating',
                template,
                instance: this._$committedValue,
                parts: this._$committedValue._$parts,
                options: this.options,
                values,
            });
            this._$committedValue._update(values);
        }
        else {
            const instance = new TemplateInstance(template, this);
            const fragment = instance._clone(this.options);
            debugLogEvent?.({
                kind: 'template instantiated',
                template,
                instance,
                parts: instance._$parts,
                options: this.options,
                fragment,
                values,
            });
            instance._update(values);
            debugLogEvent?.({
                kind: 'template instantiated and updated',
                template,
                instance,
                parts: instance._$parts,
                options: this.options,
                fragment,
                values,
            });
            this._commitNode(fragment);
            this._$committedValue = instance;
        }
    }
    // Overridden via `litHtmlPolyfillSupport` to provide platform support.
    /** @internal */
    _$getTemplate(result) {
        let template = templateCache.get(result.strings);
        if (template === undefined) {
            templateCache.set(result.strings, (template = new Template(result)));
        }
        return template;
    }
    _commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If value is an array, then the previous render was of an
        // iterable and value will contain the ChildParts from the previous
        // render. If value is not an array, clear this part and make a new
        // array for ChildParts.
        if (!isArray(this._$committedValue)) {
            this._$committedValue = [];
            this._$clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this._$committedValue;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            if (partIndex === itemParts.length) {
                // If no existing part, create a new one
                // TODO (justinfagnani): test perf impact of always creating two parts
                // instead of sharing parts between nodes
                // https://github.com/lit/lit/issues/1266
                itemParts.push((itemPart = new ChildPart(this._insert(createMarker$1()), this._insert(createMarker$1()), this, this.options)));
            }
            else {
                // Reuse an existing part
                itemPart = itemParts[partIndex];
            }
            itemPart._$setValue(item);
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // itemParts always have end nodes
            this._$clear(itemPart && wrap$1(itemPart._$endNode).nextSibling, partIndex);
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
        }
    }
    /**
     * Removes the nodes contained within this Part from the DOM.
     *
     * @param start Start node to clear from, for clearing a subset of the part's
     *     DOM (used when truncating iterables)
     * @param from  When `start` is specified, the index within the iterable from
     *     which ChildParts are being removed, used for disconnecting directives in
     *     those Parts.
     *
     * @internal
     */
    _$clear(start = wrap$1(this._$startNode).nextSibling, from) {
        this._$notifyConnectionChanged?.(false, true, from);
        while (start && start !== this._$endNode) {
            const n = wrap$1(start).nextSibling;
            wrap$1(start).remove();
            start = n;
        }
    }
    /**
     * Implementation of RootPart's `isConnected`. Note that this metod
     * should only be called on `RootPart`s (the `ChildPart` returned from a
     * top-level `render()` call). It has no effect on non-root ChildParts.
     * @param isConnected Whether to set
     * @internal
     */
    setConnected(isConnected) {
        if (this._$parent === undefined) {
            this.__isConnected = isConnected;
            this._$notifyConnectionChanged?.(isConnected);
        }
        else {
            throw new Error('part.setConnected() may only be called on a ' +
                'RootPart returned from render().');
        }
    }
};
class AttributePart {
    get tagName() {
        return this.element.tagName;
    }
    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }
    constructor(element, name, strings, parent, options) {
        this.type = ATTRIBUTE_PART;
        /** @internal */
        this._$committedValue = nothing;
        /** @internal */
        this._$disconnectableChildren = undefined;
        this.element = element;
        this.name = name;
        this._$parent = parent;
        this.options = options;
        if (strings.length > 2 || strings[0] !== '' || strings[1] !== '') {
            this._$committedValue = new Array(strings.length - 1).fill(new String());
            this.strings = strings;
        }
        else {
            this._$committedValue = nothing;
        }
        {
            this._sanitizer = undefined;
        }
    }
    /**
     * Sets the value of this part by resolving the value from possibly multiple
     * values and static strings and committing it to the DOM.
     * If this part is single-valued, `this._strings` will be undefined, and the
     * method will be called with a single value argument. If this part is
     * multi-value, `this._strings` will be defined, and the method is called
     * with the value array of the part's owning TemplateInstance, and an offset
     * into the value array from which the values should be read.
     * This method is overloaded this way to eliminate short-lived array slices
     * of the template instance values, and allow a fast-path for single-valued
     * parts.
     *
     * @param value The part value, or an array of values for multi-valued parts
     * @param valueIndex the index to start reading values from. `undefined` for
     *   single-valued parts
     * @param noCommit causes the part to not commit its value to the DOM. Used
     *   in hydration to prime attribute parts with their first-rendered value,
     *   but not set the attribute, and in SSR to no-op the DOM operation and
     *   capture the value for serialization.
     *
     * @internal
     */
    _$setValue(value, directiveParent = this, valueIndex, noCommit) {
        const strings = this.strings;
        // Whether any of the values has changed, for dirty-checking
        let change = false;
        if (strings === undefined) {
            // Single-value binding case
            value = resolveDirective(this, value, directiveParent, 0);
            change =
                !isPrimitive$1(value) ||
                    (value !== this._$committedValue && value !== noChange);
            if (change) {
                this._$committedValue = value;
            }
        }
        else {
            // Interpolation case
            const values = value;
            value = strings[0];
            let i, v;
            for (i = 0; i < strings.length - 1; i++) {
                v = resolveDirective(this, values[valueIndex + i], directiveParent, i);
                if (v === noChange) {
                    // If the user-provided value is `noChange`, use the previous value
                    v = this._$committedValue[i];
                }
                change ||=
                    !isPrimitive$1(v) || v !== this._$committedValue[i];
                if (v === nothing) {
                    value = nothing;
                }
                else if (value !== nothing) {
                    value += (v ?? '') + strings[i + 1];
                }
                // We always record each value, even if one is `nothing`, for future
                // change detection.
                this._$committedValue[i] = v;
            }
        }
        if (change && !noCommit) {
            this._commitValue(value);
        }
    }
    /** @internal */
    _commitValue(value) {
        if (value === nothing) {
            wrap$1(this.element).removeAttribute(this.name);
        }
        else {
            {
                if (this._sanitizer === undefined) {
                    this._sanitizer = sanitizerFactoryInternal(this.element, this.name, 'attribute');
                }
                value = this._sanitizer(value ?? '');
            }
            debugLogEvent?.({
                kind: 'commit attribute',
                element: this.element,
                name: this.name,
                value,
                options: this.options,
            });
            wrap$1(this.element).setAttribute(this.name, (value ?? ''));
        }
    }
}
class PropertyPart extends AttributePart {
    constructor() {
        super(...arguments);
        this.type = PROPERTY_PART;
    }
    /** @internal */
    _commitValue(value) {
        {
            if (this._sanitizer === undefined) {
                this._sanitizer = sanitizerFactoryInternal(this.element, this.name, 'property');
            }
            value = this._sanitizer(value);
        }
        debugLogEvent?.({
            kind: 'commit property',
            element: this.element,
            name: this.name,
            value,
            options: this.options,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.element[this.name] = value === nothing ? undefined : value;
    }
}
class BooleanAttributePart extends AttributePart {
    constructor() {
        super(...arguments);
        this.type = BOOLEAN_ATTRIBUTE_PART;
    }
    /** @internal */
    _commitValue(value) {
        debugLogEvent?.({
            kind: 'commit boolean attribute',
            element: this.element,
            name: this.name,
            value: !!(value && value !== nothing),
            options: this.options,
        });
        wrap$1(this.element).toggleAttribute(this.name, !!value && value !== nothing);
    }
}
class EventPart extends AttributePart {
    constructor(element, name, strings, parent, options) {
        super(element, name, strings, parent, options);
        this.type = EVENT_PART;
        if (this.strings !== undefined) {
            throw new Error(`A \`<${element.localName}>\` has a \`@${name}=...\` listener with ` +
                'invalid content. Event listeners in templates must have exactly ' +
                'one expression and no surrounding text.');
        }
    }
    // EventPart does not use the base _$setValue/_resolveValue implementation
    // since the dirty checking is more complex
    /** @internal */
    _$setValue(newListener, directiveParent = this) {
        newListener =
            resolveDirective(this, newListener, directiveParent, 0) ?? nothing;
        if (newListener === noChange) {
            return;
        }
        const oldListener = this._$committedValue;
        // If the new value is nothing or any options change we have to remove the
        // part as a listener.
        const shouldRemoveListener = (newListener === nothing && oldListener !== nothing) ||
            newListener.capture !==
                oldListener.capture ||
            newListener.once !==
                oldListener.once ||
            newListener.passive !==
                oldListener.passive;
        // If the new value is not nothing and we removed the listener, we have
        // to add the part as a listener.
        const shouldAddListener = newListener !== nothing &&
            (oldListener === nothing || shouldRemoveListener);
        debugLogEvent?.({
            kind: 'commit event listener',
            element: this.element,
            name: this.name,
            value: newListener,
            options: this.options,
            removeListener: shouldRemoveListener,
            addListener: shouldAddListener,
            oldListener,
        });
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.name, this, oldListener);
        }
        if (shouldAddListener) {
            // Beware: IE11 and Chrome 41 don't like using the listener as the
            // options object. Figure out how to deal w/ this in IE11 - maybe
            // patch addEventListener?
            this.element.addEventListener(this.name, this, newListener);
        }
        this._$committedValue = newListener;
    }
    handleEvent(event) {
        if (typeof this._$committedValue === 'function') {
            this._$committedValue.call(this.options?.host ?? this.element, event);
        }
        else {
            this._$committedValue.handleEvent(event);
        }
    }
}
class ElementPart {
    constructor(element, parent, options) {
        this.element = element;
        this.type = ELEMENT_PART;
        /** @internal */
        this._$disconnectableChildren = undefined;
        this._$parent = parent;
        this.options = options;
    }
    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }
    _$setValue(value) {
        debugLogEvent?.({
            kind: 'commit to element binding',
            element: this.element,
            value,
            options: this.options,
        });
        resolveDirective(this, value);
    }
}
/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports  mangled in the
 * client side code, we export a _$LH object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-element, which re-exports all of lit-html.
 *
 * @private
 */
const _$LH = {
    // Used in lit-ssr
    _boundAttributeSuffix: boundAttributeSuffix,
    _marker: marker,
    _markerMatch: markerMatch,
    _HTML_RESULT: HTML_RESULT$1,
    _getTemplateHtml: getTemplateHtml,
    // Used in tests and private-ssr-support
    _TemplateInstance: TemplateInstance,
    _isIterable: isIterable,
    _resolveDirective: resolveDirective,
    _ChildPart: ChildPart$1,
    _AttributePart: AttributePart,
    _BooleanAttributePart: BooleanAttributePart,
    _EventPart: EventPart,
    _PropertyPart: PropertyPart,
    _ElementPart: ElementPart,
};
// Apply polyfills if available
const polyfillSupport = global.litHtmlPolyfillSupportDevMode
    ;
polyfillSupport?.(Template, ChildPart$1);
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
(global.litHtmlVersions ??= []).push('3.0.0-pre.0');
if (global.litHtmlVersions.length > 1) {
    issueWarning('multiple-versions', `Multiple versions of Lit loaded. ` +
        `Loading multiple versions is not recommended.`);
}
/**
 * Renders a value, usually a lit-html TemplateResult, to the container.
 *
 * This example renders the text "Hello, Zoe!" inside a paragraph tag, appending
 * it to the container `document.body`.
 *
 * ```js
 * import {html, render} from 'lit';
 *
 * const name = "Zoe";
 * render(html`<p>Hello, ${name}!</p>`, document.body);
 * ```
 *
 * @param value Any [renderable
 *   value](https://lit.dev/docs/templates/expressions/#child-expressions),
 *   typically a {@linkcode TemplateResult} created by evaluating a template tag
 *   like {@linkcode html} or {@linkcode svg}.
 * @param container A DOM container to render to. The first render will append
 *   the rendered value to the container, and subsequent renders will
 *   efficiently update the rendered value if the same result type was
 *   previously rendered there.
 * @param options See {@linkcode RenderOptions} for options documentation.
 * @see
 * {@link https://lit.dev/docs/libraries/standalone-templates/#rendering-lit-html-templates| Rendering Lit HTML Templates}
 */
const render = (value, container, options) => {
    if (container == null) {
        // Give a clearer error message than
        //     Uncaught TypeError: Cannot read properties of null (reading
        //     '_$litPart$')
        // which reads like an internal Lit error.
        throw new TypeError(`The container to render into may not be ${container}`);
    }
    const renderId = debugLogRenderId++ ;
    const partOwnerNode = options?.renderBefore ?? container;
    // This property needs to remain unminified.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let part = partOwnerNode['_$litPart$'];
    debugLogEvent?.({
        kind: 'begin render',
        id: renderId,
        value,
        container,
        options,
        part,
    });
    if (part === undefined) {
        const endNode = options?.renderBefore ?? null;
        // This property needs to remain unminified.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        partOwnerNode['_$litPart$'] = part = new ChildPart$1(container.insertBefore(createMarker$1(), endNode), endNode, undefined, options ?? {});
    }
    part._$setValue(value);
    debugLogEvent?.({
        kind: 'end render',
        id: renderId,
        value,
        container,
        options,
        part,
    });
    return part;
};
{
    render.setSanitizer = setSanitizer;
    render.createSanitizer = createSanitizer;
    {
        render._testOnlyClearSanitizerFactoryDoNotCallOrElse =
            _testOnlyClearSanitizerFactoryDoNotCallOrElse;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const PartType = {
    ATTRIBUTE: 1,
    CHILD: 2,
    PROPERTY: 3,
    BOOLEAN_ATTRIBUTE: 4,
    EVENT: 5,
    ELEMENT: 6,
};
/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
const directive = (c) => (...values) => ({
    // This property needs to remain unminified.
    ['_$litDirective$']: c,
    values,
});
/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
class Directive {
    constructor(_partInfo) { }
    // See comment in Disconnectable interface for why this is a getter
    get _$isConnected() {
        return this._$parent._$isConnected;
    }
    /** @internal */
    _$initialize(part, parent, attributeIndex) {
        this.__part = part;
        this._$parent = parent;
        this.__attributeIndex = attributeIndex;
    }
    /** @internal */
    _$resolve(part, props) {
        return this.update(part, props);
    }
    update(_part, props) {
        return this.render(...props);
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { _ChildPart: ChildPart } = _$LH;
// const ENABLE_SHADYDOM_NOPATCH = true;
// const wrap =
//   ENABLE_SHADYDOM_NOPATCH &&
//   window.ShadyDOM?.inUse &&
//   window.ShadyDOM?.noPatch === true
//     ? window.ShadyDOM!.wrap
//     : (node: Node) => node;
const wrap = (node) => node; // viewding不再支持shadydom的兼容性处理。
/**
 * Tests if a value is a primitive value.
 *
 * See https://tc39.github.io/ecma262/#sec-typeof-operator
 */
const isPrimitive = (value) => value === null || (typeof value != 'object' && typeof value != 'function');
const TemplateResultType = {
    HTML: 1,
    SVG: 2,
};
/**
 * Tests if a value is a TemplateResult.
 */
const isTemplateResult = (value, type) => type === undefined
    ? // This property needs to remain unminified.
        value?.['_$litType$'] !== undefined
    : value?.['_$litType$'] === type;
/**
 * Tests if a value is a DirectiveResult.
 */
const isDirectiveResult = (value) => 
// This property needs to remain unminified.
value?.['_$litDirective$'] !== undefined;
/**
 * Retrieves the Directive class for a DirectiveResult
 */
const getDirectiveClass = (value) => 
// This property needs to remain unminified.
value?.['_$litDirective$'];
/**
 * Tests whether a part has only a single-expression with no strings to
 * interpolate between.
 *
 * Only AttributePart and PropertyPart can have multiple expressions.
 * Multi-expression parts have a `strings` property and single-expression
 * parts do not.
 */
const isSingleExpression = (part) => part.strings === undefined;
const createMarker = () => document.createComment('');
/**
 * Inserts a ChildPart into the given container ChildPart's DOM, either at the
 * end of the container ChildPart, or before the optional `refPart`.
 *
 * This does not add the part to the containerPart's committed value. That must
 * be done by callers.
 *
 * @param containerPart Part within which to add the new ChildPart
 * @param refPart Part before which to add the new ChildPart; when omitted the
 *     part added to the end of the `containerPart`
 * @param part Part to insert, or undefined to create a new part
 */
const insertPart = (containerPart, refPart, part) => {
    const container = wrap(containerPart._$startNode).parentNode;
    const refNode = refPart === undefined ? containerPart._$endNode : refPart._$startNode;
    if (part === undefined) {
        const startNode = wrap(container).insertBefore(createMarker(), refNode);
        const endNode = wrap(container).insertBefore(createMarker(), refNode);
        part = new ChildPart(startNode, endNode, containerPart, containerPart.options);
    }
    else {
        const endNode = wrap(part._$endNode).nextSibling;
        const oldParent = part._$parent;
        const parentChanged = oldParent !== containerPart;
        if (parentChanged) {
            part._$reparentDisconnectables?.(containerPart);
            // Note that although `_$reparentDisconnectables` updates the part's
            // `_$parent` reference after unlinking from its current parent, that
            // method only exists if Disconnectables are present, so we need to
            // unconditionally set it here
            part._$parent = containerPart;
            // Since the _$isConnected getter is somewhat costly, only
            // read it once we know the subtree has directives that need
            // to be notified
            let newConnectionState;
            if (part._$notifyConnectionChanged !== undefined &&
                (newConnectionState = containerPart._$isConnected) !==
                    oldParent._$isConnected) {
                part._$notifyConnectionChanged(newConnectionState);
            }
        }
        if (endNode !== refNode || parentChanged) {
            let start = part._$startNode;
            while (start !== endNode) {
                const n = wrap(start).nextSibling;
                wrap(container).insertBefore(start, refNode);
                start = n;
            }
        }
    }
    return part;
};
/**
 * Sets the value of a Part.
 *
 * Note that this should only be used to set/update the value of user-created
 * parts (i.e. those created using `insertPart`); it should not be used
 * by directives to set the value of the directive's container part. Directives
 * should return a value from `update`/`render` to update their part state.
 *
 * For directives that require setting their part value asynchronously, they
 * should extend `AsyncDirective` and call `this.setValue()`.
 *
 * @param part Part to set
 * @param value Value to set
 * @param index For `AttributePart`s, the index to set
 * @param directiveParent Used internally; should not be set by user
 */
const setChildPartValue = (part, value, directiveParent = part) => {
    part._$setValue(value, directiveParent);
    return part;
};
// A sentinel value that can never appear as a part value except when set by
// live(). Used to force a dirty-check to fail and cause a re-render.
const RESET_VALUE = {};
/**
 * Sets the committed value of a ChildPart directly without triggering the
 * commit stage of the part.
 *
 * This is useful in cases where a directive needs to update the part such
 * that the next update detects a value change or not. When value is omitted,
 * the next update will be guaranteed to be detected as a change.
 *
 * @param part
 * @param value
 */
const setCommittedValue = (part, value = RESET_VALUE) => (part._$committedValue = value);
/**
 * Returns the committed value of a ChildPart.
 *
 * The committed value is used for change detection and efficient updates of
 * the part. It can differ from the value set by the template or directive in
 * cases where the template value is transformed before being committed.
 *
 * - `TemplateResult`s are committed as a `TemplateInstance`
 * - Iterables are committed as `Array<ChildPart>`
 * - All other types are committed as the template value or value returned or
 *   set by a directive.
 *
 * @param part
 */
const getCommittedValue = (part) => part._$committedValue;
/**
 * Removes a ChildPart from the DOM, including any of its content.
 *
 * @param part The Part to remove
 */
const removePart = (part) => {
    part._$notifyConnectionChanged?.(false, true);
    let start = part._$startNode;
    const end = wrap(part._$endNode).nextSibling;
    while (start !== end) {
        const n = wrap(start).nextSibling;
        wrap(start).remove();
        start = n;
    }
};
const clearPart = (part) => {
    part._$clear();
};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * Recursively walks down the tree of Parts/TemplateInstances/Directives to set
 * the connected state of directives and run `disconnected`/ `reconnected`
 * callbacks.
 *
 * @return True if there were children to disconnect; false otherwise
 */
const notifyChildrenConnectedChanged = (parent, isConnected) => {
    const children = parent._$disconnectableChildren;
    if (children === undefined) {
        return false;
    }
    for (const obj of children) {
        // The existence of `_$notifyDirectiveConnectionChanged` is used as a "brand" to
        // disambiguate AsyncDirectives from other DisconnectableChildren
        // (as opposed to using an instanceof check to know when to call it); the
        // redundancy of "Directive" in the API name is to avoid conflicting with
        // `_$notifyConnectionChanged`, which exists `ChildParts` which are also in
        // this list
        // Disconnect Directive (and any nested directives contained within)
        // This property needs to remain unminified.
        obj['_$notifyDirectiveConnectionChanged']?.(isConnected, false);
        // Disconnect Part/TemplateInstance
        notifyChildrenConnectedChanged(obj, isConnected);
    }
    return true;
};
/**
 * Removes the given child from its parent list of disconnectable children, and
 * if the parent list becomes empty as a result, removes the parent from its
 * parent, and so forth up the tree when that causes subsequent parent lists to
 * become empty.
 */
const removeDisconnectableFromParent = (obj) => {
    let parent, children;
    do {
        if ((parent = obj._$parent) === undefined) {
            break;
        }
        children = parent._$disconnectableChildren;
        children.delete(obj);
        obj = parent;
    } while (children?.size === 0);
};
const addDisconnectableToParent = (obj) => {
    // Climb the parent tree, creating a sparse tree of children needing
    // disconnection
    for (let parent; (parent = obj._$parent); obj = parent) {
        let children = parent._$disconnectableChildren;
        if (children === undefined) {
            parent._$disconnectableChildren = children = new Set();
        }
        else if (children.has(obj)) {
            // Once we've reached a parent that already contains this child, we
            // can short-circuit
            break;
        }
        children.add(obj);
        installDisconnectAPI(parent);
    }
};
/**
 * Changes the parent reference of the ChildPart, and updates the sparse tree of
 * Disconnectable children accordingly.
 *
 * Note, this method will be patched onto ChildPart instances and called from
 * the core code when parts are moved between different parents.
 */
function reparentDisconnectables(newParent) {
    if (this._$disconnectableChildren !== undefined) {
        removeDisconnectableFromParent(this);
        this._$parent = newParent;
        addDisconnectableToParent(this);
    }
    else {
        this._$parent = newParent;
    }
}
/**
 * Sets the connected state on any directives contained within the committed
 * value of this part (i.e. within a TemplateInstance or iterable of
 * ChildParts) and runs their `disconnected`/`reconnected`s, as well as within
 * any directives stored on the ChildPart (when `valueOnly` is false).
 *
 * `isClearingValue` should be passed as `true` on a top-level part that is
 * clearing itself, and not as a result of recursively disconnecting directives
 * as part of a `clear` operation higher up the tree. This both ensures that any
 * directive on this ChildPart that produced a value that caused the clear
 * operation is not disconnected, and also serves as a performance optimization
 * to avoid needless bookkeeping when a subtree is going away; when clearing a
 * subtree, only the top-most part need to remove itself from the parent.
 *
 * `fromPartIndex` is passed only in the case of a partial `_clear` running as a
 * result of truncating an iterable.
 *
 * Note, this method will be patched onto ChildPart instances and called from the
 * core code when parts are cleared or the connection state is changed by the
 * user.
 */
function notifyChildPartConnectedChanged(isConnected, isClearingValue = false, fromPartIndex = 0) {
    const value = this._$committedValue;
    const children = this._$disconnectableChildren;
    if (children === undefined || children.size === 0) {
        return;
    }
    if (isClearingValue) {
        if (Array.isArray(value)) {
            // Iterable case: Any ChildParts created by the iterable should be
            // disconnected and removed from this ChildPart's disconnectable
            // children (starting at `fromPartIndex` in the case of truncation)
            for (let i = fromPartIndex; i < value.length; i++) {
                notifyChildrenConnectedChanged(value[i], false);
                removeDisconnectableFromParent(value[i]);
            }
        }
        else if (value != null) {
            // TemplateInstance case: If the value has disconnectable children (will
            // only be in the case that it is a TemplateInstance), we disconnect it
            // and remove it from this ChildPart's disconnectable children
            notifyChildrenConnectedChanged(value, false);
            removeDisconnectableFromParent(value);
        }
    }
    else {
        notifyChildrenConnectedChanged(this, isConnected);
    }
}
/**
 * Patches disconnection API onto ChildParts.
 */
const installDisconnectAPI = (obj) => {
    if (obj.type == PartType.CHILD) {
        obj._$notifyConnectionChanged ??=
            notifyChildPartConnectedChanged;
        obj._$reparentDisconnectables ??= reparentDisconnectables;
    }
};
/**
 * An abstract `Directive` base class whose `disconnected` method will be
 * called when the part containing the directive is cleared as a result of
 * re-rendering, or when the user calls `part.setConnected(false)` on
 * a part that was previously rendered containing the directive (as happens
 * when e.g. a LitElement disconnects from the DOM).
 *
 * If `part.setConnected(true)` is subsequently called on a
 * containing part, the directive's `reconnected` method will be called prior
 * to its next `update`/`render` callbacks. When implementing `disconnected`,
 * `reconnected` should also be implemented to be compatible with reconnection.
 *
 * Note that updates may occur while the directive is disconnected. As such,
 * directives should generally check the `this.isConnected` flag during
 * render/update to determine whether it is safe to subscribe to resources
 * that may prevent garbage collection.
 */
class AsyncDirective extends Directive {
    constructor() {
        super(...arguments);
        // @internal
        this._$disconnectableChildren = undefined;
    }
    /**
     * Initialize the part with internal fields
     * @param part
     * @param parent
     * @param attributeIndex
     */
    _$initialize(part, parent, attributeIndex) {
        super._$initialize(part, parent, attributeIndex);
        addDisconnectableToParent(this);
        this.isConnected = part._$isConnected;
    }
    // This property needs to remain unminified.
    /**
     * Called from the core code when a directive is going away from a part (in
     * which case `shouldRemoveFromParent` should be true), and from the
     * `setChildrenConnected` helper function when recursively changing the
     * connection state of a tree (in which case `shouldRemoveFromParent` should
     * be false).
     *
     * @param isConnected
     * @param isClearingDirective - True when the directive itself is being
     *     removed; false when the tree is being disconnected
     * @internal
     */
    ['_$notifyDirectiveConnectionChanged'](isConnected, isClearingDirective = true) {
        if (isConnected !== this.isConnected) {
            this.isConnected = isConnected;
            if (isConnected) {
                this.reconnected?.();
            }
            else {
                this.disconnected?.();
            }
        }
        if (isClearingDirective) {
            notifyChildrenConnectedChanged(this, isConnected);
            removeDisconnectableFromParent(this);
        }
    }
    /**
     * Sets the value of the directive's Part outside the normal `update`/`render`
     * lifecycle of a directive.
     *
     * This method should not be called synchronously from a directive's `update`
     * or `render`.
     *
     * @param directive The directive to update
     * @param value The value to set
     */
    setValue(value) {
        if (isSingleExpression(this.__part)) {
            this.__part._$setValue(value, this);
        }
        else {
            // this.__attributeIndex will be defined in this case, but
            // assert it in dev mode
            if (this.__attributeIndex === undefined) {
                throw new Error(`Expected this.__attributeIndex to be a number`);
            }
            const newValues = [...this.__part._$committedValue];
            newValues[this.__attributeIndex] = value;
            this.__part._$setValue(newValues, this, 0);
        }
    }
    /**
     * User callbacks for implementing logic to release any resources/subscriptions
     * that may have been retained by this directive. Since directives may also be
     * re-connected, `reconnected` should also be implemented to restore the
     * working state of the directive prior to the next render.
     */
    disconnected() { }
    reconnected() { }
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// Note, this module is not included in package exports so that it's private to
// our first-party directives. If it ends up being useful, we can open it up and
// export it.
/**
 * Helper to iterate an AsyncIterable in its own closure.
 * @param iterable The iterable to iterate
 * @param callback The callback to call for each value. If the callback returns
 * `false`, the loop will be broken.
 */
const forAwaitOf = async (iterable, callback) => {
    for await (const v of iterable) {
        if ((await callback(v)) === false) {
            return;
        }
    }
};
/**
 * Holds a reference to an instance that can be disconnected and reconnected,
 * so that a closure over the ref (e.g. in a then function to a promise) does
 * not strongly hold a ref to the instance. Approximates a WeakRef but must
 * be manually connected & disconnected to the backing instance.
 */
class PseudoWeakRef {
    constructor(ref) {
        this._ref = ref;
    }
    /**
     * Disassociates the ref with the backing instance.
     */
    disconnect() {
        this._ref = undefined;
    }
    /**
     * Reassociates the ref with the backing instance.
     */
    reconnect(ref) {
        this._ref = ref;
    }
    /**
     * Retrieves the backing instance (will be undefined when disconnected)
     */
    deref() {
        return this._ref;
    }
}
/**
 * A helper to pause and resume waiting on a condition in an async function
 */
class Pauser {
    constructor() {
        this._promise = undefined;
        this._resolve = undefined;
    }
    /**
     * When paused, returns a promise to be awaited; when unpaused, returns
     * undefined. Note that in the microtask between the pauser being resumed
     * an an await of this promise resolving, the pauser could be paused again,
     * hence callers should check the promise in a loop when awaiting.
     * @returns A promise to be awaited when paused or undefined
     */
    get() {
        return this._promise;
    }
    /**
     * Creates a promise to be awaited
     */
    pause() {
        this._promise ??= new Promise((resolve) => (this._resolve = resolve));
    }
    /**
     * Resolves the promise which may be awaited
     */
    resume() {
        this._resolve?.();
        this._promise = this._resolve = undefined;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class AsyncReplaceDirective extends AsyncDirective {
    constructor() {
        super(...arguments);
        this.__weakThis = new PseudoWeakRef(this);
        this.__pauser = new Pauser();
    }
    // @ts-expect-error value not used, but we want a nice parameter for docs
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render(value, _mapper) {
        return noChange;
    }
    update(_part, [value, mapper]) {
        // If our initial render occurs while disconnected, ensure that the pauser
        // and weakThis are in the disconnected state
        if (!this.isConnected) {
            this.disconnected();
        }
        // If we've already set up this particular iterable, we don't need
        // to do anything.
        if (value === this.__value) {
            return;
        }
        this.__value = value;
        let i = 0;
        const { __weakThis: weakThis, __pauser: pauser } = this;
        // Note, the callback avoids closing over `this` so that the directive
        // can be gc'ed before the promise resolves; instead `this` is retrieved
        // from `weakThis`, which can break the hard reference in the closure when
        // the directive disconnects
        forAwaitOf(value, async (v) => {
            // The while loop here handles the case that the connection state
            // thrashes, causing the pauser to resume and then get re-paused
            while (pauser.get()) {
                await pauser.get();
            }
            // If the callback gets here and there is no `this`, it means that the
            // directive has been disconnected and garbage collected and we don't
            // need to do anything else
            const _this = weakThis.deref();
            if (_this !== undefined) {
                // Check to make sure that value is the still the current value of
                // the part, and if not bail because a new value owns this part
                if (_this.__value !== value) {
                    return false;
                }
                // As a convenience, because functional-programming-style
                // transforms of iterables and async iterables requires a library,
                // we accept a mapper function. This is especially convenient for
                // rendering a template for each item.
                if (mapper !== undefined) {
                    v = mapper(v, i);
                }
                _this.commitValue(v, i);
                i++;
            }
            return true;
        });
        return noChange;
    }
    // Override point for AsyncAppend to append rather than replace
    commitValue(value, _index) {
        this.setValue(value);
    }
    disconnected() {
        this.__weakThis.disconnect();
        this.__pauser.pause();
    }
    reconnected() {
        this.__weakThis.reconnect(this);
        this.__pauser.resume();
    }
}
/**
 * A directive that renders the items of an async iterable[1], replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time. This directive may be used in any expression type.
 *
 * Async iterables are objects with a `[Symbol.asyncIterator]` method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is rendered to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
const asyncReplace = directive(AsyncReplaceDirective);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class AsyncAppendDirective extends AsyncReplaceDirective {
    // Override AsyncReplace to narrow the allowed part type to ChildPart only
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.CHILD) {
            throw new Error('asyncAppend can only be used in child expressions');
        }
    }
    // Override AsyncReplace to save the part since we need to append into it
    update(part, params) {
        this.__childPart = part;
        return super.update(part, params);
    }
    // Override AsyncReplace to append rather than replace
    commitValue(value, index) {
        // When we get the first value, clear the part. This lets the
        // previous value display until we can replace it.
        if (index === 0) {
            clearPart(this.__childPart);
        }
        // Create and insert a new part and set its value to the next value
        const newPart = insertPart(this.__childPart);
        setChildPartValue(newPart, value);
    }
}
/**
 * A directive that renders the items of an async iterable[1], appending new
 * values after previous values, similar to the built-in support for iterables.
 * This directive is usable only in child expressions.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is appended to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
const asyncAppend = directive(AsyncAppendDirective);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class CacheDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        this._templateCache = new WeakMap();
    }
    render(v) {
        // Return an array of the value to induce lit-html to create a ChildPart
        // for the value that we can move into the cache.
        return [v];
    }
    update(containerPart, [v]) {
        // If the previous value is a TemplateResult and the new value is not,
        // or is a different Template as the previous value, move the child part
        // into the cache.
        if (isTemplateResult(this._value) &&
            (!isTemplateResult(v) || this._value.strings !== v.strings)) {
            // This is always an array because we return [v] in render()
            const partValue = getCommittedValue(containerPart);
            const childPart = partValue.pop();
            let cachedContainerPart = this._templateCache.get(this._value.strings);
            if (cachedContainerPart === undefined) {
                const fragment = document.createDocumentFragment();
                cachedContainerPart = render(nothing, fragment);
                cachedContainerPart.setConnected(false);
                this._templateCache.set(this._value.strings, cachedContainerPart);
            }
            // Move into cache
            setCommittedValue(cachedContainerPart, [childPart]);
            insertPart(cachedContainerPart, undefined, childPart);
        }
        // If the new value is a TemplateResult and the previous value is not,
        // or is a different Template as the previous value, restore the child
        // part from the cache.
        if (isTemplateResult(v)) {
            if (!isTemplateResult(this._value) || this._value.strings !== v.strings) {
                const cachedContainerPart = this._templateCache.get(v.strings);
                if (cachedContainerPart !== undefined) {
                    // Move the cached part back into the container part value
                    const partValue = getCommittedValue(cachedContainerPart);
                    const cachedPart = partValue.pop();
                    // Move cached part back into DOM
                    clearPart(containerPart);
                    insertPart(containerPart, undefined, cachedPart);
                    setCommittedValue(containerPart, [cachedPart]);
                }
            }
            this._value = v;
        }
        else {
            this._value = undefined;
        }
        return this.render(v);
    }
}
/**
 * Enables fast switching between multiple templates by caching the DOM nodes
 * and TemplateInstances produced by the templates.
 *
 * Example:
 *
 * ```js
 * let checked = false;
 *
 * html`
 *   ${cache(checked ? html`input is checked` : html`input is not checked`)}
 * `
 * ```
 */
const cache = directive(CacheDirective);

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * Chooses and evaluates a template function from a list based on matching
 * the given `value` to a case.
 *
 * Cases are structured as `[caseValue, func]`. `value` is matched to
 * `caseValue` by strict equality. The first match is selected. Case values
 * can be of any type including primitives, objects, and symbols.
 *
 * This is similar to a switch statement, but as an expression and without
 * fallthrough.
 *
 * @example
 *
 * ```ts
 * render() {
 *   return html`
 *     ${choose(this.section, [
 *       ['home', () => html`<h1>Home</h1>`],
 *       ['about', () => html`<h1>About</h1>`]
 *     ],
 *     () => html`<h1>Error</h1>`)}
 *   `;
 * }
 * ```
 */
const choose = (value, cases, defaultCase) => {
    for (const c of cases) {
        const caseValue = c[0];
        if (caseValue === value) {
            const fn = c[1];
            return fn();
        }
    }
    return defaultCase?.();
};

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class ClassMapDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ATTRIBUTE ||
            partInfo.name !== 'class' ||
            partInfo.strings?.length > 2) {
            throw new Error('`classMap()` can only be used in the `class` attribute ' +
                'and must be the only part in the attribute.');
        }
    }
    render(classInfo) {
        // Add spaces to ensure separation from static classes
        return (' ' +
            Object.keys(classInfo)
                .filter((key) => classInfo[key])
                .join(' ') +
            ' ');
    }
    update(part, [classInfo]) {
        // Remember dynamic classes on the first render
        if (this._previousClasses === undefined) {
            this._previousClasses = new Set();
            if (part.strings !== undefined) {
                this._staticClasses = new Set(part.strings
                    .join(' ')
                    .split(/\s/)
                    .filter((s) => s !== ''));
            }
            for (const name in classInfo) {
                if (classInfo[name] && !this._staticClasses?.has(name)) {
                    this._previousClasses.add(name);
                }
            }
            return this.render(classInfo);
        }
        const classList = part.element.classList;
        // Remove old classes that no longer apply
        for (const name of this._previousClasses) {
            if (!(name in classInfo)) {
                classList.remove(name);
                this._previousClasses.delete(name);
            }
        }
        // Add or remove classes based on their classMap value
        for (const name in classInfo) {
            // We explicitly want a loose truthy check of `value` because it seems
            // more convenient that '' and 0 are skipped.
            const value = !!classInfo[name];
            if (value !== this._previousClasses.has(name) &&
                !this._staticClasses?.has(name)) {
                if (value) {
                    classList.add(name);
                    this._previousClasses.add(name);
                }
                else {
                    classList.remove(name);
                    this._previousClasses.delete(name);
                }
            }
        }
        return noChange;
    }
}
/**
 * A directive that applies dynamic CSS classes.
 *
 * This must be used in the `class` attribute and must be the only part used in
 * the attribute. It takes each property in the `classInfo` argument and adds
 * the property name to the element's `classList` if the property value is
 * truthy; if the property value is falsey, the property name is removed from
 * the element's `class`.
 *
 * For example `{foo: bar}` applies the class `foo` if the value of `bar` is
 * truthy.
 *
 * @param classInfo
 */
const classMap = directive(ClassMapDirective);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// A sentinel that indicates guard() hasn't rendered anything yet
const initialValue = {};
class GuardDirective extends Directive {
    constructor() {
        super(...arguments);
        this._previousValue = initialValue;
    }
    render(_value, f) {
        return f();
    }
    update(_part, [value, f]) {
        if (Array.isArray(value)) {
            // Dirty-check arrays by item
            if (Array.isArray(this._previousValue) &&
                this._previousValue.length === value.length &&
                value.every((v, i) => v === this._previousValue[i])) {
                return noChange;
            }
        }
        else if (this._previousValue === value) {
            // Dirty-check non-arrays by identity
            return noChange;
        }
        // Copy the value if it's an array so that if it's mutated we don't forget
        // what the previous values were.
        this._previousValue = Array.isArray(value) ? Array.from(value) : value;
        const r = this.render(value, f);
        return r;
    }
}
/**
 * Prevents re-render of a template function until a single value or an array of
 * values changes.
 *
 * Values are checked against previous values with strict equality (`===`), and
 * so the check won't detect nested property changes inside objects or arrays.
 * Arrays values have each item checked against the previous value at the same
 * index with strict equality. Nested arrays are also checked only by strict
 * equality.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([user.id, company.id], () => html`...`)}
 *   </div>
 * `
 * ```
 *
 * In this case, the template only rerenders if either `user.id` or `company.id`
 * changes.
 *
 * guard() is useful with immutable data patterns, by preventing expensive work
 * until data updates.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([immutableItems], () => immutableItems.map(i => html`${i}`))}
 *   </div>
 * `
 * ```
 *
 * In this case, items are mapped over only when the array reference changes.
 *
 * @param value the value to check before re-rendering
 * @param f the template function
 */
const guard = directive(GuardDirective);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined.
 *
 * For other part types, this directive is a no-op.
 */
const ifDefined = (value) => value ?? nothing;

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function* join(items, joiner) {
    const isFunction = typeof joiner === 'function';
    if (items !== undefined) {
        let i = -1;
        for (const value of items) {
            if (i > -1) {
                yield isFunction ? joiner(i) : joiner;
            }
            i++;
            yield value;
        }
    }
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class Keyed extends Directive {
    constructor() {
        super(...arguments);
        this.key = nothing;
    }
    render(k, v) {
        this.key = k;
        return v;
    }
    update(part, [k, v]) {
        if (k !== this.key) {
            // Clear the part before returning a value. The one-arg form of
            // setCommittedValue sets the value to a sentinel which forces a
            // commit the next render.
            setCommittedValue(part);
            this.key = k;
        }
        return v;
    }
}
/**
 * Associates a renderable value with a unique key. When the key changes, the
 * previous DOM is removed and disposed before rendering the next value, even
 * if the value - such as a template - is the same.
 *
 * This is useful for forcing re-renders of stateful components, or working
 * with code that expects new data to generate new HTML elements, such as some
 * animation techniques.
 */
const keyed = directive(Keyed);

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class LiveDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (!(partInfo.type === PartType.PROPERTY ||
            partInfo.type === PartType.ATTRIBUTE ||
            partInfo.type === PartType.BOOLEAN_ATTRIBUTE)) {
            throw new Error('The `live` directive is not allowed on child or event bindings');
        }
        if (!isSingleExpression(partInfo)) {
            throw new Error('`live` bindings can only contain a single expression');
        }
    }
    render(value) {
        return value;
    }
    update(part, [value]) {
        if (value === noChange || value === nothing) {
            return value;
        }
        const element = part.element;
        const name = part.name;
        if (part.type === PartType.PROPERTY) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (value === element[name]) {
                return noChange;
            }
        }
        else if (part.type === PartType.BOOLEAN_ATTRIBUTE) {
            if (!!value === element.hasAttribute(name)) {
                return noChange;
            }
        }
        else if (part.type === PartType.ATTRIBUTE) {
            if (element.getAttribute(name) === String(value)) {
                return noChange;
            }
        }
        // Resets the part's value, causing its dirty-check to fail so that it
        // always sets the value.
        setCommittedValue(part);
        return value;
    }
}
/**
 * Checks binding values against live DOM values, instead of previously bound
 * values, when determining whether to update the value.
 *
 * This is useful for cases where the DOM value may change from outside of
 * lit-html, such as with a binding to an `<input>` element's `value` property,
 * a content editable elements text, or to a custom element that changes it's
 * own properties or attributes.
 *
 * In these cases if the DOM value changes, but the value set through lit-html
 * bindings hasn't, lit-html won't know to update the DOM value and will leave
 * it alone. If this is not what you want--if you want to overwrite the DOM
 * value with the bound value no matter what--use the `live()` directive:
 *
 * ```js
 * html`<input .value=${live(x)}>`
 * ```
 *
 * `live()` performs a strict equality check against the live DOM value, and if
 * the new value is equal to the live value, does nothing. This means that
 * `live()` should not be used when the binding will cause a type conversion. If
 * you use `live()` with an attribute binding, make sure that only strings are
 * passed in, or the binding will update every render.
 */
const live = directive(LiveDirective);

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * Returns an iterable containing the result of calling `f(value)` on each
 * value in `items`.
 *
 * @example
 *
 * ```ts
 * render() {
 *   return html`
 *     <ul>
 *       ${map(items, (i) => html`<li>${i}</li>`)}
 *     </ul>
 *   `;
 * }
 * ```
 */
function* map(items, f) {
    if (items !== undefined) {
        let i = 0;
        for (const value of items) {
            yield f(value, i++);
        }
    }
}

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function* range(startOrEnd, end, step = 1) {
    const start = end === undefined ? 0 : startOrEnd;
    end ??= startOrEnd;
    for (let i = start; step > 0 ? i < end : end < i; i += step) {
        yield i;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * Creates a new Ref object, which is container for a reference to an element.
 */
const createRef = () => new Ref();
/**
 * An object that holds a ref value.
 */
class Ref {
}
// When callbacks are used for refs, this map tracks the last value the callback
// was called with, for ensuring a directive doesn't clear the ref if the ref
// has already been rendered to a new spot. It is double-keyed on both the
// context (`options.host`) and the callback, since we auto-bind class methods
// to `options.host`.
const lastElementForContextAndCallback = new WeakMap();
class RefDirective extends AsyncDirective {
    render(_ref) {
        return nothing;
    }
    update(part, [ref]) {
        const refChanged = ref !== this._ref;
        if (refChanged && this._ref !== undefined) {
            // The ref passed to the directive has changed;
            // unset the previous ref's value
            this._updateRefValue(undefined);
        }
        if (refChanged || this._lastElementForRef !== this._element) {
            // We either got a new ref or this is the first render;
            // store the ref/element & update the ref value
            this._ref = ref;
            this._context = part.options?.host;
            this._updateRefValue((this._element = part.element));
        }
        return nothing;
    }
    _updateRefValue(element) {
        if (typeof this._ref === 'function') {
            // If the current ref was called with a previous value, call with
            // `undefined`; We do this to ensure callbacks are called in a consistent
            // way regardless of whether a ref might be moving up in the tree (in
            // which case it would otherwise be called with the new value before the
            // previous one unsets it) and down in the tree (where it would be unset
            // before being set). Note that element lookup is keyed by
            // both the context and the callback, since we allow passing unbound
            // functions that are called on options.host, and we want to treat
            // these as unique "instances" of a function.
            const context = this._context ?? globalThis;
            let lastElementForCallback = lastElementForContextAndCallback.get(context);
            if (lastElementForCallback === undefined) {
                lastElementForCallback = new WeakMap();
                lastElementForContextAndCallback.set(context, lastElementForCallback);
            }
            if (lastElementForCallback.get(this._ref) !== undefined) {
                this._ref.call(this._context, undefined);
            }
            lastElementForCallback.set(this._ref, element);
            // Call the ref with the new element value
            if (element !== undefined) {
                this._ref.call(this._context, element);
            }
        }
        else {
            this._ref.value = element;
        }
    }
    get _lastElementForRef() {
        return typeof this._ref === 'function'
            ? lastElementForContextAndCallback
                .get(this._context ?? globalThis)
                ?.get(this._ref)
            : this._ref?.value;
    }
    disconnected() {
        // Only clear the box if our element is still the one in it (i.e. another
        // directive instance hasn't rendered its element to it before us); that
        // only happens in the event of the directive being cleared (not via manual
        // disconnection)
        if (this._lastElementForRef === this._element) {
            this._updateRefValue(undefined);
        }
    }
    reconnected() {
        // If we were manually disconnected, we can safely put our element back in
        // the box, since no rendering could have occurred to change its state
        this._updateRefValue(this._element);
    }
}
/**
 * Sets the value of a Ref object or calls a ref callback with the element it's
 * bound to.
 *
 * A Ref object acts as a container for a reference to an element. A ref
 * callback is a function that takes an element as its only argument.
 *
 * The ref directive sets the value of the Ref object or calls the ref callback
 * during rendering, if the referenced element changed.
 *
 * Note: If a ref callback is rendered to a different element position or is
 * removed in a subsequent render, it will first be called with `undefined`,
 * followed by another call with the new element it was rendered to (if any).
 *
 * ```js
 * // Using Ref object
 * const inputRef = createRef();
 * render(html`<input ${ref(inputRef)}>`, container);
 * inputRef.value.focus();
 *
 * // Using callback
 * const callback = (inputElement) => inputElement.focus();
 * render(html`<input ${ref(callback)}>`, container);
 * ```
 */
const ref = directive(RefDirective);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list, start, end) => {
    const map = new Map();
    for (let i = start; i <= end; i++) {
        map.set(list[i], i);
    }
    return map;
};
class RepeatDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.CHILD) {
            throw new Error('repeat() can only be used in text expressions');
        }
    }
    _getValuesAndKeys(items, keyFnOrTemplate, template) {
        let keyFn;
        if (template === undefined) {
            template = keyFnOrTemplate;
        }
        else if (keyFnOrTemplate !== undefined) {
            keyFn = keyFnOrTemplate;
        }
        const keys = [];
        const values = [];
        let index = 0;
        for (const item of items) {
            keys[index] = keyFn ? keyFn(item, index) : index;
            values[index] = template(item, index);
            index++;
        }
        return {
            values,
            keys,
        };
    }
    render(items, keyFnOrTemplate, template) {
        return this._getValuesAndKeys(items, keyFnOrTemplate, template).values;
    }
    update(containerPart, [items, keyFnOrTemplate, template]) {
        // Old part & key lists are retrieved from the last update (which may
        // be primed by hydration)
        const oldParts = getCommittedValue(containerPart);
        const { values: newValues, keys: newKeys } = this._getValuesAndKeys(items, keyFnOrTemplate, template);
        // We check that oldParts, the committed value, is an Array as an
        // indicator that the previous value came from a repeat() call. If
        // oldParts is not an Array then this is the first render and we return
        // an array for lit-html's array handling to render, and remember the
        // keys.
        if (!Array.isArray(oldParts)) {
            this._itemKeys = newKeys;
            return newValues;
        }
        // In SSR hydration it's possible for oldParts to be an array but for us
        // to not have item keys because the update() hasn't run yet. We set the
        // keys to an empty array. This will cause all oldKey/newKey comparisons
        // to fail and execution to fall to the last nested brach below which
        // reuses the oldPart.
        const oldKeys = (this._itemKeys ??= []);
        // New part list will be built up as we go (either reused from
        // old parts or created for new keys in this update). This is
        // saved in the above cache at the end of the update.
        const newParts = [];
        // Maps from key to index for current and previous update; these
        // are generated lazily only when needed as a performance
        // optimization, since they are only required for multiple
        // non-contiguous changes in the list, which are less common.
        let newKeyToIndexMap;
        let oldKeyToIndexMap;
        // Head and tail pointers to old parts and new values
        let oldHead = 0;
        let oldTail = oldParts.length - 1;
        let newHead = 0;
        let newTail = newValues.length - 1;
        // Overview of O(n) reconciliation algorithm (general approach
        // based on ideas found in ivi, vue, snabbdom, etc.):
        //
        // * We start with the list of old parts and new values (and
        //   arrays of their respective keys), head/tail pointers into
        //   each, and we build up the new list of parts by updating
        //   (and when needed, moving) old parts or creating new ones.
        //   The initial scenario might look like this (for brevity of
        //   the diagrams, the numbers in the array reflect keys
        //   associated with the old parts or new values, although keys
        //   and parts/values are actually stored in parallel arrays
        //   indexed using the same head/tail pointers):
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [ ,  ,  ,  ,  ,  ,  ]
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6] <- reflects the user's new
        //                                      item order
        //      newHead ^                 ^ newTail
        //
        // * Iterate old & new lists from both sides, updating,
        //   swapping, or removing parts at the head/tail locations
        //   until neither head nor tail can move.
        //
        // * Example below: keys at head pointers match, so update old
        //   part 0 in-place (no need to move it) and record part 0 in
        //   the `newParts` list. The last thing we do is advance the
        //   `oldHead` and `newHead` pointers (will be reflected in the
        //   next diagram).
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  ,  ] <- heads matched: update 0
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
        //                                      & newHead
        //      newHead ^                 ^ newTail
        //
        // * Example below: head pointers don't match, but tail
        //   pointers do, so update part 6 in place (no need to move
        //   it), and record part 6 in the `newParts` list. Last,
        //   advance the `oldTail` and `oldHead` pointers.
        //
        //         oldHead v              v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- tails matched: update 6
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldTail
        //                                      & newTail
        //         newHead ^              ^ newTail
        //
        // * If neither head nor tail match; next check if one of the
        //   old head/tail items was removed. We first need to generate
        //   the reverse map of new keys to index (`newKeyToIndexMap`),
        //   which is done once lazily as a performance optimization,
        //   since we only hit this case if multiple non-contiguous
        //   changes were made. Note that for contiguous removal
        //   anywhere in the list, the head and tails would advance
        //   from either end and pass each other before we get to this
        //   case and removals would be handled in the final while loop
        //   without needing to generate the map.
        //
        // * Example below: The key at `oldTail` was removed (no longer
        //   in the `newKeyToIndexMap`), so remove that part from the
        //   DOM and advance just the `oldTail` pointer.
        //
        //         oldHead v           v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- 5 not in new map: remove
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    5 and advance oldTail
        //         newHead ^           ^ newTail
        //
        // * Once head and tail cannot move, any mismatches are due to
        //   either new or moved items; if a new key is in the previous
        //   "old key to old index" map, move the old part to the new
        //   location, otherwise create and insert a new part. Note
        //   that when moving an old part we null its position in the
        //   oldParts array if it lies between the head and tail so we
        //   know to skip it when the pointers get there.
        //
        // * Example below: neither head nor tail match, and neither
        //   were removed; so find the `newHead` key in the
        //   `oldKeyToIndexMap`, and move that old part's DOM into the
        //   next head position (before `oldParts[oldHead]`). Last,
        //   null the part in the `oldPart` array since it was
        //   somewhere in the remaining oldParts still to be scanned
        //   (between the head and tail pointers) so that we know to
        //   skip that old part on future iterations.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2,  ,  ,  ,  , 6] <- stuck: update & move 2
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    into place and advance
        //                                      newHead
        //         newHead ^           ^ newTail
        //
        // * Note that for moves/insertions like the one above, a part
        //   inserted at the head pointer is inserted before the
        //   current `oldParts[oldHead]`, and a part inserted at the
        //   tail pointer is inserted before `newParts[newTail+1]`. The
        //   seeming asymmetry lies in the fact that new parts are
        //   moved into place outside in, so to the right of the head
        //   pointer are old parts, and to the right of the tail
        //   pointer are new parts.
        //
        // * We always restart back from the top of the algorithm,
        //   allowing matching and simple updates in place to
        //   continue...
        //
        // * Example below: the head pointers once again match, so
        //   simply update part 1 and record it in the `newParts`
        //   array.  Last, advance both head pointers.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1,  ,  ,  , 6] <- heads matched: update 1
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
        //                                      & newHead
        //            newHead ^        ^ newTail
        //
        // * As mentioned above, items that were moved as a result of
        //   being stuck (the final else clause in the code below) are
        //   marked with null, so we always advance old pointers over
        //   these so we're comparing the next actual old value on
        //   either end.
        //
        // * Example below: `oldHead` is null (already placed in
        //   newParts), so advance `oldHead`.
        //
        //            oldHead v     v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6] <- old head already used:
        //   newParts: [0, 2, 1,  ,  ,  , 6]    advance oldHead
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //               newHead ^     ^ newTail
        //
        // * Note it's not critical to mark old parts as null when they
        //   are moved from head to tail or tail to head, since they
        //   will be outside the pointer range and never visited again.
        //
        // * Example below: Here the old tail key matches the new head
        //   key, so the part at the `oldTail` position and move its
        //   DOM to the new head position (before `oldParts[oldHead]`).
        //   Last, advance `oldTail` and `newHead` pointers.
        //
        //               oldHead v  v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4,  ,  , 6] <- old tail matches new
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]   head: update & move 4,
        //                                     advance oldTail & newHead
        //               newHead ^     ^ newTail
        //
        // * Example below: Old and new head keys match, so update the
        //   old head part in place, and advance the `oldHead` and
        //   `newHead` pointers.
        //
        //               oldHead v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3,   ,6] <- heads match: update 3
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance oldHead &
        //                                      newHead
        //                  newHead ^  ^ newTail
        //
        // * Once the new or old pointers move past each other then all
        //   we have left is additions (if old list exhausted) or
        //   removals (if new list exhausted). Those are handled in the
        //   final while loops at the end.
        //
        // * Example below: `oldHead` exceeded `oldTail`, so we're done
        //   with the main loop.  Create the remaining part and insert
        //   it at the new head position, and the update is complete.
        //
        //                   (oldHead > oldTail)
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3, 7 ,6] <- create and insert 7
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //                     newHead ^ newTail
        //
        // * Note that the order of the if/else clauses is not
        //   important to the algorithm, as long as the null checks
        //   come first (to ensure we're always working on valid old
        //   parts) and that the final else clause comes last (since
        //   that's where the expensive moves occur). The order of
        //   remaining clauses is is just a simple guess at which cases
        //   will be most common.
        //
        // * Note, we could calculate the longest
        //   increasing subsequence (LIS) of old items in new position,
        //   and only move those not in the LIS set. However that costs
        //   O(nlogn) time and adds a bit more code, and only helps
        //   make rare types of mutations require fewer moves. The
        //   above handles removes, adds, reversal, swaps, and single
        //   moves of contiguous items in linear time, in the minimum
        //   number of moves. As the number of multiple moves where LIS
        //   might help approaches a random shuffle, the LIS
        //   optimization becomes less helpful, so it seems not worth
        //   the code at this point. Could reconsider if a compelling
        //   case arises.
        while (oldHead <= oldTail && newHead <= newTail) {
            if (oldParts[oldHead] === null) {
                // `null` means old part at head has already been used
                // below; skip
                oldHead++;
            }
            else if (oldParts[oldTail] === null) {
                // `null` means old part at tail has already been used
                // below; skip
                oldTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newHead]) {
                // Old head matches new head; update in place
                newParts[newHead] = setChildPartValue(oldParts[oldHead], newValues[newHead]);
                oldHead++;
                newHead++;
            }
            else if (oldKeys[oldTail] === newKeys[newTail]) {
                // Old tail matches new tail; update in place
                newParts[newTail] = setChildPartValue(oldParts[oldTail], newValues[newTail]);
                oldTail--;
                newTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newTail]) {
                // Old head matches new tail; update and move to new tail
                newParts[newTail] = setChildPartValue(oldParts[oldHead], newValues[newTail]);
                insertPart(containerPart, newParts[newTail + 1], oldParts[oldHead]);
                oldHead++;
                newTail--;
            }
            else if (oldKeys[oldTail] === newKeys[newHead]) {
                // Old tail matches new head; update and move to new head
                newParts[newHead] = setChildPartValue(oldParts[oldTail], newValues[newHead]);
                insertPart(containerPart, oldParts[oldHead], oldParts[oldTail]);
                oldTail--;
                newHead++;
            }
            else {
                if (newKeyToIndexMap === undefined) {
                    // Lazily generate key-to-index maps, used for removals &
                    // moves below
                    newKeyToIndexMap = generateMap(newKeys, newHead, newTail);
                    oldKeyToIndexMap = generateMap(oldKeys, oldHead, oldTail);
                }
                if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
                    // Old head is no longer in new list; remove
                    removePart(oldParts[oldHead]);
                    oldHead++;
                }
                else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
                    // Old tail is no longer in new list; remove
                    removePart(oldParts[oldTail]);
                    oldTail--;
                }
                else {
                    // Any mismatches at this point are due to additions or
                    // moves; see if we have an old part we can reuse and move
                    // into place
                    const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
                    const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
                    if (oldPart === null) {
                        // No old part for this value; create a new one and
                        // insert it
                        const newPart = insertPart(containerPart, oldParts[oldHead]);
                        setChildPartValue(newPart, newValues[newHead]);
                        newParts[newHead] = newPart;
                    }
                    else {
                        // Reuse old part
                        newParts[newHead] = setChildPartValue(oldPart, newValues[newHead]);
                        insertPart(containerPart, oldParts[oldHead], oldPart);
                        // This marks the old part as having been used, so that
                        // it will be skipped in the first two checks above
                        oldParts[oldIndex] = null;
                    }
                    newHead++;
                }
            }
        }
        // Add parts for any remaining new values
        while (newHead <= newTail) {
            // For all remaining additions, we insert before last new
            // tail, since old pointers are no longer valid
            const newPart = insertPart(containerPart, newParts[newTail + 1]);
            setChildPartValue(newPart, newValues[newHead]);
            newParts[newHead++] = newPart;
        }
        // Remove any remaining unused old parts
        while (oldHead <= oldTail) {
            const oldPart = oldParts[oldHead++];
            if (oldPart !== null) {
                removePart(oldPart);
            }
        }
        // Save order of new parts for next round
        this._itemKeys = newKeys;
        // Directly set part value, bypassing it's dirty-checking
        setCommittedValue(containerPart, newParts);
        return noChange;
    }
}
/**
 * A directive that repeats a series of values (usually `TemplateResults`)
 * generated from an iterable, and updates those items efficiently when the
 * iterable changes based on user-provided `keys` associated with each item.
 *
 * Note that if a `keyFn` is provided, strict key-to-DOM mapping is maintained,
 * meaning previous DOM for a given key is moved into the new position if
 * needed, and DOM will never be reused with values for different keys (new DOM
 * will always be created for new keys). This is generally the most efficient
 * way to use `repeat` since it performs minimum unnecessary work for insertions
 * and removals.
 *
 * The `keyFn` takes two parameters, the item and its index, and returns a unique key value.
 *
 * ```js
 * html`
 *   <ol>
 *     ${repeat(this.items, (item) => item.id, (item, index) => {
 *       return html`<li>${index}: ${item.name}</li>`;
 *     })}
 *   </ol>
 * `
 * ```
 *
 * **Important**: If providing a `keyFn`, keys *must* be unique for all items in a
 * given call to `repeat`. The behavior when two or more items have the same key
 * is undefined.
 *
 * If no `keyFn` is provided, this directive will perform similar to mapping
 * items to values, and DOM will be reused against potentially different items.
 */
const repeat = directive(RepeatDirective);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const important = 'important';
// The leading space is important
const importantFlag = ' !' + important;
// How many characters to remove from a value, as a negative number
const flagTrim = 0 - importantFlag.length;
class StyleMapDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.ATTRIBUTE ||
            partInfo.name !== 'style' ||
            partInfo.strings?.length > 2) {
            throw new Error('The `styleMap` directive must be used in the `style` attribute ' +
                'and must be the only part in the attribute.');
        }
    }
    render(styleInfo) {
        return Object.keys(styleInfo).reduce((style, prop) => {
            const value = styleInfo[prop];
            if (value == null) {
                return style;
            }
            // Convert property names from camel-case to dash-case, i.e.:
            //  `backgroundColor` -> `background-color`
            // Vendor-prefixed names need an extra `-` appended to front:
            //  `webkitAppearance` -> `-webkit-appearance`
            // Exception is any property name containing a dash, including
            // custom properties; we assume these are already dash-cased i.e.:
            //  `--my-button-color` --> `--my-button-color`
            prop = prop.includes('-')
                ? prop
                : prop
                    .replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, '-$&')
                    .toLowerCase();
            return style + `${prop}:${value};`;
        }, '');
    }
    update(part, [styleInfo]) {
        const { style } = part.element;
        if (this._previousStyleProperties === undefined) {
            this._previousStyleProperties = new Set(Object.keys(styleInfo));
            return this.render(styleInfo);
        }
        // Remove old properties that no longer exist in styleInfo
        for (const name of this._previousStyleProperties) {
            // If the name isn't in styleInfo or it's null/undefined
            if (styleInfo[name] == null) {
                this._previousStyleProperties.delete(name);
                if (name.includes('-')) {
                    style.removeProperty(name);
                }
                else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style[name] = null;
                }
            }
        }
        // Add or update properties
        for (const name in styleInfo) {
            const value = styleInfo[name];
            if (value != null) {
                this._previousStyleProperties.add(name);
                const isImportant = typeof value === 'string' && value.endsWith(importantFlag);
                if (name.includes('-') || isImportant) {
                    style.setProperty(name, isImportant
                        ? value.slice(0, flagTrim)
                        : value, isImportant ? important : '');
                }
                else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style[name] = value;
                }
            }
        }
        return noChange;
    }
}
/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the
 * {@link StyleInfo styleInfo} object and adds the properties to the inline
 * style of the element.
 *
 * Property names with dashes (`-`) are assumed to be valid CSS
 * property names and set on the element's style object using `setProperty()`.
 * Names without dashes are assumed to be camelCased JavaScript property names
 * and set on the element's style object using property assignment, allowing the
 * style object to translate JavaScript-style names to CSS property names.
 *
 * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
 * '0'})` sets the `background-color`, `border-top` and `--size` properties.
 *
 * @param styleInfo
 * @see {@link https://lit.dev/docs/templates/directives/#stylemap styleMap code samples on Lit.dev}
 */
const styleMap = directive(StyleMapDirective);

/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class TemplateContentDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.CHILD) {
            throw new Error('templateContent can only be used in child bindings');
        }
    }
    render(template) {
        if (this._previousTemplate === template) {
            return noChange;
        }
        this._previousTemplate = template;
        return document.importNode(template.content, true);
    }
}
/**
 * Renders the content of a template element as HTML.
 *
 * Note, the template should be developer controlled and not user controlled.
 * Rendering a user-controlled template with this directive
 * could lead to cross-site-scripting vulnerabilities.
 */
const templateContent = directive(TemplateContentDirective);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const HTML_RESULT = 1;
class UnsafeHTMLDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        this._value = nothing;
        if (partInfo.type !== PartType.CHILD) {
            throw new Error(`${this.constructor.directiveName}() can only be used in child bindings`);
        }
    }
    render(value) {
        if (value === nothing || value == null) {
            this._templateResult = undefined;
            return (this._value = value);
        }
        if (value === noChange) {
            return value;
        }
        if (typeof value != 'string') {
            throw new Error(`${this.constructor.directiveName}() called with a non-string value`);
        }
        if (value === this._value) {
            return this._templateResult;
        }
        this._value = value;
        const strings = [value];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strings.raw = strings;
        // WARNING: impersonating a TemplateResult like this is extremely
        // dangerous. Third-party directives should not do this.
        return (this._templateResult = {
            // Cast to a known set of integers that satisfy ResultType so that we
            // don't have to export ResultType and possibly encourage this pattern.
            // This property needs to remain unminified.
            ['_$litType$']: this.constructor
                .resultType,
            strings,
            values: [],
        });
    }
}
UnsafeHTMLDirective.directiveName = 'unsafeHTML';
UnsafeHTMLDirective.resultType = HTML_RESULT;
/**
 * Renders the result as HTML, rather than text.
 *
 * The values `undefined`, `null`, and `nothing`, will all result in no content
 * (empty string) being rendered.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeHTML = directive(UnsafeHTMLDirective);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const SVG_RESULT = 2;
class UnsafeSVGDirective extends UnsafeHTMLDirective {
}
UnsafeSVGDirective.directiveName = 'unsafeSVG';
UnsafeSVGDirective.resultType = SVG_RESULT;
/**
 * Renders the result as SVG, rather than text.
 *
 * The values `undefined`, `null`, and `nothing`, will all result in no content
 * (empty string) being rendered.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeSVG = directive(UnsafeSVGDirective);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const isPromise = (x) => {
    return !isPrimitive(x) && typeof x.then === 'function';
};
// Effectively infinity, but a SMI.
const _infinity = 0x3fffffff;
class UntilDirective extends AsyncDirective {
    constructor() {
        super(...arguments);
        this.__lastRenderedIndex = _infinity;
        this.__values = [];
        this.__weakThis = new PseudoWeakRef(this);
        this.__pauser = new Pauser();
    }
    render(...args) {
        return args.find((x) => !isPromise(x)) ?? noChange;
    }
    update(_part, args) {
        const previousValues = this.__values;
        let previousLength = previousValues.length;
        this.__values = args;
        const weakThis = this.__weakThis;
        const pauser = this.__pauser;
        // If our initial render occurs while disconnected, ensure that the pauser
        // and weakThis are in the disconnected state
        if (!this.isConnected) {
            this.disconnected();
        }
        for (let i = 0; i < args.length; i++) {
            // If we've rendered a higher-priority value already, stop.
            if (i > this.__lastRenderedIndex) {
                break;
            }
            const value = args[i];
            // Render non-Promise values immediately
            if (!isPromise(value)) {
                this.__lastRenderedIndex = i;
                // Since a lower-priority value will never overwrite a higher-priority
                // synchronous value, we can stop processing now.
                return value;
            }
            // If this is a Promise we've already handled, skip it.
            if (i < previousLength && value === previousValues[i]) {
                continue;
            }
            // We have a Promise that we haven't seen before, so priorities may have
            // changed. Forget what we rendered before.
            this.__lastRenderedIndex = _infinity;
            previousLength = 0;
            // Note, the callback avoids closing over `this` so that the directive
            // can be gc'ed before the promise resolves; instead `this` is retrieved
            // from `weakThis`, which can break the hard reference in the closure when
            // the directive disconnects
            Promise.resolve(value).then(async (result) => {
                // If we're disconnected, wait until we're (maybe) reconnected
                // The while loop here handles the case that the connection state
                // thrashes, causing the pauser to resume and then get re-paused
                while (pauser.get()) {
                    await pauser.get();
                }
                // If the callback gets here and there is no `this`, it means that the
                // directive has been disconnected and garbage collected and we don't
                // need to do anything else
                const _this = weakThis.deref();
                if (_this !== undefined) {
                    const index = _this.__values.indexOf(value);
                    // If state.values doesn't contain the value, we've re-rendered without
                    // the value, so don't render it. Then, only render if the value is
                    // higher-priority than what's already been rendered.
                    if (index > -1 && index < _this.__lastRenderedIndex) {
                        _this.__lastRenderedIndex = index;
                        _this.setValue(result);
                    }
                }
            });
        }
        return noChange;
    }
    disconnected() {
        this.__weakThis.disconnect();
        this.__pauser.pause();
    }
    reconnected() {
        this.__weakThis.reconnect(this);
        this.__pauser.resume();
    }
}
/**
 * Renders one of a series of values, including Promises, to a Part.
 *
 * Values are rendered in priority order, with the first argument having the
 * highest priority and the last argument having the lowest priority. If a
 * value is a Promise, low-priority values will be rendered until it resolves.
 *
 * The priority of values can be used to create placeholder content for async
 * data. For example, a Promise with pending content can be the first,
 * highest-priority, argument, and a non_promise loading indicator template can
 * be used as the second, lower-priority, argument. The loading indicator will
 * render immediately, and the primary content will render when the Promise
 * resolves.
 *
 * Example:
 *
 * ```js
 * const content = fetch('./content.txt').then(r => r.text());
 * html`${until(content, html`<span>Loading...</span>`)}`
 * ```
 */
const until = directive(UntilDirective);
/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
// export type {UntilDirective};

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function when(condition, trueCase, falseCase) {
    return condition ? trueCase() : falseCase?.();
}

var t,e,n,s;function r(t,e){const n=Object.create(null),s=t.split(",");for(let t=0;t<s.length;t++)n[s[t]]=!0;return e?t=>!!n[t.toLowerCase()]:t=>!!n[t]}(e=t||(t={})).GET="get",e.HAS="has",e.ITERATE="iterate",(s=n||(n={})).SET="set",s.ADD="add",s.DELETE="delete",s.CLEAR="clear";const i=()=>{},c=Object.assign,o=Object.prototype.hasOwnProperty,u=(t,e)=>o.call(t,e),h=Array.isArray,f=t=>"[object Map]"===_(t),E=t=>"symbol"==typeof t,a=t=>null!==t&&"object"==typeof t,l=Object.prototype.toString,_=t=>l.call(t),T=t=>_(t).slice(8,-1),p=t=>"string"==typeof t&&"NaN"!==t&&"-"!==t[0]&&""+parseInt(t,10)===t,A=(t,e)=>!Object.is(t,e);var S,O,R,d,L,N;let g;(O=S||(S={}))[O.TEXT=1]="TEXT",O[O.CLASS=2]="CLASS",O[O.STYLE=4]="STYLE",O[O.PROPS=8]="PROPS",O[O.FULL_PROPS=16]="FULL_PROPS",O[O.HYDRATE_EVENTS=32]="HYDRATE_EVENTS",O[O.STABLE_FRAGMENT=64]="STABLE_FRAGMENT",O[O.KEYED_FRAGMENT=128]="KEYED_FRAGMENT",O[O.UNKEYED_FRAGMENT=256]="UNKEYED_FRAGMENT",O[O.NEED_PATCH=512]="NEED_PATCH",O[O.DYNAMIC_SLOTS=1024]="DYNAMIC_SLOTS",O[O.DEV_ROOT_FRAGMENT=2048]="DEV_ROOT_FRAGMENT",O[O.HOISTED=-1]="HOISTED",O[O.BAIL=-2]="BAIL",S.TEXT,S.CLASS,S.STYLE,S.PROPS,S.FULL_PROPS,S.HYDRATE_EVENTS,S.STABLE_FRAGMENT,S.KEYED_FRAGMENT,S.UNKEYED_FRAGMENT,S.NEED_PATCH,S.DYNAMIC_SLOTS,S.DEV_ROOT_FRAGMENT,S.HOISTED,S.BAIL,(d=R||(R={}))[d.ELEMENT=1]="ELEMENT",d[d.FUNCTIONAL_COMPONENT=2]="FUNCTIONAL_COMPONENT",d[d.STATEFUL_COMPONENT=4]="STATEFUL_COMPONENT",d[d.TEXT_CHILDREN=8]="TEXT_CHILDREN",d[d.ARRAY_CHILDREN=16]="ARRAY_CHILDREN",d[d.SLOTS_CHILDREN=32]="SLOTS_CHILDREN",d[d.TELEPORT=64]="TELEPORT",d[d.SUSPENSE=128]="SUSPENSE",d[d.COMPONENT_SHOULD_KEEP_ALIVE=256]="COMPONENT_SHOULD_KEEP_ALIVE",d[d.COMPONENT_KEPT_ALIVE=512]="COMPONENT_KEPT_ALIVE",d[d.COMPONENT=6]="COMPONENT",(N=L||(L={}))[N.STABLE=1]="STABLE",N[N.DYNAMIC=2]="DYNAMIC",N[N.FORWARDED=3]="FORWARDED",L.STABLE,L.DYNAMIC,L.FORWARDED;class D{constructor(t=!1){this.detached=t,this._active=!0,this.effects=[],this.cleanups=[],this.parent=g,!t&&g&&(this.index=(g.scopes||(g.scopes=[])).push(this)-1);}get active(){return this._active}run(t){if(this._active){const e=g;try{return g=this,t()}finally{g=e;}}}on(){g=this;}off(){g=this.parent;}stop(t){if(this._active){let e,n;for(e=0,n=this.effects.length;e<n;e++)this.effects[e].stop();for(e=0,n=this.cleanups.length;e<n;e++)this.cleanups[e]();if(this.scopes)for(e=0,n=this.scopes.length;e<n;e++)this.scopes[e].stop(!0);if(!this.detached&&this.parent&&!t){const t=this.parent.scopes.pop();t&&t!==this&&(this.parent.scopes[this.index]=t,t.index=this.index);}this.parent=void 0,this._active=!1;}}}function I(t){return new D(t)}function v(t,e=g){e&&e.active&&e.effects.push(t);}function C(){return g}function y(t){g&&g.cleanups.push(t);}const P=t=>{const e=new Set(t);return e.w=0,e.n=0,e},M=t=>(t.w&H)>0,w=t=>(t.n&H)>0,b=new WeakMap;let Y=0,H=1;const W=30;let F;const m=Symbol(""),V=Symbol("");class G{constructor(t,e=null,n){this.fn=t,this.scheduler=e,this.active=!0,this.deps=[],this.parent=void 0,v(this,n);}run(){if(!this.active)return this.fn();let t=F,e=k;for(;t;){if(t===this)return;t=t.parent;}try{return this.parent=F,F=this,k=!0,H=1<<++Y,Y<=W?(({deps:t})=>{if(t.length)for(let e=0;e<t.length;e++)t[e].w|=H;})(this):K(this),this.fn()}finally{Y<=W&&(t=>{const{deps:e}=t;if(e.length){let n=0;for(let s=0;s<e.length;s++){const r=e[s];M(r)&&!w(r)?r.delete(t):e[n++]=r,r.w&=~H,r.n&=~H;}e.length=n;}})(this),H=1<<--Y,F=this.parent,k=e,this.parent=void 0,this.deferStop&&this.stop();}}stop(){F===this?this.deferStop=!0:this.active&&(K(this),this.onStop&&this.onStop(),this.active=!1);}}function K(t){const{deps:e}=t;if(e.length){for(let n=0;n<e.length;n++)e[n].delete(t);e.length=0;}}function U(t,e){t.effect&&(t=t.effect.fn);const n=new G(t);e&&(c(n,e),e.scope&&v(n,e.scope)),e&&e.lazy||n.run();const s=n.run.bind(n);return s.effect=n,s}function j(t){t.effect.stop();}let k=!0;const x=[];function B(){x.push(k),k=!1;}function z(){x.push(k),k=!0;}function X(){const t=x.pop();k=void 0===t||t;}function q(t,e,n){if(k&&F){let e=b.get(t);e||b.set(t,e=new Map);let s=e.get(n);s||e.set(n,s=P()),J(s);}}function J(t,e){let n=!1;Y<=W?w(t)||(t.n|=H,n=!M(t)):n=!t.has(F),n&&(t.add(F),F.deps.push(t));}function Q(t,e,s,r,i,c){const o=b.get(t);if(!o)return;let u=[];if(e===n.CLEAR)u=[...o.values()];else if("length"===s&&h(t)){const t=Number(r);o.forEach(((e,n)=>{("length"===n||n>=t)&&u.push(e);}));}else switch(void 0!==s&&u.push(o.get(s)),e){case n.ADD:h(t)?p(s)&&u.push(o.get("length")):(u.push(o.get(m)),f(t)&&u.push(o.get(V)));break;case n.DELETE:h(t)||(u.push(o.get(m)),f(t)&&u.push(o.get(V)));break;case n.SET:f(t)&&u.push(o.get(m));}if(1===u.length)u[0]&&Z(u[0]);else {const t=[];for(const e of u)e&&t.push(...e);Z(P(t));}}function Z(t,e){const n=h(t)?t:[...t];for(const t of n)t.computed&&$(t);for(const t of n)t.computed||$(t);}function $(t,e){(t!==F||t.allowRecurse)&&(t.scheduler?t.scheduler():t.run());}const tt=r("__proto__,__v_isRef,__isVue"),et=new Set(Object.getOwnPropertyNames(Symbol).filter((t=>"arguments"!==t&&"caller"!==t)).map((t=>Symbol[t])).filter(E)),nt=ht(),st=ht(!1,!0),rt=ht(!0),it=ht(!0,!0),ct=ot();function ot(){const e={};return ["includes","indexOf","lastIndexOf"].forEach((n=>{e[n]=function(...e){const s=ee(this);for(let e=0,n=this.length;e<n;e++)q(s,t.GET,e+"");const r=s[n](...e);return -1===r||!1===r?s[n](...e.map(ee)):r};})),["push","pop","shift","unshift","splice"].forEach((t=>{e[t]=function(...e){B();const n=ee(this)[t].apply(this,e);return X(),n};})),e}function ut(e){const n=ee(this);return q(n,t.HAS,e),n.hasOwnProperty(e)}function ht(e=!1,n=!1){return function(s,r,i){if(r===Ft.IS_REACTIVE)return !e;if(r===Ft.IS_READONLY)return e;if(r===Ft.IS_SHALLOW)return n;if(r===Ft.RAW&&i===(e?n?Ut:Kt:n?Gt:Vt).get(s))return s;const c=h(s);if(!e){if(c&&u(ct,r))return Reflect.get(ct,r,i);if("hasOwnProperty"===r)return ut}const o=Reflect.get(s,r,i);return (E(r)?et.has(r):tt(r))?o:(e||q(s,t.GET,r),n?o:a(o)?e?Xt(o):Bt(o):o)}}function ft(t=!1){return function(e,s,r,i){let c=e[s];t||$t(r)||Zt(r)||(c=ee(c),r=ee(r));const o=h(e)&&p(s)?Number(s)<e.length:u(e,s),f=Reflect.set(e,s,r,i);return e===ee(i)&&(o?A(r,c)&&Q(e,n.SET,s,r):Q(e,n.ADD,s,r)),f}}const Et={get:nt,set:ft(),deleteProperty:function(t,e){const s=u(t,e);t[e];const r=Reflect.deleteProperty(t,e);return r&&s&&Q(t,n.DELETE,e,void 0),r},has:function(e,n){const s=Reflect.has(e,n);return E(n)&&et.has(n)||q(e,t.HAS,n),s},ownKeys:function(e){return q(e,t.ITERATE,h(e)?"length":m),Reflect.ownKeys(e)}},at={get:rt,set:(t,e)=>!0,deleteProperty:(t,e)=>!0},lt=c({},Et,{get:st,set:ft(!0)}),_t=c({},at,{get:it}),Tt=t=>t,pt=t=>Reflect.getPrototypeOf(t);function At(e,n,s=!1,r=!1){const i=ee(e=e[Ft.RAW]),c=ee(n);s||(n!==c&&q(i,t.GET,n),q(i,t.GET,c));const{has:o}=pt(i),u=r?Tt:s?re:se;return o.call(i,n)?u(e.get(n)):o.call(i,c)?u(e.get(c)):void(e!==i&&e.get(n))}function St(e,n=!1){const s=this[Ft.RAW],r=ee(s),i=ee(e);return n||(e!==i&&q(r,t.HAS,e),q(r,t.HAS,i)),e===i?s.has(e):s.has(e)||s.has(i)}function Ot(e,n=!1){return e=e[Ft.RAW],!n&&q(ee(e),t.ITERATE,m),Reflect.get(e,"size",e)}function Rt(t){t=ee(t);const e=ee(this);return pt(e).has.call(e,t)||(e.add(t),Q(e,n.ADD,t,t)),this}function dt(t,e){e=ee(e);const s=ee(this),{has:r,get:i}=pt(s);let c=r.call(s,t);c||(t=ee(t),c=r.call(s,t));const o=i.call(s,t);return s.set(t,e),c?A(e,o)&&Q(s,n.SET,t,e):Q(s,n.ADD,t,e),this}function Lt(t){const e=ee(this),{has:s,get:r}=pt(e);let i=s.call(e,t);i||(t=ee(t),i=s.call(e,t)),r&&r.call(e,t);const c=e.delete(t);return i&&Q(e,n.DELETE,t,void 0),c}function Nt(){const t=ee(this),e=0!==t.size,s=t.clear();return e&&Q(t,n.CLEAR,void 0,void 0),s}function gt(e,n){return function(s,r){const i=this,c=i[Ft.RAW],o=ee(c),u=n?Tt:e?re:se;return !e&&q(o,t.ITERATE,m),c.forEach(((t,e)=>s.call(r,u(t),u(e),i)))}}function Dt(e,n,s){return function(...r){const i=this[Ft.RAW],c=ee(i),o=f(c),u="entries"===e||e===Symbol.iterator&&o,h="keys"===e&&o,E=i[e](...r),a=s?Tt:n?re:se;return !n&&q(c,t.ITERATE,h?V:m),{next(){const{value:t,done:e}=E.next();return e?{value:t,done:e}:{value:u?[a(t[0]),a(t[1])]:a(t),done:e}},[Symbol.iterator](){return this}}}}function It(t){return function(...e){return t!==n.DELETE&&this}}function vt(){const t={get(t){return At(this,t)},get size(){return Ot(this)},has:St,add:Rt,set:dt,delete:Lt,clear:Nt,forEach:gt(!1,!1)},e={get(t){return At(this,t,!1,!0)},get size(){return Ot(this)},has:St,add:Rt,set:dt,delete:Lt,clear:Nt,forEach:gt(!1,!0)},s={get(t){return At(this,t,!0)},get size(){return Ot(this,!0)},has(t){return St.call(this,t,!0)},add:It(n.ADD),set:It(n.SET),delete:It(n.DELETE),clear:It(n.CLEAR),forEach:gt(!0,!1)},r={get(t){return At(this,t,!0,!0)},get size(){return Ot(this,!0)},has(t){return St.call(this,t,!0)},add:It(n.ADD),set:It(n.SET),delete:It(n.DELETE),clear:It(n.CLEAR),forEach:gt(!0,!0)};return ["keys","values","entries",Symbol.iterator].forEach((n=>{t[n]=Dt(n,!1,!1),s[n]=Dt(n,!0,!1),e[n]=Dt(n,!1,!0),r[n]=Dt(n,!0,!0);})),[t,s,e,r]}const[Ct,yt,Pt,Mt]=vt();function wt(t,e){const n=e?t?Mt:Pt:t?yt:Ct;return (e,s,r)=>s===Ft.IS_REACTIVE?!t:s===Ft.IS_READONLY?t:s===Ft.RAW?e:Reflect.get(u(n,s)&&s in e?n:e,s,r)}const bt={get:wt(!1,!1)},Yt={get:wt(!1,!0)},Ht={get:wt(!0,!1)},Wt={get:wt(!0,!0)};var Ft,mt;(mt=Ft||(Ft={})).SKIP="__v_skip",mt.IS_REACTIVE="__v_isReactive",mt.IS_READONLY="__v_isReadonly",mt.IS_SHALLOW="__v_isShallow",mt.RAW="__v_raw";const Vt=new WeakMap,Gt=new WeakMap,Kt=new WeakMap,Ut=new WeakMap;var jt,kt;function xt(t){return t[Ft.SKIP]||!Object.isExtensible(t)?jt.INVALID:function(t){switch(t){case"Object":case"Array":return jt.COMMON;case"Map":case"Set":case"WeakMap":case"WeakSet":return jt.COLLECTION;default:return jt.INVALID}}(T(t))}function Bt(t){return Zt(t)?t:Jt(t,!1,Et,bt,Vt)}function zt(t){return Jt(t,!1,lt,Yt,Gt)}function Xt(t){return Jt(t,!0,at,Ht,Kt)}function qt(t){return Jt(t,!0,_t,Wt,Ut)}function Jt(t,e,n,s,r){if(!a(t))return t;if(t[Ft.RAW]&&(!e||!t[Ft.IS_REACTIVE]))return t;const i=r.get(t);if(i)return i;const c=xt(t);if(c===jt.INVALID)return t;const o=new Proxy(t,c===jt.COLLECTION?s:n);return r.set(t,o),o}function Qt(t){return Zt(t)?Qt(t[Ft.RAW]):!(!t||!t[Ft.IS_REACTIVE])}function Zt(t){return !(!t||!t[Ft.IS_READONLY])}function $t(t){return !(!t||!t[Ft.IS_SHALLOW])}function te(t){return Qt(t)||Zt(t)}function ee(t){const e=t&&t[Ft.RAW];return e?ee(e):t}function ne(t){return ((t,e,n)=>{Object.defineProperty(t,e,{configurable:!0,enumerable:!1,value:n});})(t,Ft.SKIP,!0),t}(kt=jt||(jt={}))[kt.INVALID=0]="INVALID",kt[kt.COMMON=1]="COMMON",kt[kt.COLLECTION=2]="COLLECTION";const se=t=>a(t)?Bt(t):t,re=t=>a(t)?Xt(t):t;function ie(t){k&&F&&J((t=ee(t)).dep||(t.dep=P()));}function ce(t,e){const n=(t=ee(t)).dep;n&&Z(n);}function oe(t){let e=Bt({value:t});function n(t){return void 0===t?e.value:e.value=t}return Object.setPrototypeOf(n,new class extends Function{get value(){return e.value}set value(t){e.value=t;}get ref(){return e}}),n}var ue,he;class fe{constructor(t,e,n,s){this._setter=e,this.dep=void 0,this.__v_isRef=!0,this[ue]=!1,this._dirty=!0,this.effect=new G(t,(()=>{this._dirty||(this._dirty=!0,ce(this));})),this.effect.computed=this,this.effect.active=this._cacheable=!s,this[Ft.IS_READONLY]=n;}get value(){const t=ee(this);return ie(t),!t._dirty&&t._cacheable||(t._dirty=!1,t._value=t.effect.run()),t._value}set value(t){this._setter(t);}}function Ee(t,e,n=!1){let s,r;const c="function"==typeof t;c?(s=t,r=i):(s=t.get,r=t.set);return new fe(s,r,c||!r,n)}ue=Ft.IS_READONLY;const ae=Promise.resolve(),le=[];let _e=!1;const Te=()=>{for(let t=0;t<le.length;t++)le[t]();le.length=0,_e=!1;};class pe{constructor(t){let e;this.dep=void 0,this._dirty=!0,this.__v_isRef=!0,this[he]=!0;let n=!1,s=!1;this.effect=new G(t,(t=>{if(this.dep){if(t)e=this._value,n=!0;else if(!s){const t=n?e:this._value;s=!0,n=!1,r=()=>{this.effect.active&&this._get()!==t&&ce(this),s=!1;},le.push(r),_e||(_e=!0,ae.then(Te));}for(const t of this.dep)t.computed instanceof pe&&t.scheduler(!0);}var r;this._dirty=!0;})),this.effect.computed=this;}_get(){return this._dirty?(this._dirty=!1,this._value=this.effect.run()):this._value}get value(){return ie(this),ee(this)._get()}}function Ae(t){return new pe(t)}he=Ft.IS_READONLY;

// 驼峰格式转换成连字符格式。
// const humpName = ['abcAbc', 'AbcAbc', 'abcABCAbc','abcABAbc', 'abcAbcA', 'abcAbcABC', 'abcAbcAB']
// console.log(humpName.map((name)=>toHyphen(name))  )
// [LOG]: ["abc-abc", "abc-abc", "abc-abc-abc", "abc-ab-abc", "abc-abc-a", "abc-abc-abc", "abc-abc-ab"]
function toHyphen(name) {
    let s;
    // 结尾处的连续大写字符串：前添加连字符,并且转换为小写。
    s = name.replace(/(?<![A-Z])([A-Z]+)$/g, (str) => '-' + str.toLocaleLowerCase());
    //console.log(s)
    // 后面没有紧跟大写字符的字符：前添加连字符,并且转换为小写。
    s = s.replace(/([A-Z])(?![A-Z])/g, (str) => '-' + str.toLocaleLowerCase());
    //console.log(s)
    // 连续的一个或多个大写字符前添加连字号，并且把整串字符转换为小写
    s = s.replace(/([A-Z]+)/g, '-$1').toLowerCase();
    //console.log(s)
    // 如果字符串为Pasca命名，那么由于第一单词就大写，所以会产生打头的连字号，需要删除掉。
    if (s.startsWith('-'))
        s = s.substring(1);
    //console.log(s)
    return s;
}
// 连字符转驼峰
// const hyphenName = ['abc-abc', 'abc-abc', 'abc-abc', 'abc-abc-a', 'abc-abc-abc', 'abc-abc-ab']
// console.log(hyphenName.map((name)=>toHump(name))  )
// [LOG]: ["abcAbc", "abcAbc", "abcAbc", "abcAbcA", "abcAbcAbc", "abcAbcAb"]
function toHump(name) {
    return name.replace(/\-(\w)/g, function (all, letter) {
        return letter.toUpperCase();
    });
}
// 浏览器api中的window已经有了innerWidth、innerHeight、outerWidth和outerHeight的属性,
// 但是，没有width和height的属性，下面的win的尺寸返回的是documentElement客户区的尺寸。
const win = {
    width: window.document.documentElement.clientWidth,
    height: window.document.documentElement.clientHeight,
};
function getDocumentDimension(dimension) {
    const docEle = document.documentElement;
    return Math.max(document.body[`scroll${dimension}`], docEle[`scroll${dimension}`], document.body[`offset${dimension}`], docEle[`offset${dimension}`], docEle[`client${dimension}`]);
}
// 对于document的尺寸来说不存在inner、outer的概念。
const doc = {
    width() {
        return getDocumentDimension('Width');
    },
    height() {
        return getDocumentDimension('Height');
    },
    ready(callback) {
        const cb = () => setTimeout(callback, 0);
        // readyState的取值只有三个：loading, interactive, complete。
        // 通过domcument上的readystatechange事件，可以模拟load, DOMContentLoaded事件，还可以在DOMContentLoaded之前运行处理程序。
        if (document.readyState !== 'loading') {
            cb();
        }
        else {
            document.addEventListener('DOMContentLoaded', cb);
        }
    },
    id(id) {
        if (id.startsWith('#'))
            id = id.substring(1);
        return document.getElementById(id);
    }
};
// wrap有两种形式, 
// 1. 两个字符："<startChar><endChar>"， 如: "{}", "<>"等
// 2. 以空格分隔的两个字符串："<startString> <endString>，如"<p> </p>", "{ }"等
function _unwrap(wrap) {
    wrap = wrap.trim();
    if (wrap.length < 2)
        return this;
    let start = "";
    let end = "";
    if (wrap.length == 2) {
        start = wrap[0];
        end = wrap[1];
    }
    else {
        let se = wrap.split(' ');
        if (se.length == 2) {
            start = se[0];
            end = se[1];
        }
    }
    if (start === "" || end === "")
        return this;
    let str = this.trim();
    if (str.startsWith(start) && str.endsWith(end)) {
        return str.substring(start.length, str.length - end.length);
    }
    return this;
}
String.prototype.$unwrap = _unwrap;
function isNumeric(value) {
    if (typeof value === 'number') {
        return !isNaN(value) && isFinite(value);
    }
    return false;
}
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}
// 比较：todo
// NodeAPI: node.childNodes 是一个只读属性，返回包含指定节点的子节点的集合，该集合为即时更新的 NodeList 类型集合，包含文本和注释节点。
// element.children: Element.children 是一个只读属性，返回 一个 Node 的子elements ，是一个动态更新的 HTMLCollection，包含Element元素，不只是HTMLElement。
//
// HTMLTemplateElement API: templateElement.content属性返回<template>元素的模板内容 (一个 DocumentFragment)
// templateElement.content.children
// 对比如下实现，用template比用document要轻量。
// const tmp = document.implementation.createHTMLDocument('')
// tmp.body.innerHTML = htmlString
// return tmp.body.childNodes
function parseHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.childNodes;
}
function isDocument(value) {
    return !!value && value.nodeType === Node.DOCUMENT_NODE;
}
function isDocumentFragment(value) {
    return !!value && value.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}
function isElement(value) {
    return !!value && value.nodeType === Node.ELEMENT_NODE;
}

// to-do：
// 当没有提供baseTag参数时，可以根据基类提供baseTag的默认值的算法：
// 一级一级搜索clazz.__proto__....__proto__.name，匹配 /^HTML(\W+)Element$/, 如果先匹配到HTMLElement, 那么就没有baseTag。
// 如果匹配到其他的HTMLXxxElement, 那么事先根据API建立一个类名和标签的映射表，不用全部映射，有规律的名称通过字符串处理即可得到。
// 需要特别注意的是：
// 1. 一个HTMLXxxxElement可能对应多个html标记！映射表中只能以其中一个作为默认值。
// 2. HTMLElement也可以对应baseTag，比如<nav></nav>对应的DOM对接接口就是HTMLElement。
function defineElement(tagName, baseTag) {
    // 只有一个参数时，如果不包含 "-" 那么表示该参数是baseTag。
    if (arguments.length == 1 && !tagName.includes('-')) {
        baseTag = arguments[0];
        tagName = undefined;
    }
    return function (clazz) {
        if (tagName === undefined || tagName === '') {
            tagName = toHyphen(clazz.name);
        }
        if (baseTag === undefined) {
            customElements.define(tagName, clazz);
        }
        else {
            customElements.define(tagName, clazz, {
                extends: baseTag,
            });
        }
        return clazz;
    };
}

const legacyProperty = (options, proto, name) => {
    proto.constructor.properties[name] = options;
};
function watch(options) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (protoOrDescriptor, name) => {
        if (options === undefined)
            options = {};
        if (options.attribute === undefined) {
            options.attribute = false;
        }
        legacyProperty(options, protoOrDescriptor, name);
    };
}
function attr(options) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (protoOrDescriptor, name) => {
        legacyProperty({ attribute: true, ...options }, protoOrDescriptor, name);
    };
}

/** @format */
class ContextRequestEvent extends Event {
    /**
     *
     * @param context the context key to request
     * @param callback the callback that should be invoked when the context with the specified key is available
     */
    constructor(context, callback) {
        super("context-request", { bubbles: true, composed: true });
        this.context = context;
        this.callback = callback;
    }
}
function inject(context) {
    let contextValue;
    let event = new ContextRequestEvent(context, (value) => {
        contextValue = value;
    });
    this.dispatchEvent(event);
    return contextValue;
}
function provide(context, contextValue) {
    const onContextRequest = (ev) => {
        // Only call the callback if the context matches.
        // Also, in case an element is a consumer AND a provider
        // of the same context, we want to avoid the element to self-register.
        // The check on composedPath (as opposed to ev.target) is to cover cases
        // where the consumer is in the shadowDom of the provider (in which case,
        // event.target === this.host because of event retargeting).
        if (ev.context !== context || ev.composedPath()[0] === this) {
            return;
        }
        ev.stopPropagation();
        ev.callback(contextValue);
    };
    this.addEventListener("context-request", onContextRequest);
}
HTMLElement.prototype.$provide = provide;
HTMLElement.prototype.$inject = inject;

function mount(element, template, afterRender, beforeRender) {
    let container = null;
    if (typeof element == "string") {
        const selector = element.trim();
        if (selector.startsWith("#")) {
            container = document.getElementById(selector.substring(1));
        }
        if (!container) {
            container = document.querySelector(selector);
        }
    }
    else
        container = element;
    if (!container)
        return; // container maybe null
    let isFirst = true;
    asyncEffect(() => {
        if (beforeRender && !beforeRender(isFirst)) {
            return;
        }
        const rootPart = render(template(), container);
        afterRender?.(rootPart, isFirst);
        isFirst = false;
    });
}
function asyncEffect(fn) {
    // 挂起，指微任务已经加入到js的任务队列，但是尚未运行。
    const effect = new G(fn);
    let isUpdatePending = false;
    function scheduler() {
        // 如果有挂起的任务，那么直接返回，等待挂起任务的执行时一并运行更新。
        if (isUpdatePending)
            return;
        // 如果没有挂起的任务，那么添加更新任务到执行队列。
        window.queueMicrotask(() => {
            // 更新任务一旦开始运行，状态就不再是挂起了，那么后续的更新就要启动新的更新任务。
            isUpdatePending = false;
            effect.run();
        });
        // 添加任务到队列到任务尚未执行这段时间的状态是挂起。
        isUpdatePending = true;
    }
    //const effect = new ReactiveEffect(scheduler)
    effect.scheduler = scheduler;
    effect.run();
}
const css = (strings, ...values) => String.raw({ raw: strings }, ...values);
function attachCss(styles) {
    document.head.insertAdjacentHTML("beforeend", `<style>${styles}</style>`);
}

/** @format */
// attribute取值为真时，设置为""空字符串。
const attributeTrueValue = "";
function toAttribute(value) {
    const type = typeof value;
    let attrValue = null;
    switch (type) {
        case "boolean":
            attrValue = value ? attributeTrueValue : null;
            break;
        case "undefined":
            attrValue = null;
            break;
        case "bigint":
        case "number":
        case "string":
        case "symbol":
            attrValue = String(value);
            break;
        case "object":
        case "function":
            attrValue = value == null ? null : JSON.stringify(value);
            break;
    }
    return attrValue;
}
function fromAttribute(value, type) {
    if (value === null) {
        return value;
    }
    let propValue = value;
    switch (type) {
        case "boolean":
            propValue = value !== null;
            break;
        case "bigint":
            propValue = value === null ? null : BigInt(value);
        case "number":
            propValue = value === null ? null : Number(value);
            break;
        case "symbol":
            propValue = Symbol.for(value);
            break;
        case "object":
        case "function":
            // Do *not* generate exception when invalid JSON is set as elements
            // don't normally complain on being mis-configured.
            // TODO(sorvell): Do generate exception in *dev mode*.
            try {
                // Assert to adhere to Bazel's "must type assert JSON parse" rule.
                propValue = JSON.parse(value);
            }
            catch (e) {
                propValue = null;
            }
            break;
    }
    return propValue;
}
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
const notEqual = (value, old) => {
    // This ensures (old==NaN, value==NaN) always returns false
    return old !== value && (old === old || value === value);
};
// shadowRootOptions在createRenderRoot()中使用，createRenderRoot的默认行为是：
// 当shadowRootOptions = undefined时，shadowRoot取值为this，即元素自身，不使用ShadowDOM技术来构建元素。
// 当shadowRootOptions非空时，shadowRoot取值为Element.attachShadow(shadowRootOptions)的返回值。
function customizeElement(superClass = HTMLElement, shadowRootOptions, isReactive) {
    class BaseElement extends superClass {
        static { this.properties = {}; }
        // 映射表<attribute-name, properyName>
        // a
        static { this.__attributeToPropertyMap = new Map(); }
        // 获取propery对应的attribute名称。
        static __attributeNameForProperty(name, options) {
            const attribute = options.attribute;
            // 如果 attribute===undefined, 那么返回对应propName的短划线名称。
            return attribute === false
                ? undefined
                : typeof attribute === "string"
                    ? attribute
                    : typeof name === "string"
                        ? toHyphen(name)
                        : undefined;
        }
        // 监听property对应的attribute的改变。
        static get observedAttributes() {
            const attributes = [];
            for (const [p, opt] of Object.entries(this.properties)) {
                if (opt.attribute == false) {
                    continue;
                }
                const attr = this.__attributeNameForProperty(p, opt);
                if (attr !== undefined) {
                    this.__attributeToPropertyMap.set(attr, p);
                    attributes.push(attr);
                }
            }
            return attributes;
        }
        defineProperties() {
            for (const [p, propOpt] of Object.entries(this.constructor.properties)) {
                // 可以在注解或者静态属性properties中提供实例property的初始值。
                // 否则，如果是通过class的声明语法提供初始值，那么只有在类装饰器中获取。
                this.constructor
                    .prototype;
                if (propOpt.initValue !== undefined) {
                    this.props[p] = propOpt.initValue;
                }
                // 说明：下述语句事实上永远不会执行，不论是否使用 useDefineForClassFields 来生成属性，执行defineProperties时还在基类的构造函数中，只有执行到子类的构造函数时才产生子类的自定义属性（两种方式都一样，一种是在构造中生成 this.xxx=vvvv语句，一种是在this实例中生成属性描述符）
                // else if (this[p] !== undefined ){
                //     (this as BaseElement).props[p] = this[p]
                // }
                const descriptor = this.getPropertyDescriptor(p, propOpt);
                if (descriptor !== undefined) {
                    Object.defineProperty(this, p, descriptor);
                }
            }
        }
        // 根据属性定义返回属性描述符
        getPropertyDescriptor(name, options) {
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                get() {
                    return this.props[name];
                },
                set(value) {
                    const oldValue = this.props[name];
                    // 第一次给属性赋值时，如果属性定义中尚未设置初始值，那么设为初始值，同时给没有设置的属性定义赋初始值。
                    if (oldValue == undefined && value != undefined) {
                        this.props[name] = value;
                        const opt = this.constructor
                            .properties[name.toString()];
                        if (opt.initValue == undefined) {
                            if (opt.type == undefined) {
                                opt.type = typeof value;
                            }
                            if (opt.attribute == undefined) {
                                opt.attribute = value instanceof Object ? false : true;
                            }
                        }
                        return;
                    }
                    const hasChanged = options.hasChanged || notEqual;
                    if (hasChanged(value, oldValue)) {
                        this.props[name] = value;
                    }
                },
                configurable: true,
                enumerable: true,
            };
        }
        // 用实例方法方法属性的定义。
        getPropertyOptions(name) {
            return this.constructor.properties[name.toString()];
        }
        /* See [using the lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)
         * on MDN for more information about the `attributeChangedCallback`.
         */
        // attribute改变时，同步设置对应的property的值。
        attributeChangedCallback(name, _old, value) {
            const ctor = this.constructor;
            // Note, hint this as an `AttributeMap` so closure clearly understands
            // the type; it has issues with tracking types through statics
            const propName = ctor.__attributeToPropertyMap.get(name);
            if (propName !== undefined) {
                const options = this.getPropertyOptions(propName);
                // ？？observedAttributes()是每次attribute发生变化时就调用，还是一次性调用？
                // 在静态方法observedAttributes()的返回值中指明的属性可能包含了options.attribute为false的property。
                if (options.attribute === false)
                    return;
                const fromAttr = options.fromAttribute
                    ? options.fromAttribute
                    : fromAttribute;
                const newValue = fromAttr(value, options.type ? options.type : typeof this.props[propName]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                );
                // !!重要：避免循环调用，要保证 value === fromAttr(toAttr(value))
                if (this.props[propName] != newValue) {
                    this.props[propName] = newValue;
                }
            }
        }
        #previousStyles;
        renderClasses() {
            if (this.innateClasses.add) {
                let addList = this.innateClasses.add.split(" ");
                for (const add of addList) {
                    if (add.trim().length == 0)
                        continue;
                    this.classList.toggle(add, true);
                }
            }
            if (this.innateClasses.remove) {
                let removeList = this.innateClasses.remove.split(" ");
                for (const remove of removeList) {
                    this.classList.toggle(remove, false);
                }
            }
        }
        renderStyles() {
            const important = "important";
            // The leading space is important
            const importantFlag = " !" + important;
            // How many characters to remove from a value, as a negative number
            const flagTrim = 0 - importantFlag.length;
            let isFirst = false;
            if (this.#previousStyles === undefined) {
                this.#previousStyles = new Set(Object.keys(this.innateStyles));
                isFirst = true;
            }
            // Remove old properties that no longer exist in styleInfo
            if (!isFirst) {
                for (const name of this.#previousStyles) {
                    // If the name isn't in styleInfo or it's null/undefined
                    if (this.innateStyles[name] == null) {
                        this.#previousStyles.delete(name);
                        if (name.includes("--")) {
                            this.style.removeProperty(name);
                        }
                        else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            this.style[name] = null;
                        }
                    }
                }
            }
            // Add or update properties
            for (const name in this.innateStyles) {
                const value = this.innateStyles[name];
                if (value != null) {
                    this.#previousStyles.add(name);
                    const isImportant = typeof value === "string" &&
                        value.endsWith(importantFlag);
                    if (name.includes("-") || isImportant) {
                        this.style.setProperty(name, isImportant
                            ? value.slice(0, flagTrim)
                            : value, isImportant ? important : "");
                    }
                    else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        this.style[name] = value;
                    }
                }
            }
        }
        // 更新attribute的值。
        updateAttribute() {
            const ctor = this.constructor;
            ctor.__attributeToPropertyMap.forEach((p, attr) => {
                if (attr !== undefined) {
                    const propOpt = this.getPropertyOptions(p);
                    const toAttr = propOpt.toAttribute
                        ? propOpt.toAttribute
                        : toAttribute;
                    const newValue = toAttr(this.props[p.toString()]);
                    if (this.getAttribute(attr) == newValue) {
                        return;
                    }
                    if (newValue == null) {
                        this.removeAttribute(attr);
                    }
                    else {
                        this.setAttribute(attr, newValue);
                    }
                }
            });
            this.renderClasses();
            this.renderStyles();
        }
        constructor(...args) {
            super();
            this.__callBackhooks = new Map();
            this.props = Bt({});
            this.innateClasses = Bt({});
            this.innateStyles = Bt({});
            // 目前的实现必须在TSC编译时把defineProperties设置为false，否则，子类会把下述属性定义覆盖掉。
            // todo：解决的方法是同时使用属性和类的装饰器，在装饰器中，删除掉自动生成的ClassFields，同时把删除掉的ClassField中的初始值复制到props中。
            this.defineProperties();
        }
        createRenderRoot() {
            if (shadowRootOptions === undefined) {
                return this;
            }
            const renderRoot = this.shadowRoot ?? this.attachShadow(shadowRootOptions);
            return renderRoot;
        }
        // 子类中覆盖下述方法时，可以在supper.connectedCallback()之前加入代码，以便完成无法在构造函数中完成的初始化工作，
        // 比如，在构造中无法访问元素在html文本中声明的属性值。
        connectedCallback() {
            // create renderRoot before first update.
            if (this.renderRoot === undefined) {
                this.renderRoot = this.createRenderRoot();
            }
            if (isReactive) {
                // 组件支持响应式更新DOM时，当响应式数据发生变化时，自动生成异步任务来调用render()刷新视图。
                let isFirst = true;
                asyncEffect(() => {
                    // this.__callBackhooks
                    //     .get("BeforeRender")
                    //     ?.forEach((cb) => cb(isFirst));
                    this.render(isFirst);
                    // this.__callBackhooks
                    //     .get("AfterRender")
                    //     ?.forEach((cb) => cb(isFirst));
                    isFirst = false;
                });
            }
            // 不支持响应式更新DOM时，render仅在组件构建时执行一次。
            // 此时render()如需实现再次调用时刷新视图的功能。
            else {
                // this.__callBackhooks.get("BeforeRender")?.forEach((cb) => cb());
                this.render();
                // this.__callBackhooks.get("AfterRender")?.forEach((cb) => cb());
            }
            this.__callBackhooks.get("Connected")?.forEach((cb) => cb());
        }
        /**
         * Allows for `super.disconnectedCallback()` in extensions while
         * reserving the possibility of making non-breaking feature additions
         * when disconnecting at some point in the future.
         * @category lifecycle
         */
        disconnectedCallback() {
            this.__callBackhooks.get("Disconnected")?.forEach((cb) => cb());
        }
        // render()的默认实现是调用lit-html中的render方法实现挂载刷新视图的功能。
        render(isFirst) {
            this.__callBackhooks
                .get("BeforeRender")
                ?.forEach((cb) => cb(isFirst));
            this.updateAttribute();
            if (this.template) {
                render(this.template(), this.renderRoot, { host: this });
            }
            this.__callBackhooks
                .get("AfterRender")
                ?.forEach((cb) => cb(isFirst));
        }
        onCallback(hook, cb) {
            if (!this.__callBackhooks.has(hook)) {
                this.__callBackhooks.set(hook, []);
            }
            this.__callBackhooks.get(hook).push(cb);
        }
    } // end of class BaseElement
    return BaseElement;
}
const reactiveElement = (superClass = HTMLElement, shadowRootOptions) => customizeElement(superClass, shadowRootOptions, true);

const systemModifiers = ['ctrl', 'shift', 'alt', 'meta'];
const modifierGuards = {
    stop: (e) => e.stopPropagation(),
    prevent: (e) => e.preventDefault(),
    self: (e) => e.target !== e.currentTarget,
    ctrl: (e) => !e.ctrlKey,
    shift: (e) => !e.shiftKey,
    alt: (e) => !e.altKey,
    meta: (e) => !e.metaKey,
    left: (e) => 'button' in e && e.button !== 0,
    middle: (e) => 'button' in e && e.button !== 1,
    right: (e) => 'button' in e && e.button !== 2,
    exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m)),
};
// Kept for 2.x compat.
// Note: IE11 compat for `spacebar` and `del` is removed for now.
const keyNames = {
    esc: 'escape',
    space: ' ',
    up: 'arrow-up',
    left: 'arrow-left',
    right: 'arrow-right',
    down: 'arrow-down',
    delete: 'backspace',
};
const cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return ((str) => {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    });
};
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase());
// 可以直接使用 KeyboardEvent.key (https://cn.vuejs.org/guide/essentials/event-handling.html#key-modifiers) 暴露的按键名称作为修饰符，但需要转为 kebab-case 形式。
const withKeys = (fn, modifiers) => {
    return (event) => {
        if (!('key' in event)) {
            return;
        }
        const eventKey = hyphenate(event.key);
        if (modifiers.some((k) => k === eventKey || keyNames[k] === eventKey)) {
            return fn(event);
        }
    };
};
const listenerOptions = ['once', 'passive', 'capture'];
function on(fn, modifiers) {
    const options = {};
    const guardModifiers = [];
    const keyOptions = [];
    const guards = Object.keys(modifierGuards);
    for (const str of modifiers.trim().split(/\s+/)) {
        if (guards.includes(str)) {
            guardModifiers.push(str);
        }
        else if (listenerOptions.includes(str)) {
            options[str] = true;
        }
        else {
            keyOptions.push(str);
        }
    }
    // 如果guard(event, modifiers)返回真值，那么原始的提供的事件处理程序将不会被执行。
    let handler = (event, ...args) => {
        for (const mod of guardModifiers) {
            const guard = modifierGuards[mod];
            // guard为stop和prevent时，guard(...)返回值为假（void）, 所以不会导致return。
            if (guard && guard(event, guardModifiers))
                return;
        }
        return fn(event, args);
    };
    // 如果设置了keyOptions, 那么event.key必须有值，且event.key包含在指定的keyOptions中，否则不触发事件。
    if (keyOptions.length > 0) {
        handler = withKeys(handler, keyOptions);
    }
    return { handleEvent: handler, ...options };
}

function isSameArray(a1, a2) {
    if (!Array.isArray(a1) || !Array.isArray(a2))
        return false;
    if (a1.length != a2.length)
        return false;
    a1.forEach((item, index) => {
        if (item != a2[index])
            return false;
    });
    return true;
}
// input取值为object时，默认object有value字段。
function getValue(input) {
    if (typeof input === 'function')
        return input();
    if (Array.isArray(input)) {
        if (!input[1])
            input[1] = "value";
        return input[0][input[1]];
    }
}
function setValue(input, value) {
    if (typeof input === 'function') {
        input(value);
        return;
    }
    if (Array.isArray(input)) {
        if (!input[1])
            input[1] = "value";
        input[0][input[1]] = value;
        return;
    }
}
function inputEventName(element) {
    const tag = element.tagName.toLowerCase();
    if (tag === 'select')
        return 'change';
    if (tag === 'textarea')
        return 'input';
    if (tag === 'input') {
        const type = element['type'];
        return type == 'checkbox' || type == 'radio'
            ? 'change'
            : 'input';
    }
    return 'update';
}
class RadioDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.PROPERTY) {
            throw new Error('Error');
        }
    }
    // ？？
    // 可能对于自定义组件才会执行该方法，在浏览器中跟踪时，对于input来说，发现下述方法未被执行。
    render(inputValue, inputOptions) {
        return nothing;
    }
    update(part, args) {
        this.element = part.element;
        this.inputValue = args[0];
        const checkProp = part.name;
        const { eventName = inputEventName(this.element), valueProp = 'value', modifiers, } = args[1] || {};
        const checked = this.element[valueProp] == getValue(this.inputValue);
        if (this.element[checkProp] != checked) {
            this.element[checkProp] = checked;
        }
        if (isSameArray(this._args, args))
            return noChange;
        this._args = args;
        // 注册事件，跟踪用户的交互输入
        this.element.addEventListener(eventName, () => {
            if (this.element[checkProp])
                setValue(this.inputValue, this.element[valueProp]);
        });
        return noChange;
    }
}
class CheckDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.PROPERTY) {
            throw new Error('Error');
        }
    }
    render(inputValue, inputOptions) {
        return nothing;
    }
    update(part, args) {
        this.element = part.element;
        this.inputValue = args[0];
        const checkProp = part.name;
        const { eventName = inputEventName(this.element), valueProp = 'value', modifiers, } = args[1] || {};
        this.element[checkProp] = this.inputValue.includes(this.element[valueProp]);
        if (isSameArray(this._args, args))
            return noChange;
        this._args = args;
        // 注册事件，跟踪用户的交互输入
        this.element.addEventListener(eventName, () => {
            const pos = this.inputValue.indexOf(this.element[valueProp]);
            if (this.element[checkProp]) {
                if (pos < 0)
                    this.inputValue.push(this.element[valueProp]);
            }
            else {
                if (pos >= 0)
                    this.inputValue.splice(pos, 1);
            }
        });
        return noChange;
    }
}
class ValueDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.PROPERTY) {
            throw new Error('Error');
        }
    }
    render(inputValue, inputOptions) {
        return getValue(inputValue);
    }
    update(part, args) {
        this.element = part.element;
        this.inputValue = args[0];
        const valueProp = part.name;
        const { eventName = inputEventName(this.element), modifiers } = args[1] || {};
        this.element[valueProp] = getValue(this.inputValue);
        // 避免重复注册事件
        if (isSameArray(this._args, args))
            return noChange;
        this._args = args;
        // 注册事件，跟踪用户的交互输入
        const eventHandler = () => {
            setValue(this.inputValue, this.element[valueProp]);
        };
        this.element.addEventListener(eventName, eventHandler);
        return noChange;
    }
}
// Create the directive function
const value = directive(ValueDirective);
const radio = directive(RadioDirective);
const check = directive(CheckDirective);
Object.defineProperty(HTMLSelectElement.prototype, '$values', {
    get() {
        if (this.options && this.multiple) {
            const options = [...this.options];
            return options
                .filter((option) => option.selected)
                .map((option) => option.value);
        }
        else {
            return this.value;
        }
    },
    set(value) {
        const values = value instanceof Array ? value : [value];
        const options = [...this.options];
        options.map((option) => {
            if (values.includes(option.value)) {
                option.selected = true;
            }
        });
    },
    enumerable: true,
    configurable: false,
});

// 渲染的结果是一个自定义的template元素，该元素可以承载一个参数化的渲染函数。
class ParameterTemplate extends HTMLTemplateElement {
    constructor() {
        super();
        this.render = null;
    }
}
customElements.define('parameter-template', ParameterTemplate, { extends: 'template' });
// 在子元素位置使用的指令
class RenderTemplateDirective extends Directive {
    constructor(partInfo) {
        super(partInfo);
        //this.parent = partInfo.parentNode as HTMLElement
    }
    // 把动态模板函数放到template元素的属性中。
    // todo：
    // 自动同一个父元素下兄弟元素中带同样slot属性名的template元素（如果不是参数化的模板，普通的template元素也可以）。
    render(name, defaultTemplate, ...params) {
        console.log("\n Render...");
        const template = Array.from(this.parent.children).find((e) => {
            if (e.tagName == 'TEMPLATE') {
                return e;
            }
        });
        this.parent.children;
        if (template) {
            //return templateContent(template as HTMLTemplateElement)
            const t = template.render;
            if (t != null)
                return t(params);
        }
        else if (defaultTemplate) {
            return defaultTemplate(params);
        }
        else
            return html ``;
    }
    update(part, [name, defaultTemplate, ...params]) {
        this.parent = part.parentNode;
        return this.render(name, defaultTemplate, ...params);
    }
}
const renderTemplate = directive(RenderTemplateDirective);

export { AsyncDirective, AsyncReplaceDirective, ContextRequestEvent, Directive, D as EffectScope, m as ITERATE_KEY, ParameterTemplate, PartType, G as ReactiveEffect, Ft as ReactiveFlags, TemplateResultType, t as TrackOpTypes, n as TriggerOpTypes, UnsafeHTMLDirective, UntilDirective, _$LH, asyncAppend, asyncEffect, asyncReplace, attachCss, attr, cache, check, choose, classMap, clearPart, Ee as computed, createRef, css, customizeElement, Ae as deferredComputed, defineElement, directive, doc, U as effect, I as effectScope, z as enableTracking, fromAttribute, getCommittedValue, C as getCurrentScope, getDirectiveClass, guard, html, ifDefined, inject, insertPart, isDirectiveResult, isDocument, isDocumentFragment, isElement, isNumeric, isPlainObject, isPrimitive, te as isProxy, Qt as isReactive, Zt as isReadonly, $t as isShallow, isSingleExpression, isTemplateResult, join, keyed, live, map, ne as markRaw, mount, noChange, notEqual, nothing, on, y as onScopeDispose, parseHTML, B as pauseTracking, provide, radio, range, Bt as reactive, reactiveElement, oe as reactiveRef, Xt as readonly, ref, removePart, render, renderTemplate, repeat, X as resetTracking, setChildPartValue, setCommittedValue, zt as shallowReactive, qt as shallowReadonly, j as stop, styleMap, svg, templateContent, toAttribute, toHump, toHyphen, ee as toRaw, q as track, Q as trigger, unsafeHTML, unsafeSVG, until, value, watch, when, win };
