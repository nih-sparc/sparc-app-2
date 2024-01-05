import { Hub } from "aws-amplify/utils"
import { signInWithRedirect, signOut, getCurrentUser } from "aws-amplify/auth"
import { useMainStore } from "@/store"

Hub.listen("auth", async ({ payload }) => {
  switch (payload.event) {
    case "signInWithRedirect":
      const route = useRoute()
      const path = route.fullPath
      const token = extractAccessToken(path)
      const expirationTime = extractTokenExpirationTime(path)
      if (token) {
        const config = useRuntimeConfig()
        const { $axios } = useNuxtApp()
        const request = `${config.public.LOGIN_API_URL}/user?api_key=${token}`
        await $axios.get(request).then(({ data }) => {
          const store = useMainStore()
          const userProfile = { ...data, 'apiKey': token }
          store.setUserProfile(userProfile)
        })
          .catch(err => {
            console.log(`Error retrieving pennsieve user: ${err}`)
            return null
          })
      }
      break;
    case 'signedOut':
      const store = useMainStore()
      store.setUserProfile(null)
      break;
  }
})

const extractAccessToken = (path) => {
  const ACCESS_TOKEN_TEXT = "access_token="
  const firstIndex = path.indexOf(ACCESS_TOKEN_TEXT)
  const lastIndex = path.indexOf("&", firstIndex + 1)
  if (firstIndex == -1 || firstIndex >= lastIndex) {
    return ''
  }
  return lastIndex == -1 ? path.substring(firstIndex + ACCESS_TOKEN_TEXT.length) : path.substring(firstIndex + ACCESS_TOKEN_TEXT.length, lastIndex)
}

const extractTokenExpirationTime = (path) => {
  const EXPIRES_TEXT = "expires_in="
  const firstIndex = path.indexOf(EXPIRES_TEXT)
  const lastIndex = path.indexOf("&", firstIndex + 1)
  if (firstIndex == -1 || firstIndex >= lastIndex) {
    return ''
  }
  return lastIndex == -1 ? path.substring(firstIndex + EXPIRES_TEXT.length) : path.substring(firstIndex + EXPIRES_TEXT.length, lastIndex)
}

const login = async(providerName) => {
  const provider = {
    custom: providerName
  }
  try {
    signInWithRedirect(provider)
  } catch(err) {
    console.log("Error signing in: ", err)
  }
}

const logout = async() => {
  try {
    await signOut()
  } catch (err) {
    console.log("Error signing out: ", err)
  }
}

const user = async() => {
  try {
    const user = await getCurrentUser()
    return user
  } catch (err) {
    console.log("Could not get user: ", err)
    return null
  }
}

export default {
  login,
  logout,
  user
}
