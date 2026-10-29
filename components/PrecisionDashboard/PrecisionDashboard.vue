<template>
  <div class="precision-dashboard">
    <div v-if="assetsLoading || datasetError" class="px-32 pb-4 dataset-status">
      <span v-if="assetsLoading">Loading dataset…</span>
      <span v-else class="dataset-error">{{ datasetError }}</span>
    </div>
    <ClientOnly>
      <MultiDashboard
        v-if="s3Url"
        class="dashboard-app"
        :dashboardOptions="dashboardOptions"
        :default="dashboardOptions[0]"
      ></MultiDashboard>
    </ClientOnly>
  </div>
</template>

<script setup>
/**
 * The Precision dashboard for one dataset (see utils/precisionDatasets.js).
 *
 * Links can open it on a tab, gene and column: `?dashboard=<tab name>&gene=…&gene2=…`
 * are read by MultiDashboard, `?metadataColumn=…` here. They're read once on load;
 * switching tabs doesn't change the URL.
 */
import { computed, markRaw } from "vue";
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

const props = defineProps({
  // An entry from precisionDatasetsFor(), with its packageId resolved
  dataset: { type: Object, required: true },
  // Discover API host for the dataset's assets
  api2Url: { type: String, required: true },
});

// --- Data ---
const {
  assets,
  cloudfront,
  loading: assetsLoading,
  error: assetsError,
} = useCoreViewerAssets({
  api2Url: props.api2Url,
  packageId: () => props.dataset.packageId ?? null,
  assetTypes: ["parquet"],
});

// Unsigned base URL; widgets sign each request from `cloudfront` when there is one
const s3Url = computed(
  () => props.dataset.url ?? assets.value[0]?.asset_url?.replace(/\/+$/, "") ?? null
);
const datasetError = computed(() =>
  assetsError.value ??
  (props.dataset.packageId && !assetsLoading.value && !assets.value.length
    ? "No dashboard data found for this dataset."
    : null)
);

// Widgets keep the selected genes and columns in a shared store that outlives this page,
// and only apply their starting values when it's empty: clear it so each dataset starts
// on its own defaults. Runs before the widgets mount.
const precisionStore = usePrecisionStore();
for (const key of [
  "selectedGene",
  "selectedGene1",
  "selectedGene2",
  "selectedGeneX",
  "selectedChromatinGene",
]) {
  precisionStore.setSelection(key, null);
}
precisionStore.setChromatinFocus(null);
// Cell atlas links pick the column to group by
const urlMetadataColumn = useRoute().query.metadataColumn;
precisionStore.setSelection(
  "selectedMetadataColumn",
  typeof urlMetadataColumn === "string" && urlMetadataColumn ? urlMetadataColumn : null
);

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

// Refs, not values: the dashboard copies `services` once, and refs are how loaded assets
// and renewed credentials reach the widgets
const services = {
  s3Url,
  cloudfront,
};

function widget(id, component, componentKey, componentName, Props, { x = 0, y = 0, w = 12, h = 12 } = {}) {
  return { id, x, y, w, h, componentKey, componentName, component, Props };
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
        // Full width, with the links table underneath; both fit on one screen
        { h: 7 }
      ),
      widget("LinkedPeaks-1", LinkedPeaks, "LinkedPeaks", "Linked Peaks", {
        initialGene: genes.chromatin,
        config,
      }, { y: 7, h: 6 }),
    ],
  }),
};

const dashboardOptions = props.dataset.tabs.map((tab) => {
  const { name, layout } = TABS[tab](props.dataset.defaultGenes || {}, props.dataset.config);
  return {
    // Per-dataset id, so saved layout and filters don't carry over between datasets
    id: `${props.dataset.id}:${tab}`,
    name,
    defaultLayout: layout,
    availableWidgets,
    services,
    hideEditGrid: true,
    hideHeader: true,
  };
});
</script>

<style scoped lang="scss">
/* set style vars from outside the dashboard > customize to match your application */
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
.dataset-status {
  font-size: 16px;
  color: #64748b;
}
.dataset-error {
  color: #b91c1c;
}
</style>
