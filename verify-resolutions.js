import { readFileSync } from 'fs';
import semver from 'semver';

// List of packages to check
const PACKAGES_TO_CHECK = ['@abi-software/flatmapvuer'];

console.log(`Starting resolution check for: ${PACKAGES_TO_CHECK.join(', ')}...`);

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const allResolutions = pkg.resolutions || {};
let lockFile;
let hasError = false;

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
      console.error('\n❌  INCOMPATIBLE RESOLUTION DETECTED');
      console.error(`   Package:       ${pkgName}`);
      console.error(`   Requested:     "${requestedRange}" (by a dependency)`);
      console.error(`   Forced:        "${forcedVersion}" (in your resolutions)`);
      console.error(`   Status:        Mismatch! The forced version does not satisfy the request.`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\n⛔ Installation blocked due to resolution mismatches.');
  console.error('   Please check the logs above and adjust your resolutions or dependencies.');
  process.exit(1);
}

console.log('✅ Resolution compatibility check passed for all packages.');
