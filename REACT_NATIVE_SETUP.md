# React Native Setup Guide for VOS Wash App

This guide provides step-by-step instructions to build the VOS Wash app as a React Native APK with all features working.

## Prerequisites

- Node.js 18+ installed
- Android Studio installed (for Android development)
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

## Project Structure

The app is designed with a **shared core** architecture:

```
vos-wash/
├── core/                      # Platform-agnostic business logic
│   ├── types/                 # TypeScript interfaces
│   ├── utils/                 # Utility functions
│   ├── services/              # API & Sync services
│   └── adapters/              # Platform adapter interfaces
├── web/                       # Web-specific code (current React app)
└── mobile/                    # React Native app (to be created)
```

## Step 1: Initialize React Native Project

```bash
# Navigate to workspace root
cd c:\Users\nithy\Desktop\vos-wash

# Create Expo React Native project
npx create-expo-app mobile --template blank-typescript

# Navigate to mobile directory
cd mobile
```

## Step 2: Install Required Dependencies

```bash
# Core React Native navigation & UI
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated

# PDF Generation
npm install react-native-html-to-pdf
npm install react-native-webview

# File System Access
npm install react-native-fs

# Sharing (WhatsApp, etc.)
npm install react-native-share

# QR Code Generation
npm install react-native-qrcode-svg react-native-svg

# Notifications
npm install expo-notifications

# Async Storage
npm install @react-native-async-storage/async-storage

# Charts (for dashboard)
npm install react-native-chart-kit react-native-svg

# Other utilities
npm install expo-linking expo-file-system
```

## Step 3: Configure Expo for Native Modules

Update `app.json` in the mobile directory:

```json
{
  "expo": {
    "name": "VOS Wash",
    "slug": "vos-wash",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.voswash.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

## Step 4: Create Platform Adapters for React Native

### 4.1 PDF Adapter (Native)

Create `mobile/src/adapters/nativePdfAdapter.ts`:

```typescript
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import type { PdfAdapter, PdfGenerationOptions, PdfResult } from '../../../core/adapters/pdfAdapter';

