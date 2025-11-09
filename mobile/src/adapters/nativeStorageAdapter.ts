import { Paths, Directory, File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  FileStorageAdapter,
  DataStorageAdapter,
  StorageOptions,
  StorageResult,
} from '../core/adapters/storageAdapter';

export class NativeFileStorageAdapter implements FileStorageAdapter {
  async saveFile(options: StorageOptions): Promise<StorageResult> {
    try {
        const baseDir = Paths.document;
        const dir = options.directory
          ? new Directory(baseDir, options.directory)
          : baseDir;

      // Create directory if it doesn't exist
      if (options.directory) {
          if (!dir.exists) {
            await dir.create({ intermediates: true });
        }
      }

        const file = new File(dir, options.fileName);

      // Handle different data types
      if (typeof options.data === 'string') {
          await file.write(options.data);
      } else {
        // For Blob, we need to convert to base64
        const base64 = await this.blobToBase64(options.data);
          await file.write(base64);
      }

      return {
          filePath: file.uri,
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File save failed',
      };
    }
  }

  async readFile(filePath: string): Promise<string | null> {
    try {
        const file = new File(filePath);
        const content = await file.text();
      return content;
    } catch {
      return null;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
        const file = new File(filePath);
        if (file.exists) {
          await file.delete();
        }
      return true;
    } catch {
      return false;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
        const file = new File(filePath);
        return file.exists;
    } catch {
      return false;
    }
  }

  async getStorageDirectory(): Promise<string> {
     return Paths.document.uri;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export class NativeDataStorageAdapter implements DataStorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}
