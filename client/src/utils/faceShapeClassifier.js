/**
 * Classify face shape from MediaPipe Face Mesh landmarks.
 *
 * Key landmarks used:
 *   10 = top of forehead, 152 = chin bottom
 *   234 = left cheek, 454 = right cheek
 *   127 = left forehead, 356 = right forehead
 *   172 = left jaw, 397 = right jaw
 */

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function classifyFaceShape(landmarks) {
  const top = landmarks[10]
  const chin = landmarks[152]
  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  const leftForehead = landmarks[127]
  const rightForehead = landmarks[356]
  const leftJaw = landmarks[172]
  const rightJaw = landmarks[397]

  const faceLength = dist(top, chin)
  const faceWidth = dist(leftCheek, rightCheek)
  const foreheadWidth = dist(leftForehead, rightForehead)
  const jawWidth = dist(leftJaw, rightJaw)

  const lengthToWidth = faceLength / faceWidth
  const jawToForehead = jawWidth / foreheadWidth

  if (lengthToWidth > 1.3 && jawToForehead < 0.85) return 'oblong'
  if (lengthToWidth < 1.1 && jawToForehead > 0.9) return 'round'
  if (jawToForehead > 0.95 && lengthToWidth > 1.05 && lengthToWidth < 1.25) return 'square'
  if (jawToForehead < 0.8 && foreheadWidth > jawWidth) return 'heart'
  if (faceWidth > foreheadWidth * 1.1 && faceWidth > jawWidth * 1.1) return 'diamond'
  return 'oval'
}

/**
 * Analyze eye spacing and nose width for glasses/eyewear recommendations.
 * Landmark 133 = right eye inner corner, 362 = left eye inner corner
 * Landmark 33 = right eye outer, 263 = left eye outer
 * Landmark 6 = nose tip, 197 = nose bridge top
 * Landmark 48 = right nose wing, 278 = left nose wing
 */
export function analyzeEyeNoseProportions(landmarks) {
  const eyeInnerDist = dist(landmarks[133], landmarks[362])
  const eyeOuterDist = dist(landmarks[33], landmarks[263])
  const noseWidth = dist(landmarks[48], landmarks[278])

  // Eye spacing ratio: inner distance / outer distance
  // Normal ~0.3, wide-set >0.35, close-set <0.25
  const eyeSpacingRatio = eyeInnerDist / eyeOuterDist

  let eyeSpacing
  if (eyeSpacingRatio > 0.35) eyeSpacing = 'wide'
  else if (eyeSpacingRatio < 0.25) eyeSpacing = 'close'
  else eyeSpacing = 'average'

  // Nose-to-eye ratio for glasses bridge recommendation
  const noseToEyeRatio = noseWidth / eyeInnerDist

  let noseBridge
  if (noseToEyeRatio > 1.2) noseBridge = 'wide'
  else if (noseToEyeRatio < 0.8) noseBridge = 'narrow'
  else noseBridge = 'medium'

  // Glasses frame recommendation
  let glassesStyle
  if (eyeSpacing === 'wide') {
    glassesStyle = 'Frames with a prominent bridge or darker inner corners to draw eyes inward. Try cat-eye or rectangular frames.'
  } else if (eyeSpacing === 'close') {
    glassesStyle = 'Frames with clear or thin bridges to widen the appearance. Try wider frames or aviators.'
  } else {
    glassesStyle = 'Most frame styles work well. Try frames that match your face shape.'
  }

  return {
    eyeSpacing,
    noseBridge,
    eyeSpacingRatio: Math.round(eyeSpacingRatio * 100) / 100,
    noseToEyeRatio: Math.round(noseToEyeRatio * 100) / 100,
    glassesStyle,
  }
}