export class NativePdfAdapter implements PdfAdapter {
  async generateInvoicePdf(options: PdfGenerationOptions): Promise<PdfResult> {
    try {
      // Generate HTML for invoice
      const html = this.generateInvoiceHTML(options);
      
      const pdfOptions = {
        html,
        fileName: `Invoice_${options.invoice.invoiceNumber}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(pdfOptions);
      
      return {
        filePath: file.filePath!,
        fileName: `Invoice_${options.invoice.invoiceNumber}.pdf`,
        success: true,
      };
    } catch (error) {
      return {
        fileName: '',
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      };
    }
  }

  async savePdfToDevice(filePath: string, fileName: string): Promise<string> {
    const destPath = `${RNFS.ExternalStorageDirectoryPath}/VOSWash/Invoices/${fileName}`;
    await RNFS.mkdir(`${RNFS.ExternalStorageDirectoryPath}/VOSWash/Invoices`);
    await RNFS.copyFile(filePath, destPath);
    return destPath;
  }

  private generateInvoiceHTML(options: PdfGenerationOptions): string {
    // Use the same invoice template as web version
    // Reuse core/utils/invoiceUtils.ts for calculations
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Inline CSS for PDF styling */
          body { font-family: Arial, sans-serif; padding: 20px; }
          /* ... rest of your invoice styles ... */
        </style>
      </head>
      <body>
        <h1>Invoice ${options.invoice.invoiceNumber}</h1>
        <!-- Invoice content here -->
      </body>
      </html>
    `;
  }
}
```

### 4.2 Share Adapter (Native)

Create `mobile/src/adapters/nativeShareAdapter.ts`:

```typescript
import Share from 'react-native-share';
import { Linking } from 'react-native';
import type { ShareAdapter, ShareOptions, WhatsAppShareOptions, ShareResult } from '../../../core/adapters/shareAdapter';

export class NativeShareAdapter implements ShareAdapter {
  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      const shareOptions: any = {
        title: options.title,
        message: options.message,
        url: options.url,
      };

      if (options.filePath) {
        shareOptions.url = `file://${options.filePath}`;
        shareOptions.type = options.type || 'application/pdf';
      }

      await Share.open(shareOptions);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed',
      };
    }
  }

  async shareToWhatsApp(options: WhatsAppShareOptions): Promise<ShareResult> {
    try {
      const shareOptions: any = {
        social: Share.Social.WHATSAPP,
        message: options.message,
        whatsAppNumber: options.phoneNumber,
      };

      if (options.filePath) {
        shareOptions.url = `file://${options.filePath}`;
      }

      await Share.shareSingle(shareOptions);
      return { success: true };
    } catch (error) {
      // Fallback to WhatsApp URL scheme
      const url = `whatsapp://send?phone=${options.phoneNumber}&text=${encodeURIComponent(options.message)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return { success: true };
      }

      return {
        success: false,
        error: 'WhatsApp not installed',
      };
    }
  }

  isShareAvailable(): boolean {
    return true;
  }
}
```

### 4.3 QR Code Adapter (Native)

Create `mobile/src/adapters/nativeQrAdapter.ts`:

```typescript
import QRCode from 'react-native-qrcode-svg';
import type { QrCodeAdapter, QrCodeOptions, QrCodeResult } from '../../../core/adapters/qrAdapter';

export class NativeQrAdapter implements QrCodeAdapter {
  async generateQrCode(options: QrCodeOptions): Promise<QrCodeResult> {
    // In React Native, QR codes are rendered as components
    // Return the data needed to render the QR component
    return {
      svg: options.data, // Store data for later rendering
      success: true,
    };
  }

  async generateUpiQrCode(upiId: string, amount: number, name: string): Promise<QrCodeResult> {
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    return this.generateQrCode({ data: upiString });
  }
}
```

### 4.4 Storage Adapters (Native)

Create `mobile/src/adapters/nativeStorageAdapter.ts`:

```typescript
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileStorageAdapter, DataStorageAdapter, StorageOptions, StorageResult } from '../../../core/adapters/storageAdapter';

export class NativeFileStorageAdapter implements FileStorageAdapter {
  async saveFile(options: StorageOptions): Promise<StorageResult> {
    try {
      const dir = options.directory 
        ? `${RNFS.ExternalStorageDirectoryPath}/VOSWash/${options.directory}`
        : `${RNFS.ExternalStorageDirectoryPath}/VOSWash`;
      
      await RNFS.mkdir(dir);
      
      const filePath = `${dir}/${options.fileName}`;
      const content = typeof options.data === 'string' ? options.data : await this.blobToBase64(options.data);
      
      await RNFS.writeFile(filePath, content, 'utf8');
      
      return {
        filePath,
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
      return await RNFS.readFile(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await RNFS.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    return await RNFS.exists(filePath);
  }

  async getStorageDirectory(): Promise<string> {
    return `${RNFS.ExternalStorageDirectoryPath}/VOSWash`;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
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
```

### 4.5 Notification Adapter (Native)

Create `mobile/src/adapters/nativeNotificationAdapter.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationAdapter, NotificationOptions, ScheduledNotificationOptions, NotificationResult } from '../../../core/adapters/notificationAdapter';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NativeNotificationAdapter implements NotificationAdapter {
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return finalStatus === 'granted';
  }

  async showNotification(options: NotificationOptions): Promise<NotificationResult> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data,
          sound: options.sound !== false,
          badge: options.badge,
        },
        trigger: null, // Immediate
      });

      return {
        success: true,
        notificationId: id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification failed',
      };
    }
  }

  async scheduleNotification(options: ScheduledNotificationOptions): Promise<NotificationResult> {
    try {
      const trigger = options.trigger.seconds
        ? { seconds: options.trigger.seconds, repeats: options.trigger.repeats }
        : { date: options.trigger.date!, repeats: options.trigger.repeats };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data,
          sound: options.sound !== false,
          badge: options.badge,
        },
        trigger,
      });

      return {
        success: true,
        notificationId: id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Notification scheduling failed',
      };
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}
```

## Step 5: Initialize Services with Adapters

Create `mobile/src/services/index.ts`:

```typescript
import { ApiService } from '../../../core/services/apiService';
import { SyncService } from '../../../core/services/syncService';
import { NativePdfAdapter } from '../adapters/nativePdfAdapter';
import { NativeShareAdapter } from '../adapters/nativeShareAdapter';
import { NativeQrAdapter } from '../adapters/nativeQrAdapter';
import { NativeFileStorageAdapter, NativeDataStorageAdapter } from '../adapters/nativeStorageAdapter';
import { NativeNotificationAdapter } from '../adapters/nativeNotificationAdapter';

// Initialize API service with your server URL
const apiService = new ApiService({
  baseURL: 'http://YOUR_SERVER_IP:3001/api', // Replace with actual server URL
  apiKey: 'your-api-key-here', // Optional
});

// Initialize storage adapter
const dataStorage = new NativeDataStorageAdapter();

// Initialize sync service
const syncService = new SyncService(apiService, dataStorage);

// Initialize platform adapters
export const pdfAdapter = new NativePdfAdapter();
export const shareAdapter = new NativeShareAdapter();
export const qrAdapter = new NativeQrAdapter();
export const fileStorage = new NativeFileStorageAdapter();
export const notificationAdapter = new NativeNotificationAdapter();

// Export services
export { apiService, syncService, dataStorage };

// Initialize sync service
syncService.initialize();
```

## Step 6: Create React Native UI Components

Reuse your existing component structure but adapt for React Native:

1. Replace HTML elements with React Native components:
   - `div` → `View`
   - `button` → `TouchableOpacity` / `Button`
   - `input` → `TextInput`
   - `img` → `Image`

2. Replace Tailwind CSS with StyleSheet:
   ```typescript
   import { StyleSheet } from 'react-native';
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#fff',
       padding: 16,
     },
     // ... more styles
   });
   ```

3. Use React Navigation instead of React Router

## Step 7: Build APK

### Development Build

```bash
# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Build APK for Android
eas build --platform android --profile preview
```

### Production Build

```bash
# Build production APK
eas build --platform android --profile production
```

## Step 8: Testing Checklist

Before deploying, test all features:

- [ ] PDF generation and preview
- [ ] WhatsApp sharing with PDF attachment
- [ ] QR code generation (UPI payment)
- [ ] Invoice CRUD operations
- [ ] Customer management
- [ ] Pending orders
- [ ] Real-time sync with server
- [ ] File storage to device
- [ ] Local notifications
- [ ] Offline mode with sync on reconnect
- [ ] Charts and analytics display
- [ ] Multi-language support
- [ ] Theme switching (system theme)

## Environment Configuration

Create `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001/api
EXPO_PUBLIC_API_KEY=your-api-key-here
```

Use in code:
```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

## Important Notes

1. **Network Access**: Replace `localhost` with your actual server IP address (find with `ipconfig` on Windows)

2. **CORS**: Ensure your server allows requests from the mobile app (already configured in server.ts)

3. **Permissions**: App will request permissions at runtime for:
   - File storage
   - Notifications
   - Camera (for QR scanning if implemented)

4. **File Paths**: Android uses `/storage/emulated/0/` for external storage

5. **Sync Strategy**: App syncs on:
   - App startup
   - Manual refresh
   - After creating/updating data
   - When network reconnects

## Troubleshooting

### Build Errors

```bash
# Clear cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

### PDF Generation Issues

- Ensure HTML is valid and self-contained
- Test HTML in browser first
- Check file permissions on device

### WhatsApp Share Not Working

- Verify WhatsApp is installed
- Check file URI format: `file:///path/to/file.pdf`
- Ensure MIME type is correct

## Next Steps

1. Deploy your Express server to a production environment
2. Update `EXPO_PUBLIC_API_URL` with production URL
3. Test thoroughly on physical device
4. Submit to Google Play Store

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
