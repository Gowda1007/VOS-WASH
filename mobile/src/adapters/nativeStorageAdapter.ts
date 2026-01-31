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
      let dir: Directory = baseDir;

      // Create directory if it doesn't exist
      if (options.directory) {
        dir = new Directory(baseDir, options.directory);
        try {
          dir.create({ intermediates: true });
        } catch {
          // Directory already exists, ignore
        }
      }
      const file = new File(dir, options.fileName);

      // Handle different data types
      if (typeof options.data === 'string') {
        file.write(options.data);
      } else if (options.data instanceof Blob) {
        // For Blob, convert to Uint8Array directly
        const arrayBuffer = await options.data.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        file.write(uint8Array);
      } else {
        // Assume it's already Uint8Array or similar
        file.write(options.data as any);
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
      file.delete();
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
