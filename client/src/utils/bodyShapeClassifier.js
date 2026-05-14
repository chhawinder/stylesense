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
 *
 * MediaPipe normalized coordinates: x is [0-1] relative to imageWidth,
 * y is [0-1] relative to imageHeight. For horizontal measurements
 * (shoulders, hips) we use |x1-x2| * imageWidth. For vertical
 * measurements we use |y1-y2| * imageHeight. Circumference is estimated
 * from front-view width using anthropometric multipliers.
 */
export function estimateMeasurements(landmarks, heightCm, imageWidth, imageHeight, gender = 'female') {
  const lShoulder = landmarks[11]
  const rShoulder = landmarks[12]
  const lHip = landmarks[23]
  const rHip = landmarks[24]
  const head = landmarks[0] // nose
  const lAnkle = landmarks[27]

  // Pixel height of person (head to ankle) — vertical measurement
  const pixelHeight = Math.abs(lAnkle.y - head.y) * imageHeight
  const pxPerCm = pixelHeight / heightCm

  // Horizontal measurements — use x-coords scaled by imageWidth
  const shoulderWidthPx = Math.abs(lShoulder.x - rShoulder.x) * imageWidth
  const hipWidthPx = Math.abs(lHip.x - rHip.x) * imageWidth

  // Front-view width in cm
  const shoulderWidthCm = shoulderWidthPx / pxPerCm
  const hipWidthCm = hipWidthPx / pxPerCm

  // Circumference multipliers from anthropometric research:
  // Shoulder circumference ≈ biacromial width × π (slightly less than full circle)
  // Chest circumference ≈ front width × 2.5 (elliptical cross-section)
  // Waist circumference ≈ front width × 2.8-3.0 (rounder cross-section)
  // Hip circumference ≈ front width × 2.8-3.1
  const isMale = gender === 'male'
  const shoulderCircumference = shoulderWidthCm * (isMale ? 2.9 : 2.7)
  const chestCircumference = shoulderWidthCm * 0.92 * (isMale ? 2.6 : 2.5)
  const waistWidth = hipWidthCm * 0.85
  const waistCircumference = waistWidth * (isMale ? 2.8 : 3.0)
  const hipCircumference = hipWidthCm * (isMale ? 2.8 : 3.1)

  return {
    shoulder_cm: Math.round(shoulderCircumference),
    chest_cm: Math.round(chestCircumference),
    waist_cm: Math.round(waistCircumference),
    hip_cm: Math.round(hipCircumference),
    height_cm: heightCm,
  }
}

/**
 * Validate measurements against realistic human ranges.
 * Returns an object with warnings for any out-of-range values.
 */
