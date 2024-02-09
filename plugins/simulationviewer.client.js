import { SimulationVuer } from '@abi-software/simulationvuer'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("simulation-vuer", SimulationVuer);
})
