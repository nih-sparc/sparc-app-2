import {installDashboard} from 'sparc-dashboard-beta'
export default defineNuxtPlugin((nuxtApp) => {
    const componentMap = [
        'FlatmapViewer',
        'ImageSelector',
        'BiolucidaViewer',
        'QDBGraph',
        'TextWidget',
        'CountWidget',
        'ScaffoldViewer'
    ]
    installDashboard(nuxtApp.vueApp, componentMap, nuxtApp.$pinia)
})
