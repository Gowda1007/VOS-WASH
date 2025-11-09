import { NativePdfAdapter } from './nativePdfAdapter';
import { NativeShareAdapter } from './nativeShareAdapter';
import { NativeQrAdapter } from './nativeQrAdapter';
import { NativeFileStorageAdapter, NativeDataStorageAdapter } from './nativeStorageAdapter';
import { NativeNotificationAdapter } from './nativeNotificationAdapter';

export const pdfAdapter = new NativePdfAdapter();
export const shareAdapter = new NativeShareAdapter();
export const qrAdapter = new NativeQrAdapter();
export const storageAdapter = new NativeDataStorageAdapter();
export const notificationAdapter = new NativeNotificationAdapter();

// Also export file storage for PDF/file operations
export const fileStorageAdapter = new NativeFileStorageAdapter();
