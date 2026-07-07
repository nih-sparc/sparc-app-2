// Rejects requests with SQL injection patterns or invalid paths before SSR runs.
// Prevents Algolia/Contentful calls being triggered by scanner traffic.

const SQL_PATTERNS = [
  /%2525/,                                       // double-encoded % — WAF bypass attempts
  /union[\s\/*]+(?:all[\s\/*]+)?select/i,        // UNION [ALL] SELECT
  /extractvalue\s*\(/i,                           // EXTRACTVALUE( — MySQL error injection
  /xmltype\s*\(/i,                                // XMLType( — Oracle error injection
  /cast\s*\(\s*['0]/i,                            // CAST('~ or CAST(0x — type coercion injection
  /0x[0-9a-f]{6,}/i,                              // long hex literals e.g. 0x717a7171
  /'\s*(?:and|or)\s+[\w\d]+\s*=\s*[\w\d]+/i,     // ' AND 1=1 / ' OR 1=1
  /'\s*(?:and|or)\s+[\w\d]+\s+in\s*\(/i,         // ' AND x IN (SELECT...
]

// Paths that will never exist on this Node.js server — reject immediately without SSR.
const BAD_PATH_PATTERNS = [
  /\.php(\?|$)/i,           // PHP file scans (webshells, WordPress exploits)
  /\/wp-(?:content|admin|includes|login|json)\//i,  // WordPress path scans
  /\.env(\.|$)/i,           // Environment file probes (.env, .env.backup, etc.)
  /\/vendor\/phpunit\//i,   // PHP unit exploit path
  /\/xmlrpc\.php/i,         // WordPress XML-RPC
  /\/adminer\.php/i,        // Adminer DB tool
  /\/phpmyadmin/i,          // phpMyAdmin
]

function reject(event, status) {
  const res = event.node.res
  res.statusCode = status
  res.end('Invalid request.')
}

export default defineEventHandler((event) => {
  const url = event?.node?.req?.url || ''
  const path = url.split('?')[0]

  // Block path-based scanner probes immediately (no PHP/WordPress on this server)
  if (BAD_PATH_PATTERNS.some(pattern => pattern.test(path))) {
    reject(event, 404)
    return
  }

  // Block SQL injection in query parameters
  const queryStart = url.indexOf('?')
  if (queryStart === -1) return

  const rawQuery = url.slice(queryStart + 1)
  let decoded = rawQuery
  try {
    decoded = decodeURIComponent(rawQuery)
  } catch {
    // malformed encoding — block it
    reject(event, 400)
    return
  }

  if (SQL_PATTERNS.some(pattern => pattern.test(decoded) || pattern.test(rawQuery))) {
    reject(event, 400)
    return
  }
})
