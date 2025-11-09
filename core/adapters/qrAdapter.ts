// QR Code Adapter Interface for platform-agnostic QR generation
// Web: Remote API (qrserver.com) or qrcode.js
// React Native: react-native-qrcode-svg

export interface QrCodeOptions {
    data: string;           // Data to encode (UPI string, URL, etc.)
    size?: number;          // Size in pixels (default: 200)
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';  // Default: 'M'
}

export interface QrCodeResult {
    uri?: string;           // Data URI or remote URL (web)
    svg?: string;           // SVG string (RN)
    filePath?: string;      // Saved file path (optional)
    success: boolean;
    error?: string;
}

export interface QrCodeAdapter {
    /**
     * Generate QR code image
     * @param options QR code generation options
     * @returns QR code result with URI or SVG
     */
    generateQrCode(options: QrCodeOptions): Promise<QrCodeResult>;

    /**
     * Generate UPI payment QR code
     * @param upiId UPI ID (e.g., "merchant@upi")
     * @param amount Payment amount
     * @param name Payee name
     * @returns QR code result
     */
    generateUpiQrCode(upiId: string, amount: number, name: string): Promise<QrCodeResult>;
}
