<template>
  <div class="page-container">
    <Breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="px-32 py-4">
      <el-tooltip
        placement="right-start"
        content="Under active development"
        popper-class="beta-tooltip"
        effect="customized"
      >
        <template #default>
          <div class="beta-tag">
            <el-icon class="beta-icon"><WarningFilled /></el-icon>Beta
          </div>
        </template>
      </el-tooltip>
    </div>
    <div class="px-32 pb-4 dataset-picker">
      <span class="dataset-label">Dataset:</span>
      <el-select v-model="selectedDatasetId" class="dataset-select">
        <el-option v-for="d in datasets" :key="d.id" :label="d.label" :value="d.id" />
      </el-select>
      <span v-if="assetsLoading" class="dataset-status">Loading dataset…</span>
      <span v-else-if="datasetError" class="dataset-status dataset-error">{{ datasetError }}</span>
    </div>
    <ClientOnly>
      <!-- Keyed by dataset: switching remounts the widgets so they load the new data -->
      <MultiDashboard
        v-if="s3Url"
        :key="selectedDatasetId"
        class="dashboard-app"
        :dashboardOptions="dashboardOptions"
        :default="defaultDashboard"
      ></MultiDashboard>
    </ClientOnly>
  </div>
</template>
<script setup>
import { ref, computed, watch, markRaw } from "vue";
// Aliased: the app has its own auto-imported useViewerAssets
import { useViewerAssets as useCoreViewerAssets } from "@pennsieve-viz/core";
import { MultiDashboard } from "pennsieve-dashboard";
import {
  GeneExpression as GeneExpressionWidget,
  SideBySide as SideBySideWidget,
  GeneXDistribution as GeneXDistributionWidget,
  ProportionPlot as ProportionPlotWidget,
  ChromatinAccessibility as ChromatinAccessibilityWidget,
  LinkedPeaks as LinkedPeaksWidget,
  usePrecisionStore,
} from "precision-dashwidgets";
import "pennsieve-dashboard/style.css";
import "precision-dashwidgets/style.css";
import { precisionDatasetsFor } from "~/utils/precisionDatasets";

const title = "Precision Dashboard";
const breadcrumb = [
  {
    label: "Home",
    to: {
      name: "index",
    },
  },
  {
    to: {
      name: "apps",
    },
    label: "SPARC Apps",
  },
];

// --- Dataset (see utils/precisionDatasets.js) ---
// Trimmed: a config var saved with a trailing space would otherwise hide the package
// datasets and break the API URL
const api2Url = String(useRuntimeConfig().public.PRECISION_DISCOVER_API_HOST || "")
  .trim()
  .replace(/\/+$/, "");
const datasets = precisionDatasetsFor(api2Url);
const selectedDatasetId = ref(datasets[0]?.id ?? null);
const selectedDataset = computed(() => datasets.find((d) => d.id === selectedDatasetId.value));

const {
  assets,
  cloudfront,
  loading: assetsLoading,
  error: assetsError,
} = useCoreViewerAssets({
  api2Url,
  packageId: () => selectedDataset.value?.packageId ?? null,
  assetTypes: ["parquet"],
});

// Unsigned base URL; widgets sign each request from `cloudfront` when there is one
const s3Url = computed(
  () => selectedDataset.value?.url ?? assets.value[0]?.asset_url?.replace(/\/+$/, "") ?? null
);
const datasetError = computed(() =>
  assetsError.value ??
  (selectedDataset.value?.packageId && !assetsLoading.value && !assets.value.length
    ? "No dashboard data found for this dataset."
    : null)
);

// Widgets keep the selected genes and columns in a shared store and only apply their
// starting values when it's empty: clear it so each dataset starts on its own defaults
const precisionStore = usePrecisionStore();
watch(selectedDatasetId, () => {
  for (const key of [
    "selectedGene",
    "selectedMetadataColumn",
    "selectedGene1",
    "selectedGene2",
    "selectedGeneX",
    "selectedChromatinGene",
  ]) {
    precisionStore.setSelection(key, null);
  }
  precisionStore.setChromatinFocus(null);
});

// --- Dashboards ---
// markRaw: the dashboard keeps these in reactive state, and components must not be made reactive
const GeneExpression = markRaw(GeneExpressionWidget);
const SideBySide = markRaw(SideBySideWidget);
const GeneXDistribution = markRaw(GeneXDistributionWidget);
const ProportionPlot = markRaw(ProportionPlotWidget);
const ChromatinAccessibility = markRaw(ChromatinAccessibilityWidget);
const LinkedPeaks = markRaw(LinkedPeaksWidget);

