import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useMediaPipe from '../hooks/useMediaPipe'
import useProfileStore from '../store/profileStore'
import { classifyBodyShape, estimateMeasurements, validateMeasurements, predictSize, analyzeTorsoLegRatio, analyzeArmLength, analyzePosture, classifyKibbeType } from '../utils/bodyShapeClassifier'
import { classifyFaceShape, analyzeEyeNoseProportions } from '../utils/faceShapeClassifier'
import { analyzeSkinTone, analyzeHairSkinContrast } from '../utils/colorAnalysis'

// ─── Constants ─────────────────────────────────────────────

const STEPS = ['Front Pose', 'Side Pose', 'Face Close-up']

const STEP_INSTRUCTIONS = [
  'Stand 6 ft away • feet shoulder-width apart • arms 6 inches from body • face camera straight',
  'Turn 90° sideways • stand straight • arms relaxed at sides • chin level',
  'Face the camera straight on • close-up • remove glasses if possible',
]

const STEP_TIPS = [
  ['Shoulders, chest, waist & hip width', 'Wear fitted clothing for best accuracy'],
  ['Posture & forward head tilt', 'Stand naturally — don\'t over-correct'],
  ['Face shape, skin tone & color season', 'Ensure even lighting on your face'],
]

const LABELS = {
  height_cm: 'Height', shoulder_cm: 'Shoulders', chest_cm: 'Chest',
  waist_cm: 'Waist', hip_cm: 'Hip', predicted_size: 'Size',
  body_shape: 'Body Shape', torso_leg_type: 'Proportions',
  arm_length: 'Arm Length', kibbe_type: 'Style Type',
  posture: 'Posture', posture_forward_head_deg: 'Forward Tilt',
  face_shape: 'Face Shape', skin_tone_fitzpatrick: 'Skin Type',
  skin_undertone: 'Undertone', color_season: 'Color Season',
  hair_skin_contrast: 'Contrast', eye_spacing: 'Eye Spacing',
  nose_bridge: 'Nose Bridge',
}

const FIELD_OPTIONS = {
  body_shape: ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle'],
  torso_leg_type: ['long_torso', 'long_legs', 'balanced'],
  arm_length: ['long', 'short', 'average'],
  kibbe_type: ['dramatic', 'natural', 'classic', 'gamine', 'romantic'],
  posture: ['normal', 'slight_forward', 'forward_head'],
  face_shape: ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'],
  skin_undertone: ['warm', 'cool', 'neutral'],
  color_season: ['spring', 'summer', 'autumn', 'winter'],
  hair_skin_contrast: ['high', 'medium', 'low'],
  eye_spacing: ['wide', 'close', 'average'],
  nose_bridge: ['wide', 'narrow', 'medium'],
  predicted_size: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
}

const REVIEW_GROUPS = [
  { title: 'Body Measurements', icon: 'straighten', step: 0,
    fields: ['height_cm', 'shoulder_cm', 'chest_cm', 'waist_cm', 'hip_cm', 'predicted_size'] },
  { title: 'Body Analysis', icon: 'accessibility_new', step: 0,
    fields: ['body_shape', 'torso_leg_type', 'arm_length', 'kibbe_type'] },
  { title: 'Posture', icon: 'self_improvement', step: 1,
    fields: ['posture'] },
  { title: 'Face & Color', icon: 'face', step: 2,
    fields: ['face_shape', 'skin_tone_fitzpatrick', 'skin_undertone', 'color_season', 'hair_skin_contrast', 'eye_spacing', 'nose_bridge'] },
]

const LIVE_FIELDS = {
  0: ['shoulder_cm', 'chest_cm', 'waist_cm', 'hip_cm', 'body_shape', 'predicted_size', 'kibbe_type'],
  1: ['posture'],
  2: ['face_shape', 'eye_spacing', 'nose_bridge'],
}

function formatValue(key, val) {
  if (val == null || val === '') return '\u2014'
  if (key.endsWith('_cm')) return `${val} cm`
  if (key === 'posture_forward_head_deg') return `${val}\u00B0`
  if (key === 'skin_tone_fitzpatrick') return `Type ${val}`
  if (typeof val === 'string') return val.replace(/_/g, ' ')
  return String(val)
}

