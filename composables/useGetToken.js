import { useMainStore } from '@/store/index.js'

/**
 * The signed-in visitor's Pennsieve token for download-service: with one,
 * downloads go through api2's /downloads/public as that user (embargoed
 * datasets need it); without one, anonymously through the public downloads
 * API.
 *
 * SPARC visitors sign in as themselves: Cognito's hosted UI on Pennsieve's
 * user pool (services/auth.js), and the store keeps their access token, as
 * the other api2 calls use it. The token isn't refreshed; once it expires the
 * visitor is signed out (middleware/authToken.global.js), so an expired token
 * counts as none. The server never has one.
 * @returns {Promise<String>}
 */
export default async function () {
  if (import.meta.server) return ''
  const store = useMainStore()
  const token = store.userToken
  if (!token) return ''
  if (store.tokenExp && new Date(store.tokenExp) <= new Date()) return ''
  return token
}
