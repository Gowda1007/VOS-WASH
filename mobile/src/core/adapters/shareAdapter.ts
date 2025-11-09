// Share Adapter Interface for platform-agnostic sharing
// Web: Web Share API or fallback
// React Native: react-native-share

export interface ShareOptions {
    title?: string;
    message?: string;
    url?: string;
    filePath?: string;      // File to share (PDF, image, etc.)
    type?: string;          // MIME type
}

export interface WhatsAppShareOptions {
    phoneNumber: string;    // Phone number with country code (e.g., "919876543210")
    message: string;
    filePath?: string;      // Optional file to attach
}

export interface ShareResult {
    success: boolean;
    error?: string;
}

export interface ShareAdapter {
    /**
     * Share content via native share sheet
     * @param options Share options
     * @returns Share result
     */
    share(options: ShareOptions): Promise<ShareResult>;

    /**
     * Share directly to WhatsApp
     * @param options WhatsApp share options
     * @returns Share result
     */
    shareToWhatsApp(options: WhatsAppShareOptions): Promise<ShareResult>;

    /**
     * Check if sharing is available on current platform
     */
    isShareAvailable(): boolean;
}
