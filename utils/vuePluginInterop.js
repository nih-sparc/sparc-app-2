// Some UMD/CJS-only Vue plugin packages (no ESM entry) end up wrapped in extra
// layers of `.default` once Vite's CJS interop synthesizes an ES module
// namespace for them - the exact nesting depth has changed across Vite majors.
// Walk `.default` until something shaped like a Vue plugin (a function, or an
// object with an `install` function) turns up, instead of hardcoding a depth.
export function resolveVuePlugin(mod, maxDepth = 5) {
  let candidate = mod
  for (let i = 0; i < maxDepth && candidate; i++) {
    if (typeof candidate === 'function' || typeof candidate.install === 'function') {
      return candidate
    }
    candidate = candidate.default
  }
  return mod
}
