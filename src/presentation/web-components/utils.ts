/** Hex → HSL */
export function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
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
export function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Deriva paleta */
export function deriveColors(hex: string) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) hex = '#7B2FBE';
  const { h, s, l } = hexToHsl(hex);
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.75;

  return {
      base:    hex,
      dark:    hslToHex(h, Math.min(s + 5,  100), Math.max(l - 18, 6)),
      darker:  hslToHex(h, Math.min(s + 10, 100), Math.max(l - 34, 3)),
      light:   hslToHex(h, Math.max(s - 8,  0),   Math.min(l + 18, 92)),
      lighter: hslToHex(h, Math.max(s - 18, 0),   Math.min(l + 32, 96)),
      isLight
  };
}

/** Gera CSS variables */
export function getColorVars(hex: string) {
  const c = deriveColors(hex);
  const contrast = c.isLight ? '#000000' : '#ffffff';
  const titleShadow = c.isLight ? '#000000' : (c.darker || 'rgba(0,0,0,0.8)');

  return `
    --c-base: ${c.base};
    --c-dark: ${c.dark};
    --c-darker: ${c.darker};
    --c-light: ${c.light};
    --c-lighter: ${c.lighter};
    --c-contrast: ${contrast};
    --c-shadow-title: ${titleShadow};
  `;
}
