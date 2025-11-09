import { ApiService } from '../core/services/apiService';
import { SyncService } from '../core/services/syncService';
import { NativePdfAdapter } from '../adapters/nativePdfAdapter';
import { NativeShareAdapter } from '../adapters/nativeShareAdapter';
import { NativeQrAdapter } from '../adapters/nativeQrAdapter';
import { NativeFileStorageAdapter, NativeDataStorageAdapter } from '../adapters/nativeStorageAdapter';
import { NativeNotificationAdapter } from '../adapters/nativeNotificationAdapter';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://vos-wash-server.onrender.com/api';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export const apiService = new ApiService({
  baseURL: API_URL,
  apiKey: API_KEY,
});

export const dataStorage = new NativeDataStorageAdapter();

export const syncService = new SyncService(apiService, dataStorage);

export const pdfAdapter = new NativePdfAdapter();
export const shareAdapter = new NativeShareAdapter();
export const qrAdapter = new NativeQrAdapter();
export const fileStorage = new NativeFileStorageAdapter();
export const notificationAdapter = new NativeNotificationAdapter();

export async function initializeServices() {
  try {
    await syncService.initialize();
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
}
