/**
 * Convert RGB integer (0-16777215) to hex string (#RRGGBB)
 * @param {number} rgbInt - RGB integer value (0-16777215)
 * @returns {string} Hex color string (#RRGGBB)
 */
export function rgbIntToHex(rgbInt) {
  const r = Math.floor(rgbInt / 65536)
  const g = Math.floor((rgbInt % 65536) / 256)
  const b = rgbInt % 256
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Convert hex string to RGB integer
 * @param {string} hex - Hex color string (#RRGGBB or RRGGBB)
 * @returns {number} RGB integer value (0-16777215)
 */
export function hexToRgbInt(hex) {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return r * 65536 + g * 256 + b
}

/**
 * Convert RGB integer to RGB object
 * @param {number} rgbInt - RGB integer value (0-16777215)
 * @returns {{r: number, g: number, b: number}} RGB object
 */
export function rgbIntToRgb(rgbInt) {
  const r = Math.floor(rgbInt / 65536)
  const g = Math.floor((rgbInt % 65536) / 256)
  const b = rgbInt % 256
  return { r, g, b }
}

/**
 * Convert RGB values to RGB integer
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {number} RGB integer value (0-16777215)
 */
export function rgbToRgbInt(r, g, b) {
  return Math.round(r) * 65536 + Math.round(g) * 256 + Math.round(b)
}

/**
 * Convert HSV to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} v - Value/Brightness (0-100)
 * @returns {{r: number, g: number, b: number}} RGB object
 */
export function hsvToRgb(h, s, v) {
  h = h / 360
  s = s / 100
  v = v / 100

  const c = v * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = v - c

  let r, g, b

  if (h >= 0 && h < 1 / 6) {
    r = c
    g = x
    b = 0
  } else if (h >= 1 / 6 && h < 2 / 6) {
    r = x
    g = c
    b = 0
  } else if (h >= 2 / 6 && h < 3 / 6) {
    r = 0
    g = c
    b = x
  } else if (h >= 3 / 6 && h < 4 / 6) {
    r = 0
    g = x
    b = c
  } else if (h >= 4 / 6 && h < 5 / 6) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return { r, g, b }
}

/**
 * Convert RGB to HSV
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {{h: number, s: number, v: number}} HSV object
 */
export function rgbToHsv(r, g, b) {
  r = r / 255
  g = g / 255
  b = b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const s = max === 0 ? 0 : Math.round((delta / max) * 100)
  const v = Math.round(max * 100)

  return { h, s, v }
}

/**
 * Convert Color Temperature (Kelvin) to RGB
 * Approximation based on Tanner Helland's algorithm
 * @param {number} k - Color temperature in Kelvin (1000-40000)
 * @returns {{r: number, g: number, b: number}} RGB object
 */
export function kelvinToRgb(k) {
  const temp = k / 100
  let r, g, b

  if (temp <= 66) {
    r = 255
    g = temp
    g = 99.4708025861 * Math.log(g) - 161.1195681661
    if (temp <= 19) {
      b = 0
    } else {
      b = temp - 10
      b = 138.5177312231 * Math.log(b) - 305.0447927307
    }
  } else {
    r = temp - 60
    r = 329.698727446 * Math.pow(r, -0.1332047592)
    g = temp - 60
    g = 288.1221695283 * Math.pow(g, -0.0755148492)
    b = 255
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b)))
  }
}
