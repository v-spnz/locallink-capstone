import { Camera, ScanLine, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function QrCodeScanner({
  onCodeScanned,
  onClose,
  title = 'Scan customer QR code',
  instructions = 'Hold the code inside the camera frame.',
  unavailableMessage = 'QR scanning is not available in this browser. Enter the code instead.',
  cameraErrorMessage = 'Camera access was unavailable. Enter the code instead.',
}) {
  const videoRef = useRef(null)
  const onCodeScannedRef = useRef(onCodeScanned)
  const [scannerError, setScannerError] = useState('')

  useEffect(() => {
    onCodeScannedRef.current = onCodeScanned
  }, [onCodeScanned])

  useEffect(() => {
    let stream
    let animationFrame
    let isActive = true
    const videoElement = videoRef.current

    async function beginScanning() {
      if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
        setScannerError(unavailableMessage)
        return
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!isActive || !videoElement) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        videoElement.srcObject = stream
        await videoElement.play()

        async function detectCode() {
          if (!isActive) return

          try {
            const codes = await detector.detect(videoElement)
            if (codes[0]?.rawValue) {
              await onCodeScannedRef.current(codes[0].rawValue)
              if (isActive) onClose()
              return
            }
          } catch {
            // A frame can fail while the camera is starting. The next frame retries.
          }

          animationFrame = window.requestAnimationFrame(detectCode)
        }

        animationFrame = window.requestAnimationFrame(detectCode)
      } catch {
        if (isActive) setScannerError(cameraErrorMessage)
      }
    }

    beginScanning()

    return () => {
      isActive = false
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      stream?.getTracks().forEach((track) => track.stop())
      if (videoElement) videoElement.srcObject = null
    }
  }, [cameraErrorMessage, onClose, unavailableMessage])

  return (
    <div className="deal-code-scanner">
      <div className="deal-code-scanner-heading">
        <div>
          <strong>{title}</strong>
          <span>{instructions}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close scanner">
          <X aria-hidden="true" />
        </button>
      </div>
      {scannerError ? (
        <div className="deal-code-scanner-error" role="alert">
          <Camera aria-hidden="true" />
          <p>{scannerError}</p>
        </div>
      ) : (
        <div className="deal-code-camera-frame">
          <video ref={videoRef} muted playsInline aria-label="QR code camera" />
          <span aria-hidden="true">
            <ScanLine />
          </span>
        </div>
      )}
    </div>
  )
}
