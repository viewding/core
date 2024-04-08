/** @format */

import Color from "colorjs.io";

// color

export function mixColor(color1: string, color2: string, percent?: number) {
    if (!percent) percent = 50 / 100;
    const color = Color.mix(color1, color2, percent, {
        space: "srgb",
        outputSpace: "srgb",
    });
    return new Color(color).toString({ format: "hex" });
}

export function shadeColor(color: string, percent: number) {
    return mixColor(color, "#000", percent);
}

export function tintColor(color: string, percent: number) {
    return mixColor(color, "#fff", percent);
}

export function shiftColor(color: string, percent: number) {
    return percent > 0
        ? shadeColor(color, percent)
        : tintColor(color, -percent);
}

// Return opaque color
// opaque(#fff, rgba(0, 0, 0, .5)) => #808080
// function opaque($background, $foreground) {
//     @return mix(rgba($foreground, 1), $background, opacity($foreground) * 100%);
// }

export function toColorRgb(color: string) {
    const srgb = new Color(color).srgb;
    return `${Math.round(srgb.r * 255)}, ${Math.round(
        srgb.g * 255
    )}, ${Math.round(srgb.b * 255)}`;
}

// The contrast ratio to reach against white, to determine if color changes from "light" to "dark". Acceptable values for WCAG 2.0 are 3, 4.5 and 7.
// See https://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast
export function calcRatio(background: string, foreground: string) {
    return new Color(background).contrastWCAG21(new Color(foreground));
}

export const colors = {
    blue: "#0d6efd",
    indigo: "#6610f2",
    purple: "#6f42c1",
    pink: "#d63384",
    red: "#dc3545",
    orange: "#fd7e14",
    yellow: "#ffc107",
    green: "#198754",
    teal: "#20c997",
    cyan: "#0dcaf0",

    light10: "#ced4da",
    light20: "#dee2e6",
    light30: "#e9ecef",
    light40: "#f8f9fa",
    white: "#fff",

    gray: "#adb5bd",

    dark10: "#6c757d",
    dark20: "#495057",
    dark30: "#343a40",
    dark40: "#212529",
    black: "#000",
};

export function textColor(background: string) {
    const light = calcRatio(background, colors.light40);
    if (light > 4.5) return colors.light40;
    const dark = calcRatio(background, colors.dark40);
    return dark >= light ? colors.dark40 : colors.light40;
}

