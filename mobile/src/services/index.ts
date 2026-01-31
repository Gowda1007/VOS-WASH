import { ApiService } from '../core/services/apiService';
import { SyncService } from '../core/services/syncService';
import { NativePdfAdapter } from '../adapters/nativePdfAdapter';
import { NativeShareAdapter } from '../adapters/nativeShareAdapter';
import { NativeQrAdapter } from '../adapters/nativeQrAdapter';
import { NativeFileStorageAdapter, NativeDataStorageAdapter } from '../adapters/nativeStorageAdapter';
import { NativeNotificationAdapter } from '../adapters/nativeNotificationAdapter';
import { RawMaterialService } from '../core/services/rawMaterialService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://vos-wash-server.onrender.com/api';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

console.log('🔧 API Configuration:', {
  API_URL,
  API_KEY_SET: !!API_KEY,
  API_KEY_PREFIX: API_KEY?.substring(0, 8),
});

export const apiService = new ApiService({
  baseURL: API_URL,
  apiKey: API_KEY,
});

// Lazy initialization to avoid module evaluation crashes
let _dataStorage: NativeDataStorageAdapter | null = null;
let _syncService: SyncService | null = null;
let _pdfAdapter: NativePdfAdapter | null = null;
let _shareAdapter: NativeShareAdapter | null = null;
let _qrAdapter: NativeQrAdapter | null = null;
let _fileStorage: NativeFileStorageAdapter | null = null;
let _notificationAdapter: NativeNotificationAdapter | null = null;
let _rawMaterialService: RawMaterialService | null = null;

export function getDataStorage() {
  if (!_dataStorage) _dataStorage = new NativeDataStorageAdapter();
  return _dataStorage;
}

export function getSyncService() {
  if (!_syncService) _syncService = new SyncService(apiService, getDataStorage());
  return _syncService;
}

export function getPdfAdapter() {
  if (!_pdfAdapter) _pdfAdapter = new NativePdfAdapter();
  return _pdfAdapter;
}

export function getShareAdapter() {
  if (!_shareAdapter) _shareAdapter = new NativeShareAdapter();
  return _shareAdapter;
}

export function getQrAdapter() {
  if (!_qrAdapter) _qrAdapter = new NativeQrAdapter();
  return _qrAdapter;
}

export function getFileStorage() {
  if (!_fileStorage) _fileStorage = new NativeFileStorageAdapter();
  return _fileStorage;
}

export function getNotificationAdapter() {
  if (!_notificationAdapter) _notificationAdapter = new NativeNotificationAdapter();
  return _notificationAdapter;
}

export function getRawMaterialService() {
  if (!_rawMaterialService) _rawMaterialService = new RawMaterialService(apiService);
  return _rawMaterialService;
}

// Compatibility exports using Object.defineProperty for lazy evaluation
Object.defineProperty(exports, 'dataStorage', { get: getDataStorage });
Object.defineProperty(exports, 'syncService', { get: getSyncService });
Object.defineProperty(exports, 'pdfAdapter', { get: getPdfAdapter });
Object.defineProperty(exports, 'shareAdapter', { get: getShareAdapter });
Object.defineProperty(exports, 'qrAdapter', { get: getQrAdapter });
Object.defineProperty(exports, 'fileStorage', { get: getFileStorage });
Object.defineProperty(exports, 'notificationAdapter', { get: getNotificationAdapter });
Object.defineProperty(exports, 'rawMaterialService', { get: getRawMaterialService });

export async function initializeServices() {
  try {
    // Eagerly initialize services to ensure they're ready
    getDataStorage();
    getSyncService();
    getPdfAdapter();
    getShareAdapter();
    getQrAdapter();
    getFileStorage();
    getNotificationAdapter();
    getRawMaterialService();
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
}
