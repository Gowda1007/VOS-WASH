import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

// PNG assets exist; keep primary PNG load with fallback to bundled base64 .txt
const LOGO_MODULE = require('../../assets/logo.png');
const BANNER_MODULE = require('../../assets/sri-vari.png');
const LOGO_B64_MODULE = require('../../assets/logo.b64.txt');
const BANNER_B64_MODULE = require('../../assets/sri-vari.b64.txt');

let cachedLogoBase64: string | null = null;
let cachedBannerBase64: string | null = null;

async function loadAndCacheAssetFromPng(module: any, cacheName: string): Promise<string> {
  try {
    const asset = Asset.fromModule(module);
    if (!asset.downloaded) {
      await asset.downloadAsync();
    }
    const uri = asset.localUri || asset.uri;
    if (!uri) throw new Error(`Cannot resolve URI for ${cacheName}`);
    // Read PNG as base64 using new File API
    const file = new File(uri);
    const base64 = await file.base64();
    if (!base64 || base64.length < 100) throw new Error('PNG base64 seems empty');
    console.log(`✅ [AssetLoader] Loaded ${cacheName} from PNG: ${base64.length} bytes`);
    return base64;
  } catch (error) {
    console.error(`❌ [AssetLoader] Failed PNG load for ${cacheName}:`, error);
    // Fallback: read bundled base64 text asset
    try {
      const txtModule = cacheName === 'logo' ? LOGO_B64_MODULE : BANNER_B64_MODULE;
      const txtAsset = Asset.fromModule(txtModule);
      if (!txtAsset.downloaded) {
        await txtAsset.downloadAsync();
      }
      const txtUri = txtAsset.localUri || txtAsset.uri;
      if (!txtUri) throw new Error(`Cannot resolve fallback txt URI for ${cacheName}`);
      const txtFile = new File(txtUri);
      const base64 = await txtFile.text();
      if (!base64 || base64.length < 100) throw new Error('Fallback base64 seems empty');
      console.log(`✅ [AssetLoader] Loaded ${cacheName} from fallback txt: ${base64.length} bytes`);
      return base64.trim();
    } catch (fallbackErr) {
      console.error(`❌ [AssetLoader] Fallback txt load failed for ${cacheName}:`, fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function getLogoBase64(): Promise<string> {
  if (!cachedLogoBase64) {
    cachedLogoBase64 = await loadAndCacheAssetFromPng(LOGO_MODULE, 'logo');
  }
  return cachedLogoBase64;
}

export async function getBannerBase64(): Promise<string> {
  if (!cachedBannerBase64) {
    cachedBannerBase64 = await loadAndCacheAssetFromPng(BANNER_MODULE, 'banner');
  }
  return cachedBannerBase64;
}

// Preload assets on app start
export async function preloadAssets(): Promise<void> {
  try {
    console.log('🚀 [AssetLoader] Preloading assets...');
    await Promise.all([
      getLogoBase64(),
      getBannerBase64(),
    ]);
    console.log('✅ [AssetLoader] All assets preloaded successfully');
  } catch (error) {
    console.error('❌ [AssetLoader] Failed to preload assets:', error);
  }
}
