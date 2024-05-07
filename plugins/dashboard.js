import mitt from 'mitt'
import { useGlobalVarsStore } from '../TestDashboard/src/stores/globalVars.ts'
import "../TestDashboard/tailwind/output.css"

const emitter = mitt();

const componentMap = [
    'ImageSelector',
    'FlatmapViewer',
    'BiolucidaViewer',
    'QDBChart'
]

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.provide('emitter', emitter)
    componentMap.forEach(comp=>{
        const asyncComponent = defineAsyncComponent(() => import(`@/TestDashboard/src/components/${comp}.vue`))
        nuxtApp.vueApp.component(comp, asyncComponent)
    })
    const globalVars = useGlobalVarsStore()
    globalVars.componentList = componentMap
})
