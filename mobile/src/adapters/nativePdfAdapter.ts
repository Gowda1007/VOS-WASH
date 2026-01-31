import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Directory, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import type { PdfAdapter, PdfGenerationOptions, PdfResult } from '../core/adapters/pdfAdapter';
import type { Language } from '../core/types';
import { invoiceTranslations } from '../context/LanguageContext';
import { generateInvoiceHTML } from '../core/utils/invoiceRenderer';
import { calculateInvoiceTotalsFromInvoice, isValidGstNumber } from '../core/utils/invoiceUtils';
import { getLogoBase64, getBannerBase64 } from '../assets/assetLoader';

export class NativePdfAdapter implements PdfAdapter {
  private permissionsGranted: boolean = false;

  async requestStoragePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    if (this.permissionsGranted) {
      return true;
    }

    try {
      console.log('📁 [NativePdfAdapter] Requesting storage and call permissions...');
      
      // For Android 13+ (API 33+), we need different permissions
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 33) {
        // Android 13+: Request media permissions
        const storageGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Storage Permission',
            message: 'VOS WASH needs storage access to save PDF invoices to your Downloads folder.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        // Request call permission
        const callGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Phone Call Permission',
            message: 'VOS WASH needs permission to make phone calls to customers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        this.permissionsGranted = storageGranted === PermissionsAndroid.RESULTS.GRANTED;
      } else if (androidVersion >= 30) {
        // Android 11-12: Use SAF, no explicit permission needed
        // But still request call permission
        const callGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Phone Call Permission',
            message: 'VOS WASH needs permission to make phone calls to customers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        this.permissionsGranted = true;
      } else {
        // Android 10 and below: Request WRITE_EXTERNAL_STORAGE
        const storageGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'VOS WASH needs storage access to save PDF invoices.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        // Request call permission
        const callGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Phone Call Permission',
            message: 'VOS WASH needs permission to make phone calls to customers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        this.permissionsGranted = storageGranted === PermissionsAndroid.RESULTS.GRANTED;
      }

