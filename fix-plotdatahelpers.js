/**
 * @abi-software/plotdatahelpers bundles PapaParse's worker-inlining code as a double-quoted
 * string literal containing nested single-quoted 'undefined' checks. Rollup's CommonJS static
 * analyzer misparses that nesting and fails the build ("Expected ',', got 'undefined'").
 *
 * patch-package can't reliably apply a diff against this file (its patch-application step
 * fails even on a freshly-generated patch, likely due to the file's very long minified lines),
 * so this does the same one-line fix directly instead: swap the outer string delimiters from
 * double quotes to a template literal, which Rollup's parser doesn't stumble over.
 */
import { readFileSync, writeFileSync } from 'fs';

const path = 'node_modules/@abi-software/plotdatahelpers/dist/plotdatahelpers.js';

const oldStr = `new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", _, ")();"], { type: "text/javascript" })));`;
const newStr = `new Blob([\`var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; \`, "(", _, ")();"], { type: "text/javascript" })));`;

const content = readFileSync(path, 'utf8');

if (content.includes(newStr)) {
  console.log('plotdatahelpers fix already applied, skipping.');
} else if (content.includes(oldStr)) {
  writeFileSync(path, content.replace(oldStr, newStr));
  console.log('Applied plotdatahelpers Rollup-parse fix.');
} else {
  console.error(
    '⛔ Could not find the expected code in @abi-software/plotdatahelpers/dist/plotdatahelpers.js.\n' +
    '   The package may have been upgraded — check whether this workaround is still needed\n' +
    '   (see fix-plotdatahelpers.js) and update or remove it accordingly.'
  );
  process.exit(1);
}
