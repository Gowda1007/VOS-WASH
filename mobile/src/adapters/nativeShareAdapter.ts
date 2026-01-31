import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';
import type { ShareAdapter, ShareOptions, WhatsAppShareOptions, ShareResult } from '../core/adapters/shareAdapter';

export class NativeShareAdapter implements ShareAdapter {
  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      console.log('📤 [NativeShareAdapter] Starting share with options:', options);
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('📤 [NativeShareAdapter] Sharing available:', isAvailable);
      
      if (!isAvailable) {
        console.warn('⚠️ [NativeShareAdapter] Sharing not available on this device');
        return {
          success: false,
          error: 'Sharing is not available on this device',
        };
      }

      if (options.filePath) {
        console.log('📤 [NativeShareAdapter] Sharing file:', options.filePath);
        
        // Share file (shareAsync will throw if file doesn't exist)
        await Sharing.shareAsync(options.filePath, {
          dialogTitle: options.title || 'Share',
          mimeType: options.type || 'application/pdf',
          UTI: options.type || 'application/pdf',
        });
        console.log('✅ [NativeShareAdapter] Share completed successfully');
      } else if (options.url) {
        console.log('📤 [NativeShareAdapter] Sharing URL:', options.url);
        await Sharing.shareAsync(options.url, {
          dialogTitle: options.title || 'Share',
        });
        console.log('✅ [NativeShareAdapter] URL share completed successfully');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [NativeShareAdapter] Share failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed',
      };
    }
  }

  async shareToWhatsApp(options: WhatsAppShareOptions): Promise<ShareResult> {
    try {
      console.log('💬 [NativeShareAdapter] Starting WhatsApp share');
      // Format phone number (remove + and spaces)
      const phoneNumber = options.phoneNumber.replace(/[^0-9]/g, '');
      console.log('💬 [NativeShareAdapter] Phone number:', phoneNumber);
      
      // Create WhatsApp URL
      let whatsappUrl = '';
      
      if (Platform.OS === 'android') {
        whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
      } else {
        whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
      }

      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      console.log('💬 [NativeShareAdapter] WhatsApp available:', canOpen);
      
      if (!canOpen) {
        console.warn('⚠️ [NativeShareAdapter] WhatsApp not installed');
        return {
          success: false,
          error: 'WhatsApp is not installed on this device',
        };
      }

      // If there's a file to share, use sharing
      if (options.filePath) {
        console.log('💬 [NativeShareAdapter] Sharing file to WhatsApp:', options.filePath);
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          // Share with WhatsApp (shareAsync will throw if file doesn't exist)
          await Sharing.shareAsync(options.filePath, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share to WhatsApp',
            UTI: 'application/pdf',
          });
          console.log('✅ [NativeShareAdapter] WhatsApp share completed');
          return { success: true };
        }
      } else {
        // Just open WhatsApp with message
        console.log('💬 [NativeShareAdapter] Opening WhatsApp with message only');
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
