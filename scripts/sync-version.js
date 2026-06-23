/**
 * Sync version from package.json to manifest.json
 *
 * This script is automatically executed by npm's "version" lifecycle hook
 * when running commands like: npm version patch/minor/major
 *
 * Usage:
 *   npm version patch  -> Bumps 0.1.1 to 0.1.2 and syncs manifest.json
 *   npm version minor  -> Bumps 0.1.1 to 0.2.0 and syncs manifest.json
 *   npm version major  -> Bumps 0.1.1 to 1.0.0 and syncs manifest.json
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestPath = path.join(rootDir, 'manifest.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Read and update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const oldVersion = manifest.version;

if (oldVersion === version) {
  console.log(`✅ manifest.json version is already ${version}`);
  process.exit(0);
}

manifest.version = version;

// Write updated manifest.json with 2-space indentation
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`✅ Synced manifest.json version: ${oldVersion} -> ${version}`);