      console.log('📁 [NativePdfAdapter] Storage permissions granted:', this.permissionsGranted);
      return this.permissionsGranted;
    } catch (err) {
      console.error('❌ [NativePdfAdapter] Error requesting storage permissions:', err);
      return false;
    }
  }

  async generateInvoicePdf(options: PdfGenerationOptions): Promise<PdfResult> {
    try {
      console.log('📄 [NativePdfAdapter] Starting PDF generation with image encoding...');
      
      // Request storage permissions if not already granted
      await this.requestStoragePermissions();
      
      // Use the cached asset loader instead of loading directly
      const [logoB64, bannerB64] = await Promise.all([
        getLogoBase64().catch((e) => { console.warn('Logo load failed:', e); return null; }),
        getBannerBase64().catch((e) => { console.warn('Banner load failed:', e); return null; }),
      ]);
      
      if (logoB64) {
        console.log('✅ [NativePdfAdapter] Logo encoded successfully:', logoB64.substring(0, 50) + '... (' + logoB64.length + ' chars)');
      } else {
        console.warn('⚠️ [NativePdfAdapter] Logo encoding failed - PDF will be generated without logo');
      }
      
      if (bannerB64) {
        console.log('✅ [NativePdfAdapter] Banner encoded successfully:', bannerB64.substring(0, 50) + '... (' + bannerB64.length + ' chars)');
      } else {
        console.warn('⚠️ [NativePdfAdapter] Banner encoding failed - PDF will be generated without banner');
      }
      
      console.log('🖼️ [NativePdfAdapter] Images ready for PDF:', { hasLogo: !!logoB64, hasBanner: !!bannerB64 });

      const hasValidGst = isValidGstNumber(options.gstNumber);
      
      const lang: Language = (options.invoice as any).language || 'en';
      const translate = (key: string) => invoiceTranslations[key]?.[lang] || key;

      const companyName = lang === 'kn' ? translate('app-name-invoice') : (options.companyName || translate('app-name-invoice'));
      const companyTagline = lang === 'kn' ? translate('app-tagline') : (options.companyTagline || translate('app-tagline'));

      const renderData = {
        invoice: options.invoice,
        language: lang,
        translate,
        company: {
          name: companyName,
          tagline: companyTagline || '',
          address: options.companyAddress,
          phone: options.companyPhone,
          email: options.companyEmail,
          gstNumber: options.gstNumber,
        },
        images: { logoB64: logoB64 || undefined, bannerB64: bannerB64 || undefined },
      } as const;

      const calculations = calculateInvoiceTotalsFromInvoice(options.invoice, hasValidGst);
      const html = generateInvoiceHTML(renderData, calculations, 1.6);

      console.log('📝 [NativePdfAdapter] HTML generated, creating PDF file...');
      // Generate A4-sized PDF with proper filename including language
      const langSuffix = lang === 'kn' ? '_KN' : '_EN';
      const fileName = `Invoice_${options.invoice.invoiceNumber}${langSuffix}.pdf`;
      
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: Platform.OS === 'android', width: 595, height: 842 } as any);
      console.log('📄 [NativePdfAdapter] PDF file created at:', uri);
      
      console.log('💾 [NativePdfAdapter] Saving PDF to device storage...');
      const savedUri = await this.savePdfToDevice(uri, fileName, base64);
      console.log('✅ [NativePdfAdapter] PDF saved successfully to:', savedUri);
      
      return { filePath: savedUri, fileName, success: true };
    } catch (error) {
      const errorLang: Language = (options.invoice as any).language || 'en';
      const langSuffix = errorLang === 'kn' ? '_KN' : '_EN';
      return { fileName: `Invoice_${options.invoice.invoiceNumber}${langSuffix}.pdf`, success: false, error: error instanceof Error ? error.message : 'PDF generation failed' };
    }
  }

  async generateInvoicePdfForSharing(options: PdfGenerationOptions): Promise<PdfResult> {
    try {
      console.log('📤 [NativePdfAdapter] Generating PDF for sharing (temporary cache)...');
      
      // Use the cached asset loader
      const [logoB64, bannerB64] = await Promise.all([
        getLogoBase64().catch(() => null),
        getBannerBase64().catch(() => null),
      ]);

      const hasValidGst = isValidGstNumber(options.gstNumber);
      const lang: Language = (options.invoice as any).language || 'en';
      const translate = (key: string) => invoiceTranslations[key]?.[lang] || key;
      const companyName = lang === 'kn' ? translate('app-name-invoice') : (options.companyName || translate('app-name-invoice'));
      const companyTagline = lang === 'kn' ? translate('app-tagline') : (options.companyTagline || translate('app-tagline'));

      const renderData = {
        invoice: options.invoice,
        language: lang,
        translate,
        company: {
          name: companyName,
          tagline: companyTagline || '',
          address: options.companyAddress,
          phone: options.companyPhone,
          email: options.companyEmail,
          gstNumber: options.gstNumber,
        },
        images: { logoB64: logoB64 || undefined, bannerB64: bannerB64 || undefined },
      } as const;

      const calculations = calculateInvoiceTotalsFromInvoice(options.invoice, hasValidGst);
      const html = generateInvoiceHTML(renderData, calculations, 1.6);

      // Generate filename with language suffix
      const langSuffix = lang === 'kn' ? '_KN' : '_EN';
      const fileName = `Invoice_${options.invoice.invoiceNumber}${langSuffix}.pdf`;

      // Generate PDF in cache directory (temporary)
      const cacheDir = new Directory(Paths.cache);
      const tempFile = new File(cacheDir, fileName);

      // Delete old file with same name if exists
      try {
        if (tempFile.exists) {
          tempFile.delete();
          console.log('🗑️ [NativePdfAdapter] Deleted old temporary PDF');
        }
      } catch {
        // Ignore if file doesn't exist
      }

      // Generate new PDF
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 } as any);
      
      // Copy to cache with proper filename (replacing old one)
      const sourceFile = new File(uri);
      sourceFile.copy(tempFile);
      
      console.log('✅ [NativePdfAdapter] PDF ready for sharing at:', tempFile.uri);
      
      return { filePath: tempFile.uri, fileName, success: true };
    } catch (error) {
      const errorLang: Language = (options.invoice as any).language || 'en';
      const langSuffix = errorLang === 'kn' ? '_KN' : '_EN';
      return { 
        fileName: `Invoice_${options.invoice.invoiceNumber}${langSuffix}.pdf`, 
        success: false, 
        error: error instanceof Error ? error.message : 'PDF generation failed' 
      };
    }
  }

  async savePdfToDevice(filePath: string, fileName: string, base64Data?: string): Promise<string> {
    // Preferred: On Android save into a visible VOSWASH folder via SAF (Downloads or user-chosen location)
    let savedPath: string | null = null;
    if (Platform.OS === 'android') {
      try {
        const saved = await this.saveWithSaf(fileName, base64Data, filePath);
        if (saved) {
          savedPath = saved;
          // Show download notification
          this.showDownloadNotification(fileName, saved);
          return saved;
        }
      } catch {
        // Fall through to sandbox save
      }
    }

    // Fallback: App sandbox Documents/VOSWASH
    const voswashDir = new Directory(Paths.document, 'VOSWASH');
    try {
      voswashDir.create({ intermediates: true });
    } catch (e) {
      // Directory might already exist, ignore error
    }
    let destFile = new File(voswashDir, fileName);
    // Try to delete if exists, if not, create new filename with timestamp
    try {
      if (destFile.exists) {
        destFile.delete();
      }
    } catch {
      // File might not exist or deletion failed, create new filename
      const dot = fileName.lastIndexOf('.');
      const base = dot > 0 ? fileName.substring(0, dot) : fileName;
      const ext = dot > 0 ? fileName.substring(dot) : '';
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      destFile = new File(voswashDir, `${base}_${ts}${ext}`);
    }
    // Copy file using new API
    const sourceFile = new File(filePath);
    sourceFile.copy(destFile);
    
    // Show download notification for sandbox save too
    this.showDownloadNotification(fileName, destFile.uri);
    
    return destFile.uri;
  }

  private async showDownloadNotification(fileName: string, path: string): Promise<void> {
    try {
      const { notificationAdapter } = await import('./index');
      // Read persisted SAF directory (if configured) to help open folder view
      let dirUri: string | null = null;
      try { dirUri = await AsyncStorage.getItem('VOSWASH_SAF_DIR'); } catch {}
      
      // Determine user-friendly path description
      let locationDesc = 'VOSWASH folder';
      if (path.includes('Download')) {
        locationDesc = 'Downloads/VOSWASH';
      } else if (path.includes('content://')) {
        locationDesc = 'VOSWASH folder in your chosen location';
      }
      
      await notificationAdapter.showNotification?.({
        title: '📄 PDF Saved Successfully',
        body: `${fileName} saved to ${locationDesc}`,
        data: { type: 'download', path, dirUri },
      });
      
      console.log('✅ [NativePdfAdapter] PDF saved to:', locationDesc);
    } catch (e) {
      console.warn('Failed to show download notification:', e);
    }
  }

  async openPdf(filePath: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath);
    }
  }

  private async loadAssetBase64(module: any): Promise<string> {
    try {
      console.log('📦 [NativePdfAdapter] Loading asset module:', module);
      
      // Try Asset API first
      try {
        const asset = Asset.fromModule(module);
        console.log('📦 [NativePdfAdapter] Asset object:', { downloaded: asset.downloaded, uri: asset.uri, localUri: asset.localUri });
        
        // Ensure asset is downloaded
        if (!asset.downloaded) {
          console.log('⬇️ [NativePdfAdapter] Downloading asset...');
          await asset.downloadAsync();
        }
        
        // Try multiple URI sources
        const possibleUris = [
          asset.localUri,
          asset.uri,
          // In production, assets might be at different locations
          typeof module === 'number' ? `asset:///${module}` : null,
        ].filter(Boolean);
        
        console.log('📦 [NativePdfAdapter] Trying URIs:', possibleUris);
        
        for (const uri of possibleUris) {
          try {
            console.log('🔍 [NativePdfAdapter] Checking URI:', uri);
            // Try to read the file using new File API
            const file = new File(uri as string);
            const base64 = await file.base64();
            console.log('✅ [NativePdfAdapter] Asset loaded successfully from:', uri, 'size:', base64.length);
            return base64;
          } catch (e) {
            console.warn('⚠️ [NativePdfAdapter] Failed to read from URI:', uri, e);
            continue;
          }
        }
        
        throw new Error('All URI attempts failed');
      } catch (assetError) {
        console.warn('⚠️ [NativePdfAdapter] Asset API failed, trying bundled path:', assetError);
        
        // Fallback: Try to resolve from bundled assets
        // In production builds, we need to use the asset's hash/bundled path
        const resolvedAsset = Asset.fromModule(module);
        await resolvedAsset.downloadAsync();
        
        // Force use the resolved localUri or uri
        const finalUri = resolvedAsset.localUri || resolvedAsset.uri;
        if (!finalUri) {
          throw new Error('Cannot resolve asset URI in production build');
        }
        
        console.log('🔄 [NativePdfAdapter] Fallback URI:', finalUri);
        const fallbackFile = new File(finalUri);
        const base64 = await fallbackFile.base64();
        console.log('✅ [NativePdfAdapter] Asset loaded via fallback, size:', base64.length);
        return base64;
      }
    } catch (error) {
      console.error('❌ [NativePdfAdapter] Failed to load asset:', error);
      throw error;
    }
  }

  private async saveWithSaf(fileName: string, base64Data?: string, fallbackPath?: string): Promise<string | null> {
    const SAF = (FileSystem as any).StorageAccessFramework as unknown as {
      requestDirectoryPermissionsAsync: (initialUri?: string) => Promise<{ granted: boolean; directoryUri: string }>;
      readDirectoryAsync: (dirUri: string) => Promise<string[]>;
      makeDirectoryAsync?: (dirUri: string, folderName: string) => Promise<string>;
      createDirectoryAsync?: (dirUri: string, folderName: string) => Promise<string>;
      createFileAsync: (dirUri: string, fileName: string, mimeType: string) => Promise<string>;
      writeAsStringAsync: (fileUri: string, contents: string, opts: { encoding: any }) => Promise<void>;
    };

    const KEY = 'VOSWASH_SAF_DIR';
    let baseDirUri = await AsyncStorage.getItem(KEY);

    if (!baseDirUri) {
      console.log('📁 [NativePdfAdapter] No SAF directory configured, requesting access...');
      
      // Try to request Downloads directory directly (Android 10+)
      const downloadsUri = 'content://com.android.externalstorage.documents/tree/primary%3ADownload/document/primary%3ADownload';
      
      try {
        const perm = await SAF.requestDirectoryPermissionsAsync(downloadsUri);
        if (!perm.granted) {
          console.warn('⚠️ [NativePdfAdapter] Downloads access denied, asking user to choose folder');
          const fallbackPerm = await SAF.requestDirectoryPermissionsAsync();
          if (!fallbackPerm.granted) return null;
          baseDirUri = fallbackPerm.directoryUri;
        } else {
          baseDirUri = perm.directoryUri;
        }
      } catch (e) {
        console.warn('⚠️ [NativePdfAdapter] Direct Downloads access failed, asking user:', e);
        const perm = await SAF.requestDirectoryPermissionsAsync();
        if (!perm.granted) return null;
        baseDirUri = perm.directoryUri;
      }
      
      await AsyncStorage.setItem(KEY, baseDirUri);
      console.log('✅ [NativePdfAdapter] SAF directory configured:', baseDirUri);
    }

    // Ensure VOSWASH sub-folder exists
    let targetDirUri = baseDirUri;
    try {
      if (SAF.makeDirectoryAsync) {
        targetDirUri = await SAF.makeDirectoryAsync(baseDirUri, 'VOSWASH');
      } else if (SAF.createDirectoryAsync) {
        targetDirUri = await SAF.createDirectoryAsync(baseDirUri, 'VOSWASH');
      } else {
        const items = await SAF.readDirectoryAsync(baseDirUri);
        const existing = items.find(u => /VOSWASH\/?$/i.test(u));
        targetDirUri = existing || baseDirUri;
      }
    } catch {
      // Directory may already exist; try to find it
      try {
        const items = await SAF.readDirectoryAsync(baseDirUri);
        const existing = items.find(u => /VOSWASH\/?$/i.test(u));
        if (existing) targetDirUri = existing;
      } catch {}
    }

    // Prepare data to write
    let pdfBase64 = base64Data;
    if (!pdfBase64) {
      if (!fallbackPath) return null;
      const fallbackFile = new File(fallbackPath);
      pdfBase64 = await fallbackFile.base64();
    }

    // Try write; if name exists, append timestamp
    const tryCreate = async (name: string) => {
      try {
        const fileUri = await SAF.createFileAsync(targetDirUri, name, 'application/pdf');







        await SAF.writeAsStringAsync(fileUri, pdfBase64!, { encoding: 'base64' as any });
        return fileUri;
      } catch (e) {
        return null;
      }
    };

    let finalUri = await tryCreate(fileName);
    if (!finalUri) {
      const dot = fileName.lastIndexOf('.');
      const base = dot > 0 ? fileName.substring(0, dot) : fileName;
      const ext = dot > 0 ? fileName.substring(dot) : '';
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      finalUri = await tryCreate(`${base}_${ts}${ext}`);
    }

    return finalUri;
  }

  async generateSimpleListPdf(options: { title: string; columns: string[]; rows: string[][]; fileName?: string }): Promise<PdfResult> {
    try {
      const { title, columns, rows } = options;
      const fileName = options.fileName || `${title.replace(/\s+/g, '_')}.pdf`;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
        body { font-family: 'Helvetica','Arial',sans-serif; padding:24px; color:#111; }
        h1 { font-size:20px; margin:0 0 16px; color:#2563eb; }
        table { width:100%; border-collapse:collapse; }
        th { background:#f3f4f6; text-align:left; padding:8px; font-size:12px; border-bottom:2px solid #ddd; }
        td { padding:8px; font-size:12px; border-bottom:1px solid #eee; }
        tr:nth-child(even) td { background:#fafafa; }
      </style></head><body>
        <h1>${title}</h1>
        <table><thead><tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>
        ${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
        </tbody></table>
      </body></html>`;

      const { uri, base64 } = await Print.printToFileAsync({ html, base64: Platform.OS === 'android' } as any);
      const savedUri = await this.savePdfToDevice(uri, fileName, base64);
      return { filePath: savedUri, fileName, success: true };
    } catch (error) {
      return { fileName: options.fileName || 'list.pdf', success: false, error: error instanceof Error ? error.message : 'List PDF generation failed' };
    }
  }
}
