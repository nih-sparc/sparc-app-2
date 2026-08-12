/**
 * Yarn Berry reruns the workspace's "postinstall" script whenever it detects the
 * dependency tree changed - which includes Heroku's post-build "yarn heroku prune"
 * step that strips devDependencies to shrink the cached node_modules. At that point
 * patch-package/nuxt/semver (all devDependencies) are already gone, so the real
 * steps below would fail with "command not found". The app was already built
 * correctly earlier in the same deploy (heroku-postbuild runs these steps while
 * devDependencies are still present), so it's safe to just skip here.
 */
import { existsSync } from 'fs';
import { execSync } from 'child_process';

if (!existsSync('node_modules/patch-package')) {
  console.log('postinstall: devDependencies not installed - skipping (nothing to patch/prepare).');
  process.exit(0);
}

execSync('patch-package', { stdio: 'inherit' });
execSync('node ./fix-plotdatahelpers.js', { stdio: 'inherit' });
execSync('nuxt prepare', { stdio: 'inherit' });
execSync('node ./verify-resolutions.js', { stdio: 'inherit' });
