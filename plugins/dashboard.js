import { installDashboard } from 'sparc-dashboard-beta/dist/index.js'
import 'sparc-dashboard-beta/dist/style.css'

export default defineNuxtPlugin((nuxtApp) => {
    installDashboard(nuxtApp.vueApp, nuxtApp.$pinia)
})
