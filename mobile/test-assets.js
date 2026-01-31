// Quick asset verification test
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying asset setup for production build...\n');

const assetsDir = path.join(__dirname, 'assets');
const requiredAssets = [
  'logo.png',
  'sri-vari.png',
  'icon.png',
  'logo.b64.txt',
  'sri-vari.b64.txt'
];

let allGood = true;

requiredAssets.forEach(asset => {
  const assetPath = path.join(assetsDir, asset);
  const exists = fs.existsSync(assetPath);
  
  if (exists) {
    const stats = fs.statSync(assetPath);
    const size = stats.size;
    console.log(`✅ ${asset}: ${(size / 1024).toFixed(2)} KB`);
    
    // For .b64.txt files, verify they contain valid base64
    if (asset.endsWith('.b64.txt')) {
      const content = fs.readFileSync(assetPath, 'utf8').trim();
      if (content.length < 100) {
        console.log(`   ⚠️  Warning: ${asset} seems too small (${content.length} chars)`);
        allGood = false;
      } else if (!content.match(/^[A-Za-z0-9+/=]+$/)) {
        console.log(`   ⚠️  Warning: ${asset} doesn't look like valid base64`);
        allGood = false;
      } else {
        console.log(`   📦 Base64 validated: ${content.length} characters`);
      }
    }
  } else {
    console.log(`❌ ${asset}: MISSING`);
    allGood = false;
  }
});

console.log('\n📋 Checking app.json configuration...');
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

if (appJson.expo.assetBundlePatterns?.includes('assets/**/*')) {
  console.log('✅ assetBundlePatterns configured correctly');
} else {
  console.log('❌ assetBundlePatterns missing or incorrect');
  allGood = false;
}

if (appJson.expo.icon === './assets/icon.png') {
  console.log('✅ App icon configured correctly');
} else {
  console.log('❌ App icon path incorrect');
  allGood = false;
}

console.log('\n📋 Checking metro.config.js...');
const metroConfigPath = path.join(__dirname, 'metro.config.js');
const metroConfig = fs.readFileSync(metroConfigPath, 'utf8');

if (metroConfig.includes("'txt'")) {
  console.log('✅ Metro configured to bundle .txt files');
} else {
  console.log('❌ Metro not configured for .txt files');
  allGood = false;
}

console.log('\n📋 Checking assetLoader.ts...');
const assetLoaderPath = path.join(__dirname, 'src', 'assets', 'assetLoader.ts');
const assetLoader = fs.readFileSync(assetLoaderPath, 'utf8');

if (assetLoader.includes('logo.b64.txt') && assetLoader.includes('sri-vari.b64.txt')) {
  console.log('✅ Asset loader has base64 fallbacks configured');
} else {
  console.log('❌ Asset loader missing base64 fallback references');
  allGood = false;
}

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All asset checks passed! Ready for production build.');
  console.log('\nRun: eas build -p android --profile production');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Fix the issues above before building.');
  process.exit(1);
}
