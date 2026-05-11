import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useMediaPipe from '../hooks/useMediaPipe'
import useProfileStore from '../store/profileStore'
import { classifyBodyShape, estimateMeasurements, predictSize } from '../utils/bodyShapeClassifier'
import { classifyFaceShape } from '../utils/faceShapeClassifier'
import { analyzeSkinTone } from '../utils/colorAnalysis'

const STEPS = ['Front Pose', 'Side Pose', 'Face Close-up']

export default function Scan() {
  const navigate = useNavigate()
  const { setScanResult, saveProfile } = useProfileStore()
  const {
    videoRef, canvasRef, ready, loading: mpLoading, error: mpError,
    poseLandmarks, faceLandmarks, cameraActive,
    init, startCamera, stopCamera, flipCamera,
    startDetection, stopDetection, captureFrame, detect,
  } = useMediaPipe()

  const [currentStep, setCurrentStep] = useState(0)
  const [captures, setCaptures] = useState({}) // { 0: {...}, 1: {...}, 2: {...} }
  const [heightCm, setHeightCm] = useState(165)
  const [gender, setGender] = useState('female')
  const [showHeightInput, setShowHeightInput] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [poseDetected, setPoseDetected] = useState(false)
  const [countdown, setCountdown] = useState(null) // null = not counting, 5..1 = counting

  // Initialize MediaPipe on mount
  useEffect(() => {
    init()
  }, [init])

  // Start camera once models are ready
  useEffect(() => {
    if (ready && !cameraActive) {
      startCamera()
    }
  }, [ready, cameraActive, startCamera])

  // Start detection loop once camera is active
  useEffect(() => {
    if (cameraActive && ready) {
      startDetection()
      return () => stopDetection()
    }
  }, [cameraActive, ready, startDetection, stopDetection])

  // Track if pose is detected
  useEffect(() => {
    setPoseDetected(!!poseLandmarks)
  }, [poseLandmarks])

  // Start the 5-second countdown when button is pressed
  const handleCapturePress = useCallback(() => {
    if (countdown !== null) return // already counting
    setCountdown(5)
  }, [countdown])

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      // Timer done — actually capture
      doCapture()
      setCountdown(null)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const doCapture = useCallback(() => {
    // Run one detection pass
    detect()

    if (currentStep === 0 || currentStep === 1) {
      // Front/side pose — need pose landmarks
      if (!poseLandmarks) return

      const bodyShape = classifyBodyShape(poseLandmarks)
      const measurements = estimateMeasurements(poseLandmarks, heightCm, videoRef.current?.videoHeight || 720)
      const size = predictSize(measurements.chest_cm, gender)

      setCaptures((prev) => ({
        ...prev,
        [currentStep]: { poseLandmarks: [...poseLandmarks], bodyShape, measurements, size },
      }))
    } else if (currentStep === 2) {
      // Face close-up — need face landmarks
      const canvas = captureFrame()
      const skinTone = analyzeSkinTone(canvas, faceLandmarks)
      const faceShape = faceLandmarks ? classifyFaceShape(faceLandmarks) : 'oval'

      setCaptures((prev) => ({
        ...prev,
        2: { faceLandmarks: faceLandmarks ? [...faceLandmarks] : null, skinTone, faceShape },
      }))
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      // All steps done — compile results
      finalizeScan()
    }
  }, [currentStep, poseLandmarks, faceLandmarks, heightCm, gender, captureFrame, detect])

  const finalizeScan = async () => {
    setAnalyzing(true)
    stopCamera()

    // Use front pose data (step 0) as primary
    const frontData = captures[0] || {}
    const faceData = captures[2] || {}

    const scanResult = {
      body_shape: frontData.bodyShape || 'rectangle',
      chest_cm: frontData.measurements?.chest_cm || null,
      waist_cm: frontData.measurements?.waist_cm || null,
      hip_cm: frontData.measurements?.hip_cm || null,
      shoulder_cm: frontData.measurements?.shoulder_cm || null,
      height_cm: heightCm,
      predicted_size: frontData.size || 'M',
      skin_tone_fitzpatrick: faceData.skinTone?.fitzpatrick || 3,
      skin_undertone: faceData.skinTone?.undertone || 'warm',
      color_season: faceData.skinTone?.season || 'autumn',
      face_shape: faceData.faceShape || 'oval',
      gender,
    }

    setScanResult(scanResult)

    try {
      await saveProfile(scanResult)
    } catch {
      // Still navigate even if backend save fails — data is in local store
    }

    setAnalyzing(false)
    navigate('/profile')
  }

  const instructions = [
    'Stand 6 feet away, arms slightly out',
    'Turn sideways, keep arms relaxed',
    'Face the camera straight on, close up',
  ]

  return (
    <div className="relative h-screen w-full bg-on-surface overflow-hidden">
      {/* Hidden canvas for skin tone extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera feed */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover mirror"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-on-surface/60 via-transparent to-on-surface/80" />
      </div>

      {/* Height/Gender input overlay */}
      {showHeightInput && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 w-[340px] shadow-2xl">
            <h2 className="font-headline text-2xl font-semibold text-on-surface mb-6 text-center">Quick Setup</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label text-sm font-semibold text-on-surface-variant block mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-lg"
                  min="100"
                  max="220"
                />
              </div>
              <div>
                <label className="font-label text-sm font-semibold text-on-surface-variant block mb-2">Gender</label>
                <div className="flex gap-3">
                  {['female', 'male'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-3 rounded-xl font-label text-sm font-semibold capitalize transition-all ${
                        gender === g
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container border border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowHeightInput(false)}
                className="w-full royal-flow text-white py-3 rounded-xl font-headline text-lg font-semibold mt-4 active:scale-95 transition-transform"
              >
                Start Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {(mpLoading || analyzing) && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-headline text-xl font-semibold">
            {analyzing ? 'Analyzing your profile...' : 'Loading AI models...'}
          </p>
          <p className="text-white/60 mt-2">This may take a moment</p>
        </div>
      )}

      {/* Error overlay */}
      {mpError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
          <p className="text-white font-headline text-xl mb-4">{mpError}</p>
          <button onClick={init} className="royal-flow text-white px-6 py-3 rounded-full font-label text-sm font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full flex justify-between items-center px-5 py-4 z-50">
        <Link
          to="/"
          className="w-10 h-10 flex items-center justify-center bg-on-surface/10 backdrop-blur-md rounded-full text-white hover:opacity-80 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined">close</span>
        </Link>
        <div className="font-headline text-2xl font-bold text-white drop-shadow-md">StyleSense</div>
        <button className="w-10 h-10 flex items-center justify-center bg-on-surface/10 backdrop-blur-md rounded-full text-white hover:opacity-80 active:scale-90 transition-all">
          <span className="material-symbols-outlined">help</span>
        </button>
      </header>

      {/* Silhouette overlay (steps 0-1 only) */}
      {currentStep < 2 && !showHeightInput && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-[280px] h-[580px] border-2 border-dashed border-secondary-fixed/60 rounded-[100px] flex flex-col items-center justify-center">
            <div className="absolute top-[10%] w-24 h-32 border-2 border-dashed border-secondary-fixed/40 rounded-full" />
            <div className="absolute top-[30%] w-[240px] h-[180px] border-2 border-dashed border-secondary-fixed/40 rounded-3xl" />
            <div className="absolute bottom-[10%] flex gap-8">
              <div className="w-12 h-40 border-2 border-dashed border-secondary-fixed/40 rounded-full" />
              <div className="w-12 h-40 border-2 border-dashed border-secondary-fixed/40 rounded-full" />
            </div>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-secondary-fixed" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-secondary-fixed" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-secondary-fixed" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary-fixed" />
          </div>
        </div>
      )}

      {/* Face oval guide (step 2) */}
      {currentStep === 2 && !showHeightInput && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-2 border-dashed border-secondary-fixed/60 rounded-[50%]" />
        </div>
      )}

      {/* Pose detection indicator */}
      {!showHeightInput && !mpLoading && !analyzing && (
        <div className={`absolute top-24 right-5 z-20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
          poseDetected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${poseDetected ? 'bg-green-400' : 'bg-red-400'}`} />
          {poseDetected ? 'Pose Detected' : 'No Pose'}
        </div>
      )}

      {/* Countdown overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Circular progress ring */}
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="#FDCD74" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - countdown / 5)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            {/* Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-7xl font-bold font-display drop-shadow-[0_0_30px_rgba(253,205,116,0.6)]"
                style={{ animation: 'pulse 1s ease-in-out' }} key={countdown}>
                {countdown}
              </span>
            </div>
          </div>
          <p className="absolute bottom-[40%] text-white/80 text-lg font-semibold">Get into position...</p>
        </div>
      )}

      {/* Instruction card */}
      {!showHeightInput && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-80px)] max-w-md">
          <div className={`backdrop-blur-xl border border-white/10 p-4 rounded-xl text-center shadow-2xl ${countdown !== null ? 'bg-secondary/30' : 'bg-on-surface/30'}`}>
            <p className="font-headline text-xl font-semibold text-white mb-1">
              {countdown !== null
                ? `Capturing in ${countdown}s...`
                : `Step ${currentStep + 1}: ${STEPS[currentStep]}`}
            </p>
            <p className="text-white/80 text-sm">
              {countdown !== null ? 'Get into position!' : instructions[currentStep]}
            </p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      {!showHeightInput && (
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
            <div className="w-12 h-12" /> {/* spacer */}

            <button
              onClick={handleCapturePress}
              disabled={mpLoading || analyzing || countdown !== null}
              className="relative w-20 h-20 flex items-center justify-center group active:scale-90 transition-transform disabled:opacity-50"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 scale-110" />
              <div className={`absolute inset-0 rounded-full shadow-[0_0_30px_rgba(108,60,225,0.4)] ${countdown !== null ? 'bg-secondary-container' : 'royal-flow'}`} />
              <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                {countdown !== null ? (
                  <span className="text-white text-2xl font-bold">{countdown || '...'}</span>
                ) : null}
              </div>
            </button>

            <button
              onClick={flipCamera}
              className="w-12 h-12 flex items-center justify-center bg-on-surface/20 backdrop-blur-md rounded-full text-white active:rotate-180 transition-transform"
            >
              <span className="material-symbols-outlined">flip_camera_ios</span>
            </button>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-2 opacity-90">
            <span className="material-symbols-outlined text-secondary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
            <p className="font-label text-xs font-semibold text-white tracking-wide">
              Your images are analyzed on-device and never uploaded
            </p>
          </div>
        </div>
      )}

      {/* Side tools */}
      {!showHeightInput && (
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
