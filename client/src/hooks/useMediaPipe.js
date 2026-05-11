import { useRef, useState, useCallback, useEffect } from 'react'
import { PoseLandmarker, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

/**
 * Hook to manage MediaPipe Pose + Face detection on a video stream.
 * All analysis runs client-side — no images leave the device.
 */
export default function useMediaPipe() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const poseLandmarkerRef = useRef(null)
  const faceLandmarkerRef = useRef(null)
  const animFrameRef = useRef(null)

  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [poseLandmarks, setPoseLandmarks] = useState(null)
  const [faceLandmarks, setFaceLandmarks] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState('user')

  // Initialize MediaPipe models
  const init = useCallback(async () => {
    try {
      setLoading(true)
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      })

      setReady(true)
      setLoading(false)
    } catch (err) {
      console.error('MediaPipe init error:', err)
      setError('Failed to load AI models. Please try again.')
      setLoading(false)
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.')
    }
  }, [facingMode])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    setCameraActive(false)
  }, [])

  // Flip camera
  const flipCamera = useCallback(() => {
    stopCamera()
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
  }, [stopCamera])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (cameraActive) {
      startCamera()
    }
  }, [facingMode])

  // Run detection on current video frame
  const detect = useCallback(() => {
    const video = videoRef.current
    if (!video || !poseLandmarkerRef.current || video.readyState < 2) return

    const timestamp = performance.now()

    // Pose detection
    const poseResult = poseLandmarkerRef.current.detectForVideo(video, timestamp)
    if (poseResult.landmarks && poseResult.landmarks.length > 0) {
      setPoseLandmarks(poseResult.landmarks[0])
    }

    // Face detection
    const faceResult = faceLandmarkerRef.current.detectForVideo(video, timestamp)
    if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
      setFaceLandmarks(faceResult.faceLandmarks[0])
    }
  }, [])

  // Continuous detection loop
  const startDetection = useCallback(() => {
    const loop = () => {
      detect()
      animFrameRef.current = requestAnimationFrame(loop)
    }
    loop()
  }, [detect])

  const stopDetection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  /**
   * Capture the current frame to a canvas for skin tone analysis.
   * Returns the canvas element.
   */
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    return canvas
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      stopDetection()
    }
  }, [stopCamera, stopDetection])

  return {
    videoRef,
    canvasRef,
    ready,
    loading,
    error,
    poseLandmarks,
    faceLandmarks,
    cameraActive,
    init,
    startCamera,
    stopCamera,
    flipCamera,
    startDetection,
    stopDetection,
    captureFrame,
    detect,
  }
}