function isNumericField(key) {
  return key.endsWith('_cm') || key === 'skin_tone_fitzpatrick' || key === 'posture_forward_head_deg'
}

// ─── Component ─────────────────────────────────────────────

export default function Scan() {
  const navigate = useNavigate()
  const { setScanResult, saveProfile, loadProfile } = useProfileStore()
  const {
    videoRef, canvasRef, ready, loading: mpLoading, error: mpError,
    poseLandmarks, faceLandmarks, cameraActive,
    init, startCamera, stopCamera, flipCamera,
    startDetection, stopDetection, captureFrame, detect,
  } = useMediaPipe()

  // Phase: 'loading' | 'existing' | 'setup' | 'scanning' | 'step-review' | 'review'
  const [phase, setPhase] = useState('loading')
  const [currentStep, setCurrentStep] = useState(0)
  const [measurements, setMeasurements] = useState({})
  const [heightCm, setHeightCm] = useState(165)
  const [gender, setGender] = useState('female')
  const [countdown, setCountdown] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [returnToReview, setReturnToReview] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Check for existing profile on mount ──
  useEffect(() => {
    const check = async () => {
      try {
        const existing = await loadProfile()
        if (existing) {
          const { id, user_id, is_active, scanned_at, ...data } = existing
          setMeasurements(data)
          setHeightCm(data.height_cm || 165)
          setGender(data.gender || 'female')
          setPhase('existing')
        } else {
          setPhase('setup')
        }
      } catch {
        setPhase('setup')
      }
    }
    check()
  }, [])

  // ── Init MediaPipe ──
  useEffect(() => { init() }, [init])

  // ── Camera lifecycle ──
  useEffect(() => {
    if (['setup', 'scanning'].includes(phase) && ready && !cameraActive) {
      startCamera()
    }
  }, [phase, ready, cameraActive, startCamera])

  useEffect(() => {
    if (phase === 'scanning' && cameraActive && ready) {
      startDetection()
      return () => stopDetection()
    }
  }, [phase, cameraActive, ready, startDetection, stopDetection])

  // ── Countdown timer ──
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      doCapture()
      setCountdown(null)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // ── Live measurements (computed every frame) ──
  const liveMeasurements = useMemo(() => {
    if (phase !== 'scanning') return null
    if (currentStep <= 1 && poseLandmarks) {
      if (currentStep === 0) {
        const bodyShape = classifyBodyShape(poseLandmarks)
        const m = estimateMeasurements(poseLandmarks, heightCm, videoRef.current?.videoWidth || 1280, videoRef.current?.videoHeight || 720, gender)
        const size = predictSize(m.chest_cm, gender)
        const kibbeType = classifyKibbeType(poseLandmarks, heightCm, gender)
        return { shoulder_cm: m.shoulder_cm, chest_cm: m.chest_cm, waist_cm: m.waist_cm, hip_cm: m.hip_cm, body_shape: bodyShape, predicted_size: size, kibbe_type: kibbeType }
      }
      const p = analyzePosture(poseLandmarks)
      return { posture: p.type }
    }
    if (currentStep === 2 && faceLandmarks) {
      const faceShape = classifyFaceShape(faceLandmarks)
      const en = analyzeEyeNoseProportions(faceLandmarks)
      return { face_shape: faceShape, eye_spacing: en.eyeSpacing, nose_bridge: en.noseBridge }
    }
    return null
  }, [phase, currentStep, poseLandmarks, faceLandmarks, heightCm, gender])

  // ── Capture handler ──
  const handleCapturePress = useCallback(() => {
    if (countdown !== null) return
    setCountdown(5)
  }, [countdown])

  const doCapture = useCallback(() => {
    detect()
    let newMeasurements = {}

    if (currentStep === 0 && poseLandmarks) {
      const bodyShape = classifyBodyShape(poseLandmarks)
      const m = estimateMeasurements(poseLandmarks, heightCm, videoRef.current?.videoWidth || 1280, videoRef.current?.videoHeight || 720, gender)
      const size = predictSize(m.chest_cm, gender)
      const torsoLeg = analyzeTorsoLegRatio(poseLandmarks)
      const armLength = analyzeArmLength(poseLandmarks)
      const kibbeType = classifyKibbeType(poseLandmarks, heightCm, gender)
      newMeasurements = {
        body_shape: bodyShape, shoulder_cm: m.shoulder_cm, chest_cm: m.chest_cm,
        waist_cm: m.waist_cm, hip_cm: m.hip_cm, height_cm: heightCm,
        predicted_size: size, torso_leg_ratio: torsoLeg.ratio, torso_leg_type: torsoLeg.type,
        arm_length: armLength.type, kibbe_type: kibbeType, gender,
      }
    } else if (currentStep === 1 && poseLandmarks) {
      const p = analyzePosture(poseLandmarks)
      newMeasurements = { posture: p.type, posture_forward_head_deg: p.forwardHeadDeg }
    } else if (currentStep === 2) {
      const canvas = captureFrame()
      const skinTone = analyzeSkinTone(canvas, faceLandmarks)
      const faceShape = faceLandmarks ? classifyFaceShape(faceLandmarks) : 'oval'
      const hairContrast = analyzeHairSkinContrast(canvas, faceLandmarks)
      const eyeNose = faceLandmarks ? analyzeEyeNoseProportions(faceLandmarks) : null
      newMeasurements = {
        face_shape: faceShape, skin_tone_fitzpatrick: skinTone.fitzpatrick,
        skin_undertone: skinTone.undertone, color_season: skinTone.season,
        color_season_12: skinTone.season12 || null, hair_skin_contrast: hairContrast.contrast,
        eye_spacing: eyeNose?.eyeSpacing || 'average', nose_bridge: eyeNose?.noseBridge || 'medium',
        glasses_recommendation: eyeNose?.glassesStyle || null,
      }
    }

    setMeasurements((prev) => ({ ...prev, ...newMeasurements }))
    stopCamera()

    if (returnToReview) {
      setReturnToReview(false)
      setPhase('review')
    } else if (currentStep < STEPS.length - 1) {
      setPhase('step-review')
    } else {
      setPhase('review')
    }
  }, [currentStep, poseLandmarks, faceLandmarks, heightCm, gender, captureFrame, detect, returnToReview, stopCamera])

  // ── Step navigation ──
  const nextStep = () => {
    if (currentStep >= STEPS.length - 1) {
      setPhase('review')
    } else {
      setCurrentStep((s) => s + 1)
      setPhase('scanning')
    }
  }

  const redoCurrentStep = () => setPhase('scanning')

  const redoStep = (step) => {
    setCurrentStep(step)
    setReturnToReview(true)
    setPhase('scanning')
  }

  // ── Save profile ──
  const handleSave = async () => {
    setSaving(true)
    setScanResult(measurements)
    try { await saveProfile(measurements) } catch { /* continue */ }
    setSaving(false)
    navigate('/profile')
  }

  // ── Field editing ──
  const handleFieldChange = (key, val) => {
    const parsed = isNumericField(key) ? Number(val) : val
    setMeasurements((prev) => ({ ...prev, [key]: parsed }))
  }

  const poseDetected = currentStep <= 1 ? !!poseLandmarks : !!faceLandmarks

  // ──────── RENDER ────────

  // Loading phase
  if (phase === 'loading') {
    return (
      <div className="h-screen w-full bg-surface flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant">Checking your profile...</p>
      </div>
    )
  }

  // Existing profile phase
  if (phase === 'existing') {
    return (
      <div className="min-h-screen bg-surface pt-20 pb-12 px-5">
        <header className="fixed top-0 w-full flex justify-between items-center px-5 py-4 bg-surface/80 backdrop-blur-md z-50">
          <Link to="/" className="material-symbols-outlined text-on-surface">arrow_back</Link>
          <div className="font-headline text-xl font-bold text-primary">StyleSense</div>
          <div className="w-6" />
        </header>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-on-surface mb-2">Welcome Back!</h1>
            <p className="text-on-surface-variant">We have your measurements from your last scan.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl mb-6 space-y-3">
            {[['body_shape', 'Body Shape'], ['predicted_size', 'Size'], ['height_cm', 'Height'],
              ['face_shape', 'Face Shape'], ['color_season', 'Color Season'], ['kibbe_type', 'Style Type']].map(([key, label]) => (
              measurements[key] != null && (
                <div key={key} className="flex justify-between border-b border-outline-variant/20 pb-2 last:border-0">
                  <span className="text-on-surface-variant">{label}</span>
                  <span className="font-semibold text-on-surface capitalize">{formatValue(key, measurements[key])}</span>
                </div>
              )
            ))}
          </div>

          <div className="space-y-3">
            <button onClick={() => navigate('/profile')}
              className="w-full royal-flow text-white py-3.5 rounded-xl font-headline text-lg font-semibold active:scale-95 transition-transform">
              Use These Measurements
            </button>
            <button onClick={() => setPhase('review')}
              className="w-full bg-surface-container border border-outline-variant text-on-surface py-3.5 rounded-xl font-headline text-lg font-semibold active:scale-95 transition-transform">
              Edit Manually
            </button>
            <button onClick={() => setPhase('setup')}
              className="w-full text-on-surface-variant py-3 font-label text-sm font-semibold active:scale-95 transition-transform">
              Rescan Everything
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Review phase — full editable review
  if (phase === 'review') {
    return (
      <div className="min-h-screen bg-surface pt-20 pb-12 px-5">
        <header className="fixed top-0 w-full flex justify-between items-center px-5 py-4 bg-surface/80 backdrop-blur-md z-50">
          <Link to="/" className="material-symbols-outlined text-on-surface">close</Link>
          <div className="font-headline text-xl font-bold text-primary">Review Measurements</div>
          <div className="w-6" />
        </header>

        <div className="max-w-md mx-auto space-y-4">
          {REVIEW_GROUPS.map((group) => (
            <div key={group.title} className="glass-card p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">{group.icon}</span>
                  <h3 className="font-headline text-lg font-semibold text-on-surface">{group.title}</h3>
                </div>
                <button onClick={() => redoStep(group.step)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Redo
                </button>
              </div>
              <div className="space-y-2.5">
                {group.fields.map((key) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-outline-variant/20 last:border-0">
                    <span className="text-sm text-on-surface-variant">{LABELS[key] || key}</span>
                    {editingField === key ? (
                      isNumericField(key) ? (
                        <input type="number" value={measurements[key] || ''} autoFocus
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          className="w-24 px-2 py-1 text-sm text-right rounded-lg border border-primary bg-surface-container-low text-on-surface font-semibold" />
                      ) : (
                        <select value={measurements[key] || ''} autoFocus
                          onChange={(e) => { handleFieldChange(key, e.target.value); setEditingField(null) }}
                          onBlur={() => setEditingField(null)}
                          className="px-2 py-1 text-sm rounded-lg border border-primary bg-surface-container-low text-on-surface font-semibold capitalize">
                          {(FIELD_OPTIONS[key] || []).map((opt) => (
                            <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <button onClick={() => setEditingField(key)}
                        className="flex items-center gap-1 text-sm font-semibold text-on-surface capitalize hover:text-primary transition-colors group">
                        {formatValue(key, measurements[key])}
                        <span className="material-symbols-outlined text-xs text-on-surface-variant/50 group-hover:text-primary">edit</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving}
            className="w-full royal-flow text-white py-4 rounded-xl font-headline text-lg font-semibold active:scale-95 transition-transform disabled:opacity-50 mt-6">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    )
  }

  // Step review phase — after capturing one step
  if (phase === 'step-review') {
    const stepFields = REVIEW_GROUPS.filter((g) => g.step === currentStep).flatMap((g) => g.fields)
    const warnings = currentStep === 0 ? validateMeasurements(measurements, gender) : {}
    const hasWarnings = Object.keys(warnings).length > 0
    return (
      <div className="h-screen w-full bg-surface flex flex-col items-center justify-center px-5">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${hasWarnings ? 'bg-amber-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className={`material-symbols-outlined ${hasWarnings ? 'text-amber-600' : 'text-green-600'} text-3xl`}>
                {hasWarnings ? 'warning' : 'check'}
              </span>
            </div>
            <h2 className="font-headline text-2xl font-semibold text-on-surface">
              Step {currentStep + 1}: {STEPS[currentStep]}
            </h2>
            <p className="text-on-surface-variant mt-1">
              {hasWarnings ? 'Some values look off — try redoing or edit manually' : 'Here\'s what we captured'}
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl mb-6 space-y-3">
            {stepFields.map((key) => (
              <div key={key}>
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20 last:border-0">
                  <span className="text-sm text-on-surface-variant">{LABELS[key]}</span>
                  <span className={`text-sm font-semibold capitalize ${warnings[key] ? 'text-amber-600' : 'text-on-surface'}`}>
                    {formatValue(key, measurements[key])}
                    {warnings[key] && <span className="material-symbols-outlined text-xs ml-1 align-middle">warning</span>}
                  </span>
                </div>
                {warnings[key] && (
                  <p className="text-[11px] text-amber-600/80 mt-0.5 ml-1">{warnings[key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={redoCurrentStep}
              className="flex-1 bg-surface-container border border-outline-variant text-on-surface py-3 rounded-xl font-label font-semibold active:scale-95 transition-transform">
              Redo This Step
            </button>
            <button onClick={nextStep}
              className="flex-1 royal-flow text-white py-3 rounded-xl font-label font-semibold active:scale-95 transition-transform">
              {currentStep >= STEPS.length - 1 ? 'Review All' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Setup + Scanning phases (camera view) ──
  return (
    <div className="relative h-screen w-full bg-on-surface overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera feed */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: 'scaleX(-1)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-on-surface/60 via-transparent to-on-surface/80" />
      </div>

      {/* Height/Gender setup overlay */}
      {phase === 'setup' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 w-[340px] shadow-2xl">
            <h2 className="font-headline text-2xl font-semibold text-on-surface mb-6 text-center">Quick Setup</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label text-sm font-semibold text-on-surface-variant block mb-2">Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-lg" min="100" max="220" />
              </div>
              <div>
                <label className="font-label text-sm font-semibold text-on-surface-variant block mb-2">Gender</label>
                <div className="flex gap-3">
                  {['female', 'male'].map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`flex-1 py-3 rounded-xl font-label text-sm font-semibold capitalize transition-all ${
                        gender === g ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline-variant text-on-surface-variant'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setPhase('scanning'); setCurrentStep(0) }}
                className="w-full royal-flow text-white py-3 rounded-xl font-headline text-lg font-semibold mt-4 active:scale-95 transition-transform">
                Start Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {mpLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-headline text-xl font-semibold">Loading AI models...</p>
          <p className="text-white/60 mt-2">This may take a moment</p>
        </div>
      )}

      {/* Error overlay */}
      {mpError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
          <p className="text-white font-headline text-xl mb-4">{mpError}</p>
          <button onClick={init} className="royal-flow text-white px-6 py-3 rounded-full font-label text-sm font-semibold">Retry</button>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full flex justify-between items-center px-5 py-4 z-50">
        <Link to="/" className="w-10 h-10 flex items-center justify-center bg-on-surface/10 backdrop-blur-md rounded-full text-white hover:opacity-80 active:scale-90 transition-all">
          <span className="material-symbols-outlined">close</span>
        </Link>
        <div className="font-headline text-2xl font-bold text-white drop-shadow-md">StyleSense</div>
        <button className="w-10 h-10 flex items-center justify-center bg-on-surface/10 backdrop-blur-md rounded-full text-white hover:opacity-80 active:scale-90 transition-all">
          <span className="material-symbols-outlined">help</span>
        </button>
      </header>

      {/* Silhouette overlay with measurement guides (front pose) */}
      {phase === 'scanning' && currentStep === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          {/* Full-height guide so user steps back far enough */}
          <div className="relative w-[55%] max-w-[320px] h-[85%]">
            {/* Outer body outline */}
            <div className="absolute inset-0 border-2 border-dashed border-secondary-fixed/50 rounded-[40%_40%_5%_5%/15%_15%_3%_3%]" />

            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-secondary-fixed" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-secondary-fixed" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-secondary-fixed" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-secondary-fixed" />

            {/* Head circle */}
            <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[30%] aspect-[3/4] border-2 border-dashed border-secondary-fixed/30 rounded-full" />

            {/* ── Measurement reference lines ── */}
            {/* Shoulder line — cyan  ~28% from top (top of torso) */}
            <div className="absolute top-[22%] -left-4 -right-4 flex items-center">
              <div className="flex-1 h-[1.5px] bg-cyan-400/60" />
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 bg-black/50 rounded-full whitespace-nowrap">SHOULDERS</span>
              <div className="flex-1 h-[1.5px] bg-cyan-400/60" />
            </div>
            {/* Chest line — green  ~35% */}
            <div className="absolute top-[33%] -left-2 -right-2 flex items-center">
              <div className="flex-1 h-[1.5px] bg-green-400/60" />
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-green-300 bg-black/50 rounded-full whitespace-nowrap">CHEST</span>
              <div className="flex-1 h-[1.5px] bg-green-400/60" />
            </div>
            {/* Waist line — yellow  ~46% (natural waist, above navel) */}
            <div className="absolute top-[46%] left-[5%] right-[5%] flex items-center">
              <div className="flex-1 h-[1.5px] bg-yellow-400/60" />
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-yellow-300 bg-black/50 rounded-full whitespace-nowrap">WAIST</span>
              <div className="flex-1 h-[1.5px] bg-yellow-400/60" />
            </div>
            {/* Hip line — pink  ~58% (widest part of hips) */}
            <div className="absolute top-[58%] -left-1 -right-1 flex items-center">
              <div className="flex-1 h-[1.5px] bg-pink-400/60" />
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-pink-300 bg-black/50 rounded-full whitespace-nowrap">HIP</span>
              <div className="flex-1 h-[1.5px] bg-pink-400/60" />
            </div>

            {/* Leg region hint */}
            <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 flex gap-[18%]">
              <div className="w-[22%] h-[28%] border-2 border-dashed border-secondary-fixed/25 rounded-full" style={{ minWidth: 28, minHeight: 100 }} />
              <div className="w-[22%] h-[28%] border-2 border-dashed border-secondary-fixed/25 rounded-full" style={{ minWidth: 28, minHeight: 100 }} />
            </div>

            {/* "Step back" nudge if no pose detected */}
            {!poseDetected && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-500/80 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <p className="text-[11px] font-bold text-white whitespace-nowrap flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">zoom_out_map</span>
                  Step back — full body must be visible
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Silhouette overlay (side pose) */}
      {phase === 'scanning' && currentStep === 1 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-[200px] h-[580px] border-2 border-dashed border-secondary-fixed/60 rounded-[80px] flex flex-col items-center justify-center">
            {/* Head */}
            <div className="absolute top-[10%] w-24 h-32 border-2 border-dashed border-secondary-fixed/40 rounded-full" />
            {/* Side torso */}
            <div className="absolute top-[30%] w-[140px] h-[200px] border-2 border-dashed border-secondary-fixed/40 rounded-2xl" />
            {/* Legs */}
            <div className="absolute bottom-[10%] flex gap-2">
              <div className="w-12 h-40 border-2 border-dashed border-secondary-fixed/40 rounded-full" />
              <div className="w-12 h-40 border-2 border-dashed border-secondary-fixed/40 rounded-full" />
            </div>
            {/* Vertical posture alignment line */}
            <div className="absolute top-[8%] bottom-[8%] left-1/2 -translate-x-1/2 w-[1.5px] bg-cyan-400/50" />
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2">
              <span className="text-[10px] font-bold text-cyan-300 bg-black/40 rounded-full px-2 whitespace-nowrap">ALIGN HERE</span>
            </div>
          </div>
        </div>
      )}

      {/* Face oval guide (step 2) */}
      {phase === 'scanning' && currentStep === 2 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-2 border-dashed border-secondary-fixed/60 rounded-[50%]" />
        </div>
      )}

      {/* Pose detection indicator */}
      {phase === 'scanning' && !mpLoading && (
        <div className={`absolute top-24 right-5 z-20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
          poseDetected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${poseDetected ? 'bg-green-400' : 'bg-red-400'}`} />
          {poseDetected ? 'Detected' : 'Not Found'}
        </div>
      )}

      {/* ── Live Measurements HUD ── */}
      {phase === 'scanning' && liveMeasurements && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-44">
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <h4 className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Analysis
            </h4>
            <div className="space-y-2">
              {(LIVE_FIELDS[currentStep] || []).map((key) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-[11px] text-white/60">{LABELS[key]}</span>
                  <span className="text-xs font-semibold text-white font-mono capitalize">
                    {formatValue(key, liveMeasurements[key])}
                  </span>
                </div>
              ))}
            </div>
            {currentStep === 2 && (
              <p className="text-[10px] text-white/40 mt-3 italic">Skin tone captured on photo</p>
            )}
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-[35] flex items-center justify-center pointer-events-none">
          <div className="relative">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#FDCD74" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - countdown / 5)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-7xl font-bold font-display drop-shadow-[0_0_30px_rgba(253,205,116,0.6)]" key={countdown}>
                {countdown}
              </span>
            </div>
          </div>
          <p className="absolute bottom-[40%] text-white/80 text-lg font-semibold">Get into position...</p>
        </div>
      )}

      {/* Instruction card */}
      {phase === 'scanning' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-80px)] max-w-md">
          <div className={`backdrop-blur-xl border border-white/10 p-4 rounded-xl text-center shadow-2xl ${countdown !== null ? 'bg-secondary/30' : 'bg-on-surface/30'}`}>
            <p className="font-headline text-xl font-semibold text-white mb-1">
              {countdown !== null ? `Capturing in ${countdown}s...` : `Step ${currentStep + 1}: ${STEPS[currentStep]}`}
            </p>
            <p className="text-white/80 text-sm">
              {countdown !== null ? 'Get into position!' : STEP_INSTRUCTIONS[currentStep]}
            </p>
            {countdown === null && STEP_TIPS[currentStep] && (
              <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-0.5">
                <p className="text-[11px] text-cyan-300 font-semibold">
                  <span className="material-symbols-outlined text-[12px] align-middle mr-1">straighten</span>
                  Measuring: {STEP_TIPS[currentStep][0]}
                </p>
                <p className="text-[11px] text-white/50">
                  <span className="material-symbols-outlined text-[12px] align-middle mr-1">tips_and_updates</span>
                  {STEP_TIPS[currentStep][1]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      {phase === 'scanning' && (
        <div className="absolute bottom-0 left-0 w-full z-30 px-5 pb-12 flex flex-col items-center gap-6">
          {/* Step indicator */}
          <div className="flex items-center gap-4 bg-on-surface/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <div className="w-6 h-px bg-white/20" />}
                <div className={`flex items-center gap-2 ${i > currentStep ? 'opacity-50' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${
                    i < currentStep ? 'bg-green-400' : i === currentStep ? 'bg-secondary shadow-[0_0_8px_#FDCD74]' : 'bg-white/40'
                  }`} />
                  <span className="font-label text-xs font-semibold text-white">{step}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Capture row */}
          <div className="flex items-center justify-around w-full max-w-sm">
            <div className="w-12 h-12" />
            <button onClick={handleCapturePress} disabled={mpLoading || countdown !== null}
              className="relative w-20 h-20 flex items-center justify-center group active:scale-90 transition-transform disabled:opacity-50">
              <div className="absolute inset-0 rounded-full bg-white/20 scale-110" />
              <div className={`absolute inset-0 rounded-full shadow-[0_0_30px_rgba(108,60,225,0.4)] ${countdown !== null ? 'bg-secondary-container' : 'royal-flow'}`} />
              <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                {countdown !== null ? <span className="text-white text-2xl font-bold">{countdown || '...'}</span> : null}
              </div>
            </button>
            <button onClick={flipCamera}
              className="w-12 h-12 flex items-center justify-center bg-on-surface/20 backdrop-blur-md rounded-full text-white active:rotate-180 transition-transform">
              <span className="material-symbols-outlined">flip_camera_ios</span>
            </button>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-2 opacity-90">
            <span className="material-symbols-outlined text-secondary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <p className="font-label text-xs font-semibold text-white tracking-wide">
              Your images are analyzed on-device and never uploaded
            </p>
          </div>
        </div>
      )}

      {/* Side tools */}
      {phase === 'scanning' && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
          {['straighten', 'accessibility_new', 'shutter_speed'].map((icon) => (
            <div key={icon} className="w-12 h-12 bg-on-surface/30 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white">{icon}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