export function validateMeasurements(measurements, gender = 'female') {
  const warnings = {}
  const ranges = gender === 'male' ? {
    shoulder_cm: [95, 135],
    chest_cm: [80, 130],
    waist_cm: [60, 120],
    hip_cm: [80, 120],
  } : {
    shoulder_cm: [85, 120],
    chest_cm: [70, 120],
    waist_cm: [55, 110],
    hip_cm: [75, 130],
  }

  for (const [key, [min, max]] of Object.entries(ranges)) {
    const val = measurements[key]
    if (val != null && (val < min || val > max)) {
      warnings[key] = val < min
        ? `Seems low (expected ${min}-${max} cm)`
        : `Seems high (expected ${min}-${max} cm)`
    }
  }
  return warnings
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

/**
 * Analyze torso-to-leg ratio from front pose landmarks.
 * Torso = midpoint(shoulders) to midpoint(hips)
 * Legs = midpoint(hips) to midpoint(ankles)
 */
export function analyzeTorsoLegRatio(landmarks) {
  const shoulderMidY = (landmarks[11].y + landmarks[12].y) / 2
  const hipMidY = (landmarks[23].y + landmarks[24].y) / 2
  const ankleMidY = (landmarks[27].y + landmarks[28].y) / 2

  const torsoLength = Math.abs(hipMidY - shoulderMidY)
  const legLength = Math.abs(ankleMidY - hipMidY)

  if (torsoLength === 0 || legLength === 0) return { ratio: 1, type: 'balanced' }

  const ratio = torsoLength / legLength
  let type
  if (ratio > 0.65) type = 'long_torso'
  else if (ratio < 0.5) type = 'long_legs'
  else type = 'balanced'

  return { ratio: Math.round(ratio * 100) / 100, type }
}

/**
 * Analyze arm length relative to body.
 * Compares wrist position to hip position — long arms reach past hips.
 * Landmark 15 = left wrist, 16 = right wrist
 */
export function analyzeArmLength(landmarks) {
  const hipMidY = (landmarks[23].y + landmarks[24].y) / 2
  const wristAvgY = (landmarks[15].y + landmarks[16].y) / 2
  const shoulderMidY = (landmarks[11].y + landmarks[12].y) / 2
  const torsoLength = Math.abs(hipMidY - shoulderMidY)

  if (torsoLength === 0) return { type: 'average' }

  // How far past shoulder the wrist reaches, normalized by torso length
  const armReach = (wristAvgY - shoulderMidY) / torsoLength

  let type
  if (armReach > 1.15) type = 'long'
  else if (armReach < 0.85) type = 'short'
  else type = 'average'

  return { type, armReach: Math.round(armReach * 100) / 100 }
}

/**
 * Analyze posture from side pose landmarks.
 * Checks ear-shoulder-hip alignment (forward head posture).
 * Landmark 7/8 = left/right ear, 11/12 = shoulders, 23/24 = hips
 */
export function analyzePosture(landmarks) {
  // Use whichever ear is visible (side view)
  const earX = landmarks[7]?.visibility > 0.3 ? landmarks[7].x
    : landmarks[8]?.visibility > 0.3 ? landmarks[8].x
    : null
  const shoulderX = landmarks[11]?.visibility > 0.3 ? landmarks[11].x : landmarks[12].x
  const hipX = landmarks[23]?.visibility > 0.3 ? landmarks[23].x : landmarks[24].x

  if (earX === null) return { type: 'normal', forwardHeadDeg: 0 }

  // Forward head offset relative to shoulder-hip line
  const shoulderHipDist = Math.abs(landmarks[11].y - landmarks[23].y) || 0.3
  const forwardOffset = (earX - shoulderX) / shoulderHipDist
  const forwardHeadDeg = Math.round(Math.atan(forwardOffset) * (180 / Math.PI))

  let type
  if (Math.abs(forwardHeadDeg) > 15) type = 'forward_head'
  else if (Math.abs(forwardHeadDeg) > 8) type = 'slight_forward'
  else type = 'normal'

  return { type, forwardHeadDeg: Math.abs(forwardHeadDeg) }
}

/**
 * Classify Kibbe body type from pose landmarks + height.
 * Simplified classification into 5 main types:
 * Dramatic, Natural, Classic, Gamine, Romantic
 */
export function classifyKibbeType(landmarks, heightCm, gender) {
  const shoulderWidth = dist(landmarks[11], landmarks[12])
  const hipWidth = dist(landmarks[23], landmarks[24])
  const shoulderToHip = shoulderWidth / hipWidth

  const shoulderMidY = (landmarks[11].y + landmarks[12].y) / 2
  const hipMidY = (landmarks[23].y + landmarks[24].y) / 2
  const ankleMidY = (landmarks[27].y + landmarks[28].y) / 2
  const torsoLength = Math.abs(hipMidY - shoulderMidY)
  const legLength = Math.abs(ankleMidY - hipMidY)
  const torsoToLeg = torsoLength / (legLength || 0.01)

  // Height factor (tall favors Dramatic/Natural, short favors Gamine/Romantic)
  const tall = gender === 'male' ? heightCm > 180 : heightCm > 170
  const short = gender === 'male' ? heightCm < 168 : heightCm < 158
  const sharp = shoulderToHip > 1.08 // angular shoulders
  const soft = hipWidth > shoulderWidth * 0.98 // curvy hips
  const elongated = torsoToLeg < 0.55

  if (tall && sharp && elongated) return 'dramatic'
  if (tall && !sharp) return 'natural'
  if (short && sharp) return 'gamine'
  if (short && soft) return 'romantic'
  return 'classic'
}
