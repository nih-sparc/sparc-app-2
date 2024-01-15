import { Auth, Amplify, Hub } from "aws-amplify"
import { useMainStore } from "@/store"
import { pathOr, isEmpty } from 'ramda'

Hub.listen("auth", async ({ payload }) => {
  console.log("AUTH EVENT = ", payload)
  switch (payload.event) {
    /*case "signInWithRedirect":
      const route = useRoute()
      const path = route.fullPath
      const token = extractAccessToken(path)
      const expirationAge = extractTokenExpirationAge(path)
      const userCookie = useCookie('userToken', {
        maxAge: expirationAge
      })
      const currentTime = new Date().getTime()
      const expirationTime = new Date(currentTime + expirationAge * 1000)
      if (!isEmpty(token)) {
        //userCookie.value = token
        const config = useRuntimeConfig()
        const { $axios } = useNuxtApp()
        const request = `${config.public.LOGIN_API_URL}/user?api_key=${token}`
        await $axios.get(request).then(({ data }) => {
          const store = useMainStore()
          const userProfile = { ...data, 'apiKey': token, 'tokenExp': expirationTime }
          store.setUserProfile(userProfile)
        })
        .catch(err => {
          console.log(`Error retrieving pennsieve user: ${err}`)
          return null
        })
      }
      break;*/
    case 'signOut':
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

const extractTokenExpirationAge = (path) => {
  const EXPIRES_TEXT = "expires_in="
  const firstIndex = path.indexOf(EXPIRES_TEXT)
  const lastIndex = path.indexOf("&", firstIndex + 1)
  if (firstIndex == -1 || firstIndex >= lastIndex) {
    return ''
  }
  return lastIndex == -1 ? parseInt(path.substring(firstIndex + EXPIRES_TEXT.length)) : parseInt(path.substring(firstIndex + EXPIRES_TEXT.length, lastIndex))
}

const user = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser()
    return user
  } catch (err) {
    return null
  }
}

const login = async(providerName) => {
  const provider = {
    customProvider: providerName
  }
  try {
    await Auth.federatedSignIn(provider)
    //await signInWithRedirect(provider)
  } catch (e) {
    console.log("ERROR = ", e)
    //await logout()
  }
}

const isTokenExpired = async () => {
  return false
  /*const session = await fetchAuthSession()
  const accessToken = pathOr(null, ['tokens', 'accessToken', 'payload'], session)
  if (accessToken == null) {
    return true
  }
  const expirationTime = accessToken.exp
  const expirationDate = new Date(expirationTime * 1000) // Have to convert UNIX seconds to milliseconds
  const currentDate = new Date()
  return expirationDate <= currentDate.getTime()*/
}

const logout = async() => {
  try {
    console.log("LOGGING OUT")
    await Auth.signOut().then(async (response) => {
      console.log("USER = ", await user())
    })
  } catch (err) {
    console.log("Error signing out: ", err)
  }
}

export default {
  login,
  logout,
  user,
  isTokenExpired
}
