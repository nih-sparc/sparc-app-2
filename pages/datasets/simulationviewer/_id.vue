<template>
  <div class="simulation-viewer-page">
    <div class="page-wrap container">
      <content-tab-card
        class="mt-24"
        :tabs="tabs"
        :active-tab-id="activeTabId"
      >
        <div class="simulation-vuer-container">
          <!--<SimulationVuer :apiLocation="apiLocation" :id="id" />-->
        </div>
      </content-tab-card>
    </div>
  </div>
</template>

<script>

export default {
  name: "SimulationViewerPage",
  components: {
    //SimulationVuer: import("@abi-software/simulationvuer").then(m => m.SimulationVuer)
  },
  setup: function () {
    const route = useRoute()
    const config = useRuntimeConfig()
    return {
      activeTabId: "simulationViewer",
      apiLocation: config.public.portal_api,
      id: Number(route.query.id),
      tabs: [
        {
          label: "Simulation Viewer",
          id: "simulationViewer",
        }
      ],
    }
  },
};
</script>

<style lang="scss">
.simulation-vuer-container {
  //@import '~@abi-software/simulationvuer/dist/simulationvuer';
  min-height: 24px;
}
</style>
