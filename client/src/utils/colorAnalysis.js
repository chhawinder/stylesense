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

  // Map to color season
  const depth = luminance < 140 ? 'deep' : luminance < 180 ? 'medium' : 'light'
  const seasonMap = {
    warm_light: 'spring',
    warm_medium: 'autumn',
    warm_deep: 'autumn',
    cool_light: 'summer',
    cool_medium: 'winter',
    cool_deep: 'winter',
    neutral_light: 'spring',
    neutral_medium: 'autumn',
    neutral_deep: 'winter',
  }
  const season = seasonMap[`${undertone}_${depth}`] || 'autumn'

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), fitzpatrick, undertone, season }
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
