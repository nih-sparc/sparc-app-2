import axios from "axios";
import { useMainStore } from "@/store"
import auth from '@/services/auth.js'
export default defineNuxtPlugin(async (nuxtApp) => {
  const store = useMainStore(nuxtApp.$pinia)
  const instance = axios.create({})

  instance.interceptors.response.use(async (response) => {
    /*if (await auth.user() == null) {
      return response
    }
    else if (await auth.isTokenExpired()) {
      store.logout()
    }*/
    return response
  }, async ( error ) => {
    if (await auth.user() == null) {
      return error
    }
    /*else if (await auth.isTokenExpired()) {
      store.logout()
    }*/
    return error
  })
  return {
    provide: {
      axios: instance,
    },
  }
})
