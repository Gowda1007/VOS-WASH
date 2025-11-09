import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import type { ShareAdapter, ShareOptions, WhatsAppShareOptions, ShareResult } from '../core/adapters/shareAdapter';

export class NativeShareAdapter implements ShareAdapter {
  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        return {
          success: false,
          error: 'Sharing is not available on this device',
        };
      }

      if (options.filePath) {
        await Sharing.shareAsync(options.filePath, {
          dialogTitle: options.title || 'Share',
          mimeType: options.type || 'application/pdf',
        });
      } else if (options.url) {
        await Sharing.shareAsync(options.url, {
          dialogTitle: options.title || 'Share',
        });
      }

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
      // Format phone number (remove + and spaces)
      const phoneNumber = options.phoneNumber.replace(/[^0-9]/g, '');
      
      // Create WhatsApp URL
      let whatsappUrl = '';
      
      if (Platform.OS === 'android') {
        whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
      } else {
        whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
      }

      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (!canOpen) {
        return {
          success: false,
          error: 'WhatsApp is not installed on this device',
        };
      }

      // If there's a file to share, use sharing
      if (options.filePath) {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          // First, try to share with WhatsApp directly
          await Sharing.shareAsync(options.filePath, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share to WhatsApp',
          });
          return { success: true };
        }
      } else {
        // Just open WhatsApp with message
        await Linking.openURL(whatsappUrl);
        return { success: true };
      }

      return {
        success: false,
        error: 'Unable to share to WhatsApp',
      };
    } catch (error) {
      // Fallback: Try opening WhatsApp with message only
      try {
        const phoneNumber = options.phoneNumber.replace(/[^0-9]/g, '');
        const fallbackUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
        await Linking.openURL(fallbackUrl);
        return { success: true };
      } catch (fallbackError) {
        return {
          success: false,
          error: 'WhatsApp sharing failed',
        };
      }
    }
  }

  isShareAvailable(): boolean {
    return true; // Sharing is available on all React Native platforms
  }
}
