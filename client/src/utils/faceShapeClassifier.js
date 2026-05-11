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
