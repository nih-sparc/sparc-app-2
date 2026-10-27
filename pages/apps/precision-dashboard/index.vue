<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="px-32 py-4">
      <PrecisionBetaTag />
    </div>
    <PrecisionDatasetSelector class="px-32 pb-48" :datasets="datasets" />
  </div>
</template>

<script setup>
import PrecisionBetaTag from "~/components/PrecisionDashboard/PrecisionBetaTag.vue";
import PrecisionDatasetSelector from "~/components/PrecisionDashboard/PrecisionDatasetSelector.vue";
import {
  precisionDatasetsFor,
  precisionApiHost,
  LEGACY_DATASET_ID,
  LEGACY_QUERY_PARAMS,
} from "~/utils/precisionDatasets";

definePageMeta({
  middleware: [
    // Links from before the selector (e.g. the cell atlas's
    // ?dashboard=genedistribution&gene=…) open the Atlas dashboard with the same query.
    // Replaced, so Back skips the old URL instead of redirecting again.
    (to) => {
      if (LEGACY_QUERY_PARAMS.some((param) => param in to.query)) {
        return navigateTo(
          { path: `/apps/precision-dashboard/${LEGACY_DATASET_ID}`, query: to.query },
          { replace: true }
        );
      }
    },
  ],
});

const title = "Precision Dashboard";
const breadcrumb = [
  { label: "Home", to: { name: "index" } },
  { label: "SPARC Apps", to: { name: "apps" } },
];

const datasets = precisionDatasetsFor(precisionApiHost(useRuntimeConfig()));
</script>

<style scoped lang="scss">
.page-container {
  background: #f6f7fb;
}
</style>
