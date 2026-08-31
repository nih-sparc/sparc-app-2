import * as VueSocialSharingModule from 'vue-social-sharing'
import { resolveVuePlugin } from '@/utils/vuePluginInterop.js'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(resolveVuePlugin(VueSocialSharingModule) as any)
})
