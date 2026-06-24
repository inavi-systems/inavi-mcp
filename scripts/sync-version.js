/**
 * Sync version from package.json to manifest.json and server.json
 *
 * This script is automatically executed by npm's "version" lifecycle hook
 * when running commands like: npm version patch/minor/major
 *
 * Usage:
 *   npm version patch  -> Bumps 0.1.1 to 0.1.2 and syncs manifest.json + server.json
 *   npm version minor  -> Bumps 0.1.1 to 0.2.0 and syncs manifest.json + server.json
 *   npm version major  -> Bumps 0.1.1 to 1.0.0 and syncs manifest.json + server.json
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestPath = path.join(rootDir, 'manifest.json');
const serverJsonPath = path.join(rootDir, 'server.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Read and update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.version !== version) {
  console.log(`✅ Synced manifest.json version: ${manifest.version} -> ${version}`);
  manifest.version = version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
} else {
  console.log(`✅ manifest.json version is already ${version}`);
}

// Read and update server.json (MCP Registry metadata)
// Keeps both the top-level version and the npm package version in sync,
// since the registry requires the package version to match a published npm release.
const serverJson = JSON.parse(fs.readFileSync(serverJsonPath, 'utf8'));
const serverOldVersion = serverJson.version;
serverJson.version = version;
if (Array.isArray(serverJson.packages)) {
  serverJson.packages.forEach((pkg) => {
    pkg.version = version;
  });
}
fs.writeFileSync(serverJsonPath, JSON.stringify(serverJson, null, 2) + '\n');
console.log(`✅ Synced server.json version: ${serverOldVersion} -> ${version}`);
