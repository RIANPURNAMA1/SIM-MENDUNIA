import * as faceapi from '@vladmandic/face-api'

export interface DetectedFace {
  x: number
  y: number
  width: number
  height: number
  turned: boolean
}

const MODEL_URL = '/face-api-models'
const YAW_THRESHOLD = 0.26

let loadPromise: Promise<boolean> | null = null
let modelsReady = false

export const faceModelsReady = (): boolean => modelsReady

export const loadFaceModels = (): Promise<boolean> => {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        modelsReady = true
        return true
      } catch {
        return false
      }
    })()
  }
  return loadPromise
}

export const detectFace = async (video: HTMLVideoElement): Promise<DetectedFace | null> => {
  if (!(await loadFaceModels())) throw new Error('face models unavailable')
  if (!video.videoWidth || !video.videoHeight) return null
  try {
    const det = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
      .withFaceLandmarks()
    if (!det) return null
    const box = det.detection.box
    const lm = det.landmarks.positions
    const nose = lm[30]
    const leftEye = lm[36]
    const rightEye = lm[45]
    const eyeMidX = (leftEye.x + rightEye.x) / 2
    const eyeDist = rightEye.x - leftEye.x
    const yawRatio = eyeDist > 0 ? (nose.x - eyeMidX) / (eyeDist / 2) : 0
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      turned: Math.abs(yawRatio) > YAW_THRESHOLD,
    }
  } catch {
    return null
  }
}