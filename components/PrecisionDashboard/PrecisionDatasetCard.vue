<template>
  <article class="dataset-card">
    <div class="dataset-card__image">
      <img v-if="banner" :src="banner" :alt="`${dataset.label} banner`" loading="lazy" />
      <div v-else class="dataset-card__placeholder">
        <img src="/logo-sparc-wave-primary.svg" alt="" />
        <span v-if="!dataset.sparcDatasetId">Preview available once the dataset is published</span>
      </div>
    </div>
    <div class="dataset-card__body">
      <h2 class="dataset-card__title">
        <!-- Stretched over the whole card, so clicking anywhere opens the dashboard -->
        <NuxtLink class="dataset-card__link" :to="to">{{ dataset.label }}</NuxtLink>
      </h2>
      <ul v-if="dataset.modalities?.length" class="dataset-card__tags">
        <li v-for="modality in dataset.modalities" :key="modality">{{ modality }}</li>
      </ul>
      <p class="dataset-card__description">{{ description }}</p>
      <div class="dataset-card__footer">
        <span class="dataset-card__cta" aria-hidden="true">Open dashboard →</span>
        <NuxtLink
          v-if="dataset.sparcDatasetId"
          class="dataset-card__details"
          :to="{ name: 'datasets-datasetId', params: { datasetId: dataset.sparcDatasetId } }"
        >
          Dataset details
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup>
/** One dataset on the Precision dataset selector; opens its dashboard. */
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  // An entry from precisionDatasetsFor()
  dataset: { type: Object, required: true },
  to: { type: [String, Object], required: true },
});

// Banner and description of the published dataset; the card falls back to the config's
// summary and a placeholder until they load, or when Discover doesn't have the dataset
const discover = ref(null);
const config = useRuntimeConfig();
onMounted(async () => {
  if (!props.dataset.sparcDatasetId) return;
  try {
    discover.value = await $fetch(
      `${config.public.discover_api_host}/datasets/${props.dataset.sparcDatasetId}`
    );
  } catch {
    // Placeholder stays
  }
});

const banner = computed(() => discover.value?.banner ?? null);
const description = computed(() => discover.value?.description?.trim() || props.dataset.summary);
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.dataset-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: $cochlear;
  border: 1px solid $lineColor1;
  border-radius: 8px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

  &:hover,
  &:focus-within {
    border-color: $purple;
    box-shadow: 0 6px 20px rgba(36, 36, 91, 0.12);
    transform: translateY(-2px);
  }
  &:focus-within {
    outline: 2px solid $purple;
    outline-offset: 2px;
  }
}

.dataset-card__image {
  position: relative;
  aspect-ratio: 16 / 9;
  background: $background;
  border-bottom: 1px solid $lineColor1;

  // Absolute, so a banner that isn't 16:9 is cropped instead of resizing the card
  > img,
  > .dataset-card__placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  > img {
    display: block;
    object-fit: cover;
  }
}

.dataset-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-sizing: border-box;
  padding: 16px;
  color: $neutralGrey;
  font-size: 14px;
  text-align: center;
  background: linear-gradient(135deg, $tooltipColor 0%, $background 100%);

  img {
    width: 30%;
    max-width: 120px;
    opacity: 0.6;
  }
}

.dataset-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px 24px;
}

.dataset-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
}

.dataset-card__link {
  color: $darkBlue;
  text-decoration: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  &:focus-visible {
    outline: none;
  }
}

.dataset-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 2px 10px;
    font-size: 14px;
    color: $purple;
    background: $tooltipColor;
    border-radius: 999px;
  }
}

.dataset-card__description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  line-height: 1.5;
  color: $grey;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.dataset-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 8px;
  font-size: 16px;
}

.dataset-card__cta {
  font-weight: 600;
  color: $purple;
}

// Above the stretched link, so it opens the dataset page rather than the dashboard
.dataset-card__details {
  position: relative;
  z-index: 1;
  color: $neutralGrey;
  text-decoration: underline;

  &:hover {
    color: $purple;
  }
}
</style>
