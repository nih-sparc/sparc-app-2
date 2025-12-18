/**
 * Yarn only warns about version mismatches, and those warnings are easily missed among
 * the many other warnings during installation.
 * This script explicitly checks for specific packages listed here and either shows
 * clear warnings or fails with --strict mode.
 */

import { readFileSync } from 'fs';
import semver from 'semver';

// List of packages to check
const PACKAGES_TO_CHECK = ['@abi-software/flatmapvuer'];

const isStrict = process.argv.includes('--strict');

console.log(`Starting resolution check for: ${PACKAGES_TO_CHECK.join(', ')}...`);
console.log(`Mode: ${isStrict ? 'STRICT (will fail on mismatches)' : 'WARNING (will not block installation)'}\n`);

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const allResolutions = pkg.resolutions || {};
let lockFile;
let hasError = false;
let hasWarning = false;

try {
  lockFile = readFileSync('./yarn.lock', 'utf8');
} catch (e) {
  console.log('No yarn.lock found. Skipping check.');
  process.exit(0);
}

for (const pkgName of PACKAGES_TO_CHECK) {
  const forcedVersion = allResolutions[pkgName];

  if (!forcedVersion) {
    console.warn(`Warning: "${pkgName}" is not listed in "resolutions". Skipping.`);
    continue;
  }

  const cleanForcedVersion = forcedVersion.replace(/[\^~]/g, '');

  // Regex to find this specific dependency nested inside other packages in yarn.lock
  // Matches: 4 spaces + "pkgName" + space + "versionRange"
  const depRegex = new RegExp(`^\\s{4}(?:"?)${pkgName}(?:"?) "(.+)"$`, 'gm');

  let match;

  while ((match = depRegex.exec(lockFile)) !== null) {
    const requestedRange = match[1];

    if (!semver.satisfies(cleanForcedVersion, requestedRange)) {
      const message = isStrict ? '❌  INCOMPATIBLE RESOLUTION DETECTED' : '⚠️  POTENTIAL INCOMPATIBILITY DETECTED';
      console.warn(`\n${message}`);
      console.warn(`   Package:       ${pkgName}`);
      console.warn(`   Requested:     "${requestedRange}" (by a dependency)`);
      console.warn(`   Forced:        "${forcedVersion}" (in your resolutions)`);
      console.warn(`   Status:        Mismatch! The forced version does not satisfy the request.`);

      if (isStrict) {
        hasError = true;
      } else {
        hasWarning = true;
      }
    }
  }
}

if (hasError) {
  console.error('\n⛔ Installation blocked due to resolution mismatches.');
  console.error('   Please check the logs above and adjust your resolutions or dependencies.');
  process.exit(1);
}

if (hasWarning) {
  console.log('\n⚠️  Warnings detected, but installation will proceed.');
  console.log('   Review the warnings above. Run with --strict flag to enforce compatibility.');
}

if (!hasError && !hasWarning) {
  console.log('✅ Resolution compatibility check passed for all packages.');
}
