<template>
  <section class="dataset-selector">
    <h1 class="dataset-selector__heading">Choose a dataset</h1>
    <p class="dataset-selector__intro">
      Each dataset opens in its own dashboard for exploring gene expression across cell types.
    </p>
    <div class="dataset-selector__grid">
      <PrecisionDatasetCard
        v-for="dataset in datasets"
        :key="dataset.id"
        :dataset="dataset"
        :to="`/apps/precision-dashboard/${dataset.id}`"
      />
    </div>
  </section>
</template>

<script setup>
/** The Precision dashboard's landing page: a card per dataset. */
import PrecisionDatasetCard from "./PrecisionDatasetCard.vue";

defineProps({
  // From precisionDatasetsFor()
  datasets: { type: Array, required: true },
});
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.dataset-selector {
  max-width: 1200px;
}

.dataset-selector__heading {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: $darkBlue;
}

.dataset-selector__intro {
  margin: 0 0 24px;
  font-size: 16px;
  color: $neutralGrey;
}

.dataset-selector__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
  gap: 32px;
}
</style>
