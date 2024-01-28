import auth from '@/services/auth.js'
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return
  // Re-direct the user to the home page if they are not logged in
  const user = await auth.user()
  if (user == null) {
    return navigateTo('/')
  }
})