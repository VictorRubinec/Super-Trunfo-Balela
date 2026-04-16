/**
 * Utilitários de cor para derivar paleta a partir de uma cor base.
 * Usado pelos modelos de carta para aplicar o tema de cor.
 */

/** Hex → HSL (valores em degrees / %) */
export function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** HSL → Hex */
export function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Deriva paleta de 5 tons a partir de uma cor base hex.
 * @param {string} hex  — cor base (ex: '#7B2FBE')
 * @returns {{ base, dark, darker, light, lighter }}
 */
export function deriveColors(hex) {
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) hex = '#7B2FBE';
    const { h, s, l } = hexToHsl(hex);
    return {
        base:    hex,
        dark:    hslToHex(h, Math.min(s + 5,  100), Math.max(l - 18, 6)),
        darker:  hslToHex(h, Math.min(s + 10, 100), Math.max(l - 34, 3)),
        light:   hslToHex(h, Math.max(s - 8,  0),   Math.min(l + 18, 92)),
        lighter: hslToHex(h, Math.max(s - 18, 0),   Math.min(l + 32, 96)),
    };
}

/** Gera o bloco de CSS variables inline para um card element */
export function colorVars(hex) {
    const c = deriveColors(hex);
    return `--c-base:${c.base};--c-dark:${c.dark};--c-darker:${c.darker};--c-light:${c.light};--c-lighter:${c.lighter};`;
}
