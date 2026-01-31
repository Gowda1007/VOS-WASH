const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add `cjs` and `mjs` to support different module formats
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Ensure assets are properly bundled (and remove redundant extensions)
const defaultAssetExts = config.resolver.assetExts;
config.resolver.assetExts = [...new Set([...defaultAssetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt'])];

module.exports = config;
