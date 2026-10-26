/** Lecteur de codes du navigateur (API Barcode Detection), absent de certains navigateurs. */
interface BarcodeDetectorInstance {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance

export function barcodeDetector(): BarcodeDetectorConstructor | undefined {
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
}

/** Le scan par caméra n'est proposé que si le navigateur sait lire les codes QR. */
export const canScanQrCodes = () => typeof window !== 'undefined' && barcodeDetector() !== undefined
