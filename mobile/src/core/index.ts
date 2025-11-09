// Core package exports - platform-agnostic business logic
// Can be imported by both web and React Native apps

// Types
export * from './types';

// Utils
export * from './utils/invoiceUtils';

// Services
export { ApiService } from './services/apiService';
export type { ApiConfig } from './services/apiService';

export { SyncService } from './services/syncService';
export type { SyncState, SyncResult } from './services/syncService';

// Adapters
export type { 
    PdfAdapter, 
    PdfGenerationOptions, 
    PdfResult 
} from './adapters/pdfAdapter';

export type { 
    QrCodeAdapter, 
    QrCodeOptions, 
    QrCodeResult 
} from './adapters/qrAdapter';

export type { 
    ShareAdapter, 
    ShareOptions, 
    WhatsAppShareOptions, 
    ShareResult 
} from './adapters/shareAdapter';

export type { 
    FileStorageAdapter, 
    DataStorageAdapter,
    StorageOptions, 
    StorageResult 
} from './adapters/storageAdapter';

export type { 
    NotificationAdapter, 
    NotificationOptions, 
    ScheduledNotificationOptions, 
    NotificationResult 
} from './adapters/notificationAdapter';
