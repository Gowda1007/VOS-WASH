// Storage Adapter Interface for platform-agnostic file storage
// Web: Download trigger, localStorage for data
// React Native: react-native-fs, AsyncStorage for data

export interface StorageOptions {
    data: string | Blob;    // File content
    fileName: string;       // File name with extension
    directory?: string;     // Optional subdirectory
    mimeType?: string;      // MIME type for web downloads
}

export interface StorageResult {
    filePath?: string;      // Saved file path (RN)
    success: boolean;
    error?: string;
}

export interface FileStorageAdapter {
    /**
     * Save file to device storage
     * @param options Storage options
     * @returns Storage result with file path
     */
    saveFile(options: StorageOptions): Promise<StorageResult>;

    /**
     * Read file from device storage
     * @param filePath File path to read
     * @returns File content as string or null
     */
    readFile(filePath: string): Promise<string | null>;

    /**
     * Delete file from device storage
     * @param filePath File path to delete
     * @returns Success status
     */
    deleteFile(filePath: string): Promise<boolean>;

    /**
     * Check if file exists
     * @param filePath File path to check
     * @returns True if file exists
     */
    fileExists(filePath: string): Promise<boolean>;

    /**
     * Get app's storage directory path
     * @returns Storage directory path
     */
    getStorageDirectory(): Promise<string>;
}

export interface DataStorageAdapter {
    /**
     * Store JSON data persistently
     * @param key Storage key
     * @param value Value to store
     */
    setItem(key: string, value: string): Promise<void>;

    /**
     * Retrieve JSON data
     * @param key Storage key
     * @returns Stored value or null
     */
    getItem(key: string): Promise<string | null>;

    /**
     * Remove stored data
     * @param key Storage key
     */
    removeItem(key: string): Promise<void>;

    /**
     * Clear all stored data
     */
    clear(): Promise<void>;
}
