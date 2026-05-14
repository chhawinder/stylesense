/**
 * Analyze skin tone from face landmarks + video frame.
 * Extracts cheek region pixels, converts to HSV, maps to Fitzpatrick scale.
 */

/**
 * Extract average skin color from cheek region of a canvas.
 * @param {HTMLCanvasElement} canvas - Canvas with the current video frame
 * @param {Array} faceLandmarks - MediaPipe face mesh landmarks (normalized 0-1)
 * @returns {{ r, g, b, fitzpatrick, undertone, season }}
 */
export function analyzeSkinTone(canvas, faceLandmarks) {
  if (!faceLandmarks || faceLandmarks.length === 0) {
    return { fitzpatrick: 3, undertone: 'neutral', season: 'autumn' }
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const w = canvas.width
  const h = canvas.height

  // Right cheek region landmarks: 50, 101, 118, 187
  // Left cheek region landmarks: 280, 330, 347, 411
  const cheekPoints = [50, 101, 118, 187, 280, 330, 347, 411]

  let rSum = 0, gSum = 0, bSum = 0, count = 0

  for (const idx of cheekPoints) {
    if (!faceLandmarks[idx]) continue
    const px = Math.round(faceLandmarks[idx].x * w)
    const py = Math.round(faceLandmarks[idx].y * h)

    // Sample a 5x5 area around each point
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = Math.max(0, Math.min(w - 1, px + dx))
        const y = Math.max(0, Math.min(h - 1, py + dy))
        const pixel = ctx.getImageData(x, y, 1, 1).data
        rSum += pixel[0]
        gSum += pixel[1]
        bSum += pixel[2]
        count++
      }
    }
  }

  if (count === 0) {
    return { fitzpatrick: 3, undertone: 'neutral', season: 'autumn' }
  }

  const r = rSum / count
  const g = gSum / count
  const b = bSum / count

  // Convert to HSV for classification
  const { h: hue, s: sat, v: val } = rgbToHsv(r, g, b)

  // Map to Fitzpatrick scale based on luminance/value
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  let fitzpatrick
  if (luminance > 200) fitzpatrick = 1
  else if (luminance > 170) fitzpatrick = 2
  else if (luminance > 140) fitzpatrick = 3
  else if (luminance > 110) fitzpatrick = 4
  else if (luminance > 80) fitzpatrick = 5
  else fitzpatrick = 6

  // Determine undertone from hue
  let undertone
  if (hue >= 15 && hue <= 45) undertone = 'warm'
  else if (hue >= 0 && hue < 15) undertone = 'cool'
  else if (hue > 45 && hue <= 60) undertone = 'neutral'
  else undertone = 'neutral'

  // Determine depth and chroma for 12-season system
  const depth = luminance < 120 ? 'deep' : luminance < 155 ? 'medium_deep' : luminance < 185 ? 'medium_light' : 'light'
  const chroma = sat > 0.5 ? 'bright' : sat > 0.3 ? 'true' : 'muted'

  // 12-season color analysis
  const season12 = classify12Season(undertone, depth, chroma)
  // Simplified 4-season for backward compat
  const season = season12.split('_').pop()

  return {
    r: Math.round(r), g: Math.round(g), b: Math.round(b),
    fitzpatrick, undertone, season, season12,
    depth, chroma,
  }
}

/**
 * 12-season color system.
 * Combines undertone (warm/cool/neutral) with depth and chroma.
 */
function classify12Season(undertone, depth, chroma) {
  if (undertone === 'warm') {
    if (chroma === 'bright') return 'bright_spring'
    if (depth === 'light' || depth === 'medium_light') return 'light_spring'
    if (depth === 'deep' || depth === 'medium_deep') {
      return chroma === 'muted' ? 'soft_autumn' : 'deep_autumn'
    }
    return 'warm_autumn'
  }
  if (undertone === 'cool') {
    if (chroma === 'bright') return 'bright_winter'
    if (depth === 'light' || depth === 'medium_light') return 'light_summer'
    if (depth === 'deep' || depth === 'medium_deep') return 'deep_winter'
    return 'cool_summer'
  }
  // neutral
  if (depth === 'light' || depth === 'medium_light') {
    return chroma === 'muted' ? 'soft_summer' : 'light_spring'
  }
  return chroma === 'muted' ? 'soft_autumn' : 'deep_autumn'
}

/**
 * Analyze hair-to-skin contrast level.
 * Samples pixels above the forehead (landmark 10) for hair color,
 * compares luminance to skin color.
 */
export function analyzeHairSkinContrast(canvas, faceLandmarks) {
  if (!faceLandmarks || faceLandmarks.length === 0) {
    return { contrast: 'medium', hairLuminance: 0, skinLuminance: 0 }
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const w = canvas.width
  const h = canvas.height

  // Sample hair: above forehead landmark 10
  const foreheadX = Math.round(faceLandmarks[10].x * w)
  const foreheadY = Math.round(faceLandmarks[10].y * h)
  // Go ~30px above forehead for hair
  const hairY = Math.max(5, foreheadY - 30)

  let hairR = 0, hairG = 0, hairB = 0, hairCount = 0
  for (let dx = -10; dx <= 10; dx += 2) {
    for (let dy = -5; dy <= 5; dy += 2) {
      const x = Math.max(0, Math.min(w - 1, foreheadX + dx))
      const y = Math.max(0, Math.min(h - 1, hairY + dy))
      const pixel = ctx.getImageData(x, y, 1, 1).data
      hairR += pixel[0]; hairG += pixel[1]; hairB += pixel[2]
      hairCount++
    }
  }

  // Sample skin from cheeks (landmarks 101, 330)
  let skinR = 0, skinG = 0, skinB = 0, skinCount = 0
  for (const idx of [101, 330]) {
    if (!faceLandmarks[idx]) continue
    const px = Math.round(faceLandmarks[idx].x * w)
    const py = Math.round(faceLandmarks[idx].y * h)
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const x = Math.max(0, Math.min(w - 1, px + dx))
        const y = Math.max(0, Math.min(h - 1, py + dy))
        const pixel = ctx.getImageData(x, y, 1, 1).data
        skinR += pixel[0]; skinG += pixel[1]; skinB += pixel[2]
        skinCount++
      }
    }
  }

  if (hairCount === 0 || skinCount === 0) {
    return { contrast: 'medium', hairLuminance: 0, skinLuminance: 0 }
  }

  const hairLum = 0.299 * (hairR / hairCount) + 0.587 * (hairG / hairCount) + 0.114 * (hairB / hairCount)
  const skinLum = 0.299 * (skinR / skinCount) + 0.587 * (skinG / skinCount) + 0.114 * (skinB / skinCount)
  const diff = Math.abs(skinLum - hairLum)

  let contrast
  if (diff > 80) contrast = 'high'
  else if (diff > 40) contrast = 'medium'
  else contrast = 'low'

  return {
    contrast,
    hairLuminance: Math.round(hairLum),
    skinLuminance: Math.round(skinLum),
  }
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}
