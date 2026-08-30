import { defineNuxtPlugin } from '#app'
import * as DesignSystemComponentsModule from 'sparc-design-system-components-2'
import { resolveVuePlugin } from '@/utils/vuePluginInterop.js'

export default defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.vueApp.use(resolveVuePlugin(DesignSystemComponentsModule))
})
