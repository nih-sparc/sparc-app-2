import axios from "axios"
import { useMainStore } from "@/store"

export default defineNuxtPlugin((nuxtApp) => {
  const store = useMainStore(nuxtApp.$pinia)
  let params = {}
  const accessToken = store.$state.userProfile?.apiKey//localStorage.getItem('apiKey');
  if (accessToken && accessToken !== '') {
    params.api_key = `${accessToken}`;
  }
  const apiClient = axios.create({
    params: params
  })
  return {
    provide: {
      pennsieveApiClient: apiClient
    },
  }
})