const availableWidgets = [
  { name: "GeneExpression", component: GeneExpression },
  { name: "SideBySide", component: SideBySide },
  { name: "GeneXDistribution", component: GeneXDistribution },
  { name: "ProportionPlot", component: ProportionPlot },
  { name: "ChromatinAccessibility", component: ChromatinAccessibility },
  { name: "LinkedPeaks", component: LinkedPeaks },
];

// Refs, not values: the dashboard copies `services` once, and refs are how a dataset
// switch and renewed credentials reach the widgets
const services = {
  s3Url,
  cloudfront,
};

function widget(id, component, componentKey, componentName, Props, { x = 0, w = 12 } = {}) {
  return { id, x, y: 0, w, h: 16, componentKey, componentName, component, Props };
}

// One dashboard (tab) per entry in the dataset's `tabs`
const TABS = {
  coexpression: (genes, config) => ({
    name: "Gene CoExpression",
    layout: [
      widget("GeneEx-1", GeneExpression, "GeneExpression", "Gene Expression", {
        initialGene1: genes.gene1,
        initialGene2: genes.gene2,
        config,
      }),
    ],
  }),
  sideBySide: (genes, config) => ({
    name: "Side By Side",
    layout: [
      widget("SideBySide-1", SideBySide, "SideBySide", "Side By Side Comparison", {
        initialGene: genes.sideBySide,
        config,
      }),
    ],
  }),
  distribution: (genes, config) => ({
    name: "Gene Distribution",
    layout: [
      widget(
        "GeneXDistribution-1",
        GeneXDistribution,
        "GeneXDistribution",
        "Gene Expression Distribution",
        { initialGene: genes.geneX, config }
      ),
    ],
  }),
  proportion: (genes, config) => ({
    name: "Proportion Plot",
    layout: [widget("ProportionPlot-1", ProportionPlot, "ProportionPlot", "Proportion Plot", { config })],
  }),
  chromatin: (genes, config) => ({
    name: "Chromatin Accessibility",
    layout: [
      widget(
        "ChromatinAccessibility-1",
        ChromatinAccessibility,
        "ChromatinAccessibility",
        "Chromatin Accessibility",
        { initialGene: genes.chromatin, config },
        { w: 6 }
      ),
      widget("LinkedPeaks-1", LinkedPeaks, "LinkedPeaks", "Linked Peaks", {
        initialGene: genes.chromatin,
        config,
      }, { x: 6, w: 6 }),
    ],
  }),
};

const dashboardOptions = computed(() => {
  const dataset = selectedDataset.value;
  if (!dataset) return [];
  return dataset.tabs.map((tab) => {
    const { name, layout } = TABS[tab](dataset.defaultGenes || {}, dataset.config);
    return {
      // Per-dataset id, so saved layout and filters don't carry over between datasets
      id: `${dataset.id}:${tab}`,
      name,
      defaultLayout: layout,
      availableWidgets,
      services,
      hideEditGrid: true,
      hideHeader: true,
    };
  });
});
const defaultDashboard = computed(() => dashboardOptions.value[0]);
</script>

<style scoped lang="scss">
/* set style vars from outside the dashboard > customize to match your application */
.page-container {
  background: #f6f7fb;
}
.dashboard-app {
  --el-color-primary: #243d8e;
  --el-color-primary-light-3: #fbfdff;
  --el-color-primary-dark-2: #546085;
  --color: #243d8e;
  --el-dialog-width: 90%;
  --dash-secondary: #981f3280;
  --dash-background: #f6f7fb;
  /* Precision widgets follow --el-color-primary above. To give them their own look
     on this page, set --precision-* here (see the precision-dashwidgets README, "Theming"),
     e.g. --precision-primary: #243d8e; */
  height: 900px;
}

.beta-tooltip {
  display: flex;
  width: fit-content;
}
.beta-tag {
  display: flex;
  width: fit-content;
  color: #ff8400;
}
.beta-icon {
  font-size: 25px;
}
.dataset-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}
.dataset-label {
  font-weight: 600;
}
.dataset-select {
  width: 360px;
}
.dataset-status {
  color: #64748b;
}
.dataset-error {
  color: #b91c1c;
}
:deep(.grid-stack-item) {
  width: 100%;
  height: 100% !important;
}
:deep(.beta-icon svg > path) {
  fill: #ff8400 !important;
}
:global(.beta-tooltip.el-popper.is-customized .el-popper__arrow::before) {
  background-color: #ffe8ec !important;
}
:global(.beta-tooltip.el-popper.is-customized) {
  background: #ffe8ec !important;
  border-color: #981f32 !important;
  border-radius: 4px;
}
</style>
