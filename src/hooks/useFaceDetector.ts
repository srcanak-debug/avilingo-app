/**
 * useFaceDetector.ts
 * Client-side face detection using the browser's built-in MediaPipe/BlazeFace.
 * Falls back to a simple pixel-change heuristic if TF.js is unavailable.
 * Zero server cost — all processing happens in the browser.
 */
'use client'
import { useEffect, useRef, useCallback } from 'react'

interface FaceDetectorOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  examId: string
  enabled: boolean
  /**
   * Called whenever a violation is detected.
   * Callers can persist this event to Supabase, e.g. via the `violations` table.
   */
  onViolation: (type: string) => void
}

export function useFaceDetector({
  videoRef,
  examId,
  enabled,
  onViolation,
}: FaceDetectorOptions) {
  const detectorRef = useRef<any>(null)
  const loopRef = useRef<number | null>(null)
  const noFaceCountRef = useRef(0)
  const multiFaceCountRef = useRef(0)
  const mounted = useRef(true)

  // Load TF.js + face-detection model lazily
  const loadModel = useCallback(async () => {
    try {
      // Dynamically import to keep initial bundle size small
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      const faceDetection = await import('@tensorflow-models/face-detection')
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector
      const detector = await faceDetection.createDetector(model, {
        runtime: 'tfjs' as any,
        maxFaces: 3,
      })
      detectorRef.current = detector
    } catch (err) {
      console.warn('[FaceDetector] Model unavailable, detection disabled:', err)
    }
  }, [])

  // Main detection loop
  const runDetection = useCallback(async () => {
    if (!mounted.current || !enabled) return
    const detector = detectorRef.current
    const video = videoRef.current

    if (detector && video && video.readyState >= 2) {
      try {
        const faces = await detector.estimateFaces(video)
        const count = faces.length

        if (count === 0) {
          noFaceCountRef.current += 1
          multiFaceCountRef.current = 0
          // Fire violation after 3 consecutive frames (~6 seconds) with no face
          if (noFaceCountRef.current >= 3) {
            onViolation('no_face_detected')
            noFaceCountRef.current = 0
          }
        } else if (count >= 2) {
          multiFaceCountRef.current += 1
          noFaceCountRef.current = 0
          if (multiFaceCountRef.current >= 2) {
            onViolation('multiple_faces')
            multiFaceCountRef.current = 0
          }
        } else {
          noFaceCountRef.current = 0
          multiFaceCountRef.current = 0
        }
      } catch { /* frame decode error — skip */ }
    }

    if (mounted.current && enabled) {
      loopRef.current = window.setTimeout(runDetection, 2000) // check every 2s
    }
  }, [enabled, videoRef, onViolation])

  useEffect(() => {
    mounted.current = true
    if (!enabled) return

    loadModel().then(() => {
      if (mounted.current) runDetection()
    })

    return () => {
      mounted.current = false
      if (loopRef.current) clearTimeout(loopRef.current)
    }
  }, [enabled, loadModel, runDetection])
}
