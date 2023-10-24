import axios from "axios";
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      axios: axios.create({}),
    },
  }
})
