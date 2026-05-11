/**
 * Classify body shape from MediaPipe Pose landmarks.
 * Uses shoulder, waist (approximated from hip), and hip ratios.
 *
 * MediaPipe Pose landmark indices:
 *   11 = left shoulder, 12 = right shoulder
 *   23 = left hip, 24 = right hip
 *   (waist approximated from midpoint between shoulders and hips)
 */

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function classifyBodyShape(landmarks) {
  const lShoulder = landmarks[11]
  const rShoulder = landmarks[12]
  const lHip = landmarks[23]
  const rHip = landmarks[24]

  const shoulderWidth = dist(lShoulder, rShoulder)
  const hipWidth = dist(lHip, rHip)
  // Approximate waist as slightly narrower than hips (based on torso midpoint)
  const waistWidth = hipWidth * 0.85

  const shoulderToHip = shoulderWidth / hipWidth
  const waistToHip = waistWidth / hipWidth

  if (shoulderToHip > 1.05 && waistToHip < 0.75) return 'hourglass'
  if (shoulderToHip > 1.1) return 'inverted_triangle'
  if (waistToHip > 0.85 && shoulderToHip < 1.05) return 'apple'
  if (hipWidth > shoulderWidth * 1.05) return 'pear'
  return 'rectangle'
}

/**
 * Estimate body measurements from pose landmarks + known height.
 * Returns measurements in centimeters.
 */
export function estimateMeasurements(landmarks, heightCm, imageHeight) {
  const lShoulder = landmarks[11]
  const rShoulder = landmarks[12]
  const lHip = landmarks[23]
  const rHip = landmarks[24]
  const head = landmarks[0] // nose
  const lAnkle = landmarks[27]

  // Pixel height of person (head to ankle)
  const pixelHeight = Math.abs(lAnkle.y - head.y) * imageHeight
  const pxPerCm = pixelHeight / heightCm

  const shoulderPx = dist(lShoulder, rShoulder) * imageHeight
  const hipPx = dist(lHip, rHip) * imageHeight

  return {
    shoulder_cm: Math.round(shoulderPx / pxPerCm),
    chest_cm: Math.round((shoulderPx * 0.95) / pxPerCm), // approximation
    waist_cm: Math.round((hipPx * 0.85) / pxPerCm),
    hip_cm: Math.round(hipPx / pxPerCm),
    height_cm: heightCm,
  }
}

/**
 * Map measurements to Indian clothing size.
 */
export function predictSize(chestCm, gender = 'female') {
  if (gender === 'male') {
    if (chestCm < 90) return 'S'
    if (chestCm < 100) return 'M'
    if (chestCm < 110) return 'L'
    if (chestCm < 120) return 'XL'
    return 'XXL'
  }
  // female
  if (chestCm < 82) return 'XS'
  if (chestCm < 88) return 'S'
  if (chestCm < 94) return 'M'
  if (chestCm < 100) return 'L'
  if (chestCm < 108) return 'XL'
  return 'XXL'
}
