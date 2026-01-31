import path from 'node:path';
import fs from 'node:fs';
import Jimp from 'jimp';

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generateSquareIcon({ srcPath, destPath, size = 1024, background = 0xffffffff }) {
  const src = await Jimp.read(srcPath);
  // Create square background
  const canvas = new Jimp(size, size, background);

  // Scale the logo to fit within the square while preserving aspect ratio
  const scale = Math.min(size / src.bitmap.width, size / src.bitmap.height);
  const newW = Math.round(src.bitmap.width * scale);
  const newH = Math.round(src.bitmap.height * scale);
  src.resize(newW, newH, Jimp.RESIZE_BILINEAR);

  const x = Math.round((size - newW) / 2);
  const y = Math.round((size - newH) / 2);

  canvas.composite(src, x, y);
  await canvas.writeAsync(destPath);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const serverLogo = path.resolve(projectRoot, '..', 'server', 'assets', 'logo.png');
  const mobileAssets = path.resolve(projectRoot, 'assets');

  if (!fs.existsSync(serverLogo)) {
    console.error(`Source logo not found at: ${serverLogo}`);
    process.exit(1);
  }

  await ensureDir(mobileAssets);

  const iconPath = path.resolve(mobileAssets, 'icon.png');
  const adaptiveIconPath = path.resolve(mobileAssets, 'adaptive-icon.png');

  // Generate 1024x1024 icons from the server logo
  await generateSquareIcon({ srcPath: serverLogo, destPath: iconPath, size: 1024, background: 0xffffffff });
  await generateSquareIcon({ srcPath: serverLogo, destPath: adaptiveIconPath, size: 1024, background: 0xffffffff });

  console.log('Generated icons:');
  console.log(` - ${iconPath}`);
  console.log(` - ${adaptiveIconPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
