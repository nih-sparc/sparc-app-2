<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title="dataset.label" />
    <div class="px-32 py-4 page-actions">
      <NuxtLink class="all-datasets" to="/apps/precision-dashboard">← All datasets</NuxtLink>
      <PrecisionBetaTag />
    </div>
    <PrecisionDashboard :key="dataset.id" :dataset="dataset" :api2Url="api2Url" />
  </div>
</template>

<script setup>
import PrecisionBetaTag from "~/components/PrecisionDashboard/PrecisionBetaTag.vue";
import PrecisionDashboard from "~/components/PrecisionDashboard/PrecisionDashboard.vue";
import { precisionDatasetsFor, precisionApiHost } from "~/utils/precisionDatasets";

definePageMeta({
  // Unknown datasets, and ones with no data on this environment, are a 404
  validate: (route) =>
    precisionDatasetsFor(precisionApiHost(useRuntimeConfig())).some(
      (d) => d.id === route.params.datasetId
    ),
});

const api2Url = precisionApiHost(useRuntimeConfig());
const route = useRoute();
const dataset = computed(() =>
  precisionDatasetsFor(api2Url).find((d) => d.id === route.params.datasetId)
);

const breadcrumb = [
  { label: "Home", to: { name: "index" } },
  { label: "SPARC Apps", to: { name: "apps" } },
  { label: "Precision Dashboard", to: "/apps/precision-dashboard" },
];
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.page-container {
  background: #f6f7fb;
}
.page-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.all-datasets {
  font-size: 16px;
  color: $purple;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
