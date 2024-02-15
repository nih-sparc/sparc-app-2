import { MapContent } from '@abi-software/mapintegratedvuer'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("map-content", MapContent);
})

