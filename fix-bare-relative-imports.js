/**
 * Several AWS Amplify-family packages (amazon-cognito-identity-js, @aws-amplify/auth,
 * @aws-amplify/core) use extensionless relative imports/requires (e.g. `require('./Amplify')`,
 * `import { Platform } from './Platform'`) pointing at either a plain file (needs `.js`
 * appended) or a directory with an index file (needs `/index.js` appended). This is
 * completely valid, standard CommonJS/Node resolution.
 *
 * But Nitro's server bundle routes these through @rollup/plugin-commonjs's
 * "commonjs-external" interop-wrapping step, which does not replicate Node's full module
 * resolution (no bare-directory-index fallback, no automatic extension appending) — it
 * fails with "Could not resolve './X' from './X?commonjs-external'" for every single one
 * of these, one at a time as each is discovered.
 *
 * Rather than patch each newly-discovered instance individually (very slow given each
 * fix requires a CI round-trip), this recursively scans the known-affected packages'
 * build output and rewrites every extensionless relative import/require to its concrete
 * resolved path, so Rollup's resolver never has to guess.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve as resolvePath } from 'path';

const PACKAGE_DIRS = [
  'node_modules/amazon-cognito-identity-js/lib',
  'node_modules/amazon-cognito-identity-js/es',
  'node_modules/@aws-amplify/auth/lib',
  'node_modules/@aws-amplify/auth/lib-esm',
  'node_modules/@aws-amplify/core/lib',
  'node_modules/@aws-amplify/core/lib-esm',
];

const IMPORT_RE = /((?:require\(|from\s+)["'])(\.[^"'?]+)(["')])/g;

function resolveConcretePath(fromDir, target) {
  const abs = resolvePath(fromDir, target);
  if (existsSync(abs + '.js')) return target + '.js';
  if (existsSync(abs) && statSync(abs).isDirectory() && existsSync(join(abs, 'index.js'))) {
    return target + '/index.js';
  }
  // Already has an extension, or points at something else (e.g. .json) — leave as-is.
  return null;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

// Known cross-package bare-subpath imports (not relative, so IMPORT_RE above doesn't
// touch them) that hit the same commonjs-external resolution failure. Each target
// directory here doesn't have its own index.js — its package.json "main" field points
// elsewhere — so this can't be handled by the generic relative-import resolver above.
const CROSS_PACKAGE_FIXES = [
  {
    file: 'node_modules/@aws-amplify/auth/lib/Auth.js',
    from: 'require("amazon-cognito-identity-js/internals")',
    to: 'require("amazon-cognito-identity-js/lib/internals/index.js")',
  },
  {
    file: 'node_modules/@aws-amplify/auth/lib-esm/Auth.js',
    from: "from 'amazon-cognito-identity-js/internals'",
    to: "from 'amazon-cognito-identity-js/lib/internals/index.js'",
  },
];

let totalFixed = 0;

for (const { file, from, to } of CROSS_PACKAGE_FIXES) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  if (content.includes(to)) continue; // already fixed
  if (content.includes(from)) {
    writeFileSync(file, content.replace(from, to));
    totalFixed++;
    console.log(`Fixed cross-package import in ${file}`);
  } else {
    console.error(`⛔ Expected pattern not found in ${file} — package may have changed, check if this fix is still needed.`);
    process.exit(1);
  }
}

for (const packageDir of PACKAGE_DIRS) {
  if (!existsSync(packageDir)) continue;

  for (const file of walk(packageDir)) {
    const content = readFileSync(file, 'utf8');
    let changed = false;

    const newContent = content.replace(IMPORT_RE, (match, prefix, target, suffix) => {
      const concrete = resolveConcretePath(dirname(file), target);
      if (concrete && concrete !== target) {
        changed = true;
        return prefix + concrete + suffix;
      }
      return match;
    });

    if (changed) {
      writeFileSync(file, newContent);
      totalFixed++;
      console.log(`Fixed bare relative imports in ${file}`);
    }
  }
}

console.log(`\nDone. Rewrote imports in ${totalFixed} file(s).`);
